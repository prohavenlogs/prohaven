import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

// Email sending function
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'ProHavenLogs <onboarding@resend.dev>', // Replace with your domain when verified
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

// Email templates
export const emailTemplates = {
  welcome: (fullName: string) => ({
    subject: 'Welcome to ProHavenLogs - Confirm Your Email!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ProHavenLogs</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to ProHavenLogs!</h1>
          </div>
          <div class="content">
            <h2>Hi ${fullName},</h2>
            <p>Thank you for creating your account!</p>
            <p>Please confirm your email address to complete your registration and access all features.</p>
            <p><strong>Important:</strong> Check your email inbox for the confirmation link to verify your account.</p>
            <p>Once confirmed, you'll be able to:</p>
            <ul>
              <li>Add funds to your account balance</li>
              <li>Browse and purchase products</li>
              <li>Track your orders and transactions</li>
              <li>Manage your account settings</li>
            </ul>
          </div>
          <div class="footer">
            <p>Best regards,<br/><strong>The ProHavenLogs Team</strong></p>
            <p style="font-size: 12px; color: #999;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  orderConfirmation: (fullName: string, orderNumber: string, productName: string, amount: number) => ({
    subject: `Order Confirmed - ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
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
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .order-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #10b981;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${fullName},</h2>
            <p>Your order has been confirmed and is being processed.</p>
            <div class="order-details">
              <h3>Order Details:</h3>
              <p><strong>Order Number:</strong> ${orderNumber}</p>
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
              <p><strong>Status:</strong> <span style="color: #10b981;">Completed</span></p>
            </div>
            <p>You can view your order details anytime from your dashboard.</p>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!<br/><strong>ProHavenLogs Team</strong></p>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (resetLink: string) => ({
    subject: 'Reset Your ProHavenLogs Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
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
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p><strong>If you didn't request this,</strong> please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>ProHavenLogs Team</p>
          </div>
        </body>
      </html>
    `,
  }),
};
