// lib/email.ts
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailData) {
  if (!resend) {
    console.warn("Resend API key not configured. Email not sent:", {
      to,
      subject,
    });
    return { id: "mock-email-id", message: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Quiet Hours <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Email sending failed:", error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Email service error:", error);
    throw error;
  }
}

export function generateBlockReminderEmail(
  title: string,
  startTime: string,
  endTime: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quiet Hours Reminder</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #000;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .block-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #000;
          }
          .time {
            font-size: 18px;
            font-weight: bold;
            color: #000;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔇 Quiet Hours Reminder</h1>
        </div>
        <div class="content">
          <p>Your quiet study block is starting in <strong>10 minutes</strong>!</p>
          
          <div class="block-info">
            <h2>${title}</h2>
            <div class="time">
              📅 ${startTime} → ${endTime}
            </div>
          </div>
          
          <p>Time to focus and get into your study zone. Good luck! 🎯</p>
          
          <div class="footer">
            <p>This is an automated reminder from Quiet Hours</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
