import { env } from '~/config/env';
import { EVENT_NAME } from '~/config/event';
import { sendEmail } from '~/email/client';

type GiveawayCode = {
  creditType: {
    displayName: string;
    emailInstructions: string | null;
  };
  code: {
    codeValue: string;
    redeemUrl: string | null;
  };
};

type SendGiveawayNotificationEmailParams = {
  to: string;
  name: string;
  codes: GiveawayCode[];
};

type GiveawayEmailContent = {
  html: string;
  text: string;
};

export function generateGiveawayEmailContent(name: string, codes: GiveawayCode[]): GiveawayEmailContent {
  const greeting = `Hi ${name}`;

  const creditsSection = codes
    .map(({ creditType, code }) => {
      const redeemSection = code.redeemUrl
        ? `<p style="margin: 4px 0 0; font-size: 13px; line-height: 20px; color: #3f3f46;"><strong>Redeem:</strong> <a href="${code.redeemUrl}" target="_blank" style="color: #18181b; text-decoration: underline;">${code.redeemUrl}</a></p>`
        : '';
      const instructionsSection = creditType.emailInstructions
        ? `<p style="margin: 4px 0 0; font-size: 13px; line-height: 20px; color: #3f3f46;">${creditType.emailInstructions}</p>`
        : '';

      return `
        <div style="margin: 0 0 16px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #18181b;">
          <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #18181b;">${creditType.displayName}</p>
          <p style="margin: 0 0 4px; font-size: 14px; line-height: 22px; color: #3f3f46;"><strong>Code:</strong> <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">${code.codeValue}</code></p>
          ${redeemSection}
          ${instructionsSection}
        </div>
      `;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New credit — ${EVENT_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 40px 32px;">
              <div style="display: inline-block; padding: 6px 12px; background-color: #dbeafe; border-radius: 9999px; margin-bottom: 16px;">
                <span style="font-size: 12px; font-weight: 600; color: #1e40af;">NEW CREDIT</span>
              </div>
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">You've received a new credit!</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #3f3f46;">${greeting},</p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #3f3f46;">Great news! You've been assigned ${codes.length === 1 ? 'a new credit' : 'new credits'} for ${EVENT_NAME}.</p>
              
              <h2 style="margin: 28px 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">Your new ${codes.length === 1 ? 'credit' : 'credits'}</h2>
              
              ${creditsSection}

              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #71717a;">You can view all your credits anytime in your <a href="${env.APP_BASE_URL}/dashboard" target="_blank" style="color: #18181b; text-decoration: underline;">dashboard</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const creditsText = codes
    .map(({ creditType, code }) => {
      const redeemText = code.redeemUrl ? `\nRedeem: ${code.redeemUrl}` : '';
      const instructionsText = creditType.emailInstructions ? `\n${creditType.emailInstructions}` : '';
      return `${creditType.displayName}\nCode: ${code.codeValue}${redeemText}${instructionsText}`;
    })
    .join('\n\n');

  const text = `${greeting},

You've received a new credit!

Great news! You've been assigned ${codes.length === 1 ? 'a new credit' : 'new credits'} for ${EVENT_NAME}.

YOUR NEW ${codes.length === 1 ? 'CREDIT' : 'CREDITS'}
${creditsText}

You can view all your credits anytime in your dashboard: ${env.APP_BASE_URL}/dashboard`;

  return { html, text };
}

export const GIVEAWAY_EMAIL_SUBJECT = `You've received a new credit! — ${EVENT_NAME}`;

export async function sendGiveawayNotificationEmail({ to, name, codes }: SendGiveawayNotificationEmailParams) {
  const { html, text } = generateGiveawayEmailContent(name, codes);

  return sendEmail({
    to,
    subject: GIVEAWAY_EMAIL_SUBJECT,
    html,
    text,
  });
}
