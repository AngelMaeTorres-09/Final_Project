import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export async function POST(request: NextRequest) {
  try {
    const { subject, message } = await request.json();
    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Email broadcast service not configured.' }, { status: 500 });
    }

    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .not('email', 'is', null);

    if (userError) {
      console.error('Fetch users error:', userError);
      return NextResponse.json({ error: 'Unable to retrieve user emails.' }, { status: 500 });
    }

    const emailList = users?.map((user: any) => user.email).filter(Boolean);
    if (!emailList || emailList.length === 0) {
      return NextResponse.json({ error: 'No registered emails found.' }, { status: 404 });
    }

    const { error: mailError } = await supabase.functions.invoke('send-broadcast-email', {
      body: JSON.stringify({ subject, message, recipients: emailList }),
    });

    if (mailError) {
      console.error('Email function error:', mailError);
      return NextResponse.json({ error: 'Email function failed.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sentCount: emailList.length });
  } catch (error: any) {
    console.error('Broadcast route error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected server error.' }, { status: 500 });
  }
}
