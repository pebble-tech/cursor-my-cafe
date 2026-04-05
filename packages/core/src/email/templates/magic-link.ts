import { EVENT_NAME_SHORT } from '~/config/event';
import { sendEmail } from '~/email/client';

type SendMagicLinkEmailParams = {
  to: string;
  url: string;
  name?: string;
};

export async function sendMagicLinkEmail({ to, url, name }: SendMagicLinkEmailParams) {
  const greeting = name ? `Hi ${name}` : 'Hi';
  const title = `Sign in to ${EVENT_NAME_SHORT}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">${title}</h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #3f3f46;">${greeting},</p>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #3f3f46;">Click the button below to sign in to your account. This link will expire in 1 hour.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #18181b;">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">Sign in</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0; font-size: 14px; line-height: 20px; color: #71717a;">If you didn't request this email, you can safely ignore it.</p>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 8px 0 0; font-size: 12px; line-height: 18px; color: #3b82f6; word-break: break-all;">${url}</p>
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

Sign in to ${EVENT_NAME_SHORT} by clicking this link:
${url}

This link will expire in 1 hour.

If you didn't request this email, you can safely ignore it.`;

  return sendEmail({
    to,
    subject: title,
    html,
    text,
  });
}
