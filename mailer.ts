import nodemailer from 'nodemailer';

// 1. Setup the Transporter
// This is your "engine" that connects to Google
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'angelmaestorres0809@gmail.com',
        pass: 'bjof coqt uglz gnhh', // Put your 16-character App Password here
    },
});

// 2. Define a function to send the announcement
async function sendAnnouncement(userEmails: string[], articleTitle: string, articleUrl: string) {
    try {
        const mailOptions = {
            from: `"Vibe." <angelmaestorres0809@gmail.com>`,
            // IMPORTANT: Use 'bcc' so users don't see each other's email addresses
            bcc: userEmails.join(', '),
            subject: `New Article: ${articleTitle}`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2>Hey there! 🚀</h2>
          <p>I just published a new article: <strong>${articleTitle}</strong></p>
          <a href="${articleUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Read Article
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">
            If you don't want these emails, you can reply "Unsubscribe".
          </p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Emails sent successfully:', info.messageId);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}

// 3. Example usage (How you would call it in your app)
const users = ['user1@gmail.com', 'user2@yahoo.com', 'friend@outlook.com'];
sendAnnouncement(users, "How to use SMTP with TypeScript", "https://mywebsite.com/post/1");