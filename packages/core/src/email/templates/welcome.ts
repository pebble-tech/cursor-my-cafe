import { env } from '~/config/env';
import {
  EVENT_DATE_LINE,
  EVENT_LUMA_URL,
  EVENT_NAME,
  EVENT_TIME_SUMMARY,
  EVENT_VENUE_FULL_ADDRESS,
} from '~/config/event';
import { sendEmail } from '~/email/client';

type SendWelcomeEmailParams = {
  to: string;
  name: string;
};

export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailParams) {
  const platformUrl = env.APP_BASE_URL;
  const greeting = `Hi ${name}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${EVENT_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">Welcome to ${EVENT_NAME}!</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #3f3f46;">${greeting},</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #3f3f46;">You're registered for ${EVENT_NAME}. We're excited to see you there.</p>
              
              <div style="margin: 28px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #18181b;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #18181b;">Event details</p>
                <p style="margin: 0 0 4px; font-size: 14px; line-height: 22px; color: #3f3f46;"><strong>Date:</strong> ${EVENT_DATE_LINE}</p>
                <p style="margin: 0 0 4px; font-size: 14px; line-height: 22px; color: #3f3f46;"><strong>Time:</strong> ${EVENT_TIME_SUMMARY}</p>
                <p style="margin: 0 0 4px; font-size: 14px; line-height: 22px; color: #3f3f46;"><strong>Venue:</strong> ${EVENT_VENUE_FULL_ADDRESS}</p>
                <p style="margin: 0; font-size: 14px; line-height: 22px; color: #3f3f46;"><strong>More info &amp; RSVP:</strong> <a href="${EVENT_LUMA_URL}" target="_blank" style="color: #18181b;">${EVENT_LUMA_URL}</a></p>
              </div>

              <h2 style="margin: 28px 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">How to log in</h2>
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: #3f3f46;">Sign in with Google (recommended) or use a magic link if you don't have a Google account. Use the same email address you registered with.</p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #18181b;">
                    <a href="${platformUrl}/login" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Go to platform</a>
                  </td>
                </tr>
              </table>
              
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `${greeting},

Welcome to ${EVENT_NAME}!

You're registered for ${EVENT_NAME}. We're excited to see you there.

EVENT DETAILS
Date: ${EVENT_DATE_LINE}
Time: ${EVENT_TIME_SUMMARY}
Venue: ${EVENT_VENUE_FULL_ADDRESS}
More info: ${EVENT_LUMA_URL}

HOW TO LOG IN
Sign in with Google (recommended) or use a magic link if you don't have a Google account. Use the same email address you registered with.

Platform: ${platformUrl}/login`;

  return sendEmail({
    to,
    subject: `Welcome to ${EVENT_NAME}!`,
    html,
    text,
  });
}
