import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey
  ? createServerClient(supabaseUrl, supabaseServiceKey, { cookies: { getAll: () => [], setAll: () => {} } })
  : null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAllUserEmails() {
  if (!supabase) return [];

  const authAdmin = supabase.auth as any;
  const emails: string[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await authAdmin.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const pageUsers = data?.users ?? [];
    emails.push(...pageUsers.map((user: any) => user.email).filter(Boolean));

    if (!data?.nextPage || page >= data?.lastPage) {
      break;
    }

    page = data.nextPage;
  }

  return emails;
}

export async function POST(request: NextRequest) {
  try {
    const { subject, message } = await request.json();
    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Email broadcast service not configured. Missing SUPABASE_SERVICE_ROLE_KEY.' }, { status: 500 });
    }

    const emailList = await getAllUserEmails();
    if (!emailList || emailList.length === 0) {
      return NextResponse.json({ error: 'No registered emails found.' }, { status: 404 });
    }

    const sendResults: { email: string; success: boolean; error?: string }[] = [];
    const sendDelayMs = 1200;

    const sendOtpEmail = async (recipient: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email: recipient,
        options: {
          shouldCreateUser: false,
          data: { subject, message, broadcast: true },
        },
      });
      return error;
    };

    for (const email of emailList) {
      try {
        let error = await sendOtpEmail(email);
        if (error) {
          const isRateLimit = error.code === 'over_email_send_rate_limit' || error.status === 429 || /rate limit/i.test(error.message || '');
          if (isRateLimit) {
            await sleep(2500);
            const retryError = await sendOtpEmail(email);
            if (retryError) {
              sendResults.push({ email, success: false, error: retryError.message });
            } else {
              sendResults.push({ email, success: true });
            }
          } else {
            sendResults.push({ email, success: false, error: error.message });
          }
        } else {
          sendResults.push({ email, success: true });
        }
      } catch (sendError: any) {
        sendResults.push({ email, success: false, error: sendError?.message ?? String(sendError) });
      }

      await sleep(sendDelayMs);
    }

    const successful = sendResults.filter((result) => result.success).length;
    const failed = sendResults.filter((result) => !result.success).length;

    if (failed > 0) {
      return NextResponse.json({
        success: successful > 0,
        sentCount: successful,
        failedCount: failed,
        totalRecipients: emailList.length,
        partialFailure: true,
        message: 'Built-in Supabase email service sent partially. Some recipients failed.',
        failedEmails: sendResults.filter((result) => !result.success),
      });
    }

    return NextResponse.json({
      success: true,
      sentCount: successful,
      totalRecipients: emailList.length,
    });
  } catch (error: any) {
    console.error('Broadcast route error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected server error.' }, { status: 500 });
  }
}
