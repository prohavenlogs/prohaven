import { supabase } from '@/integrations/supabase/client';

// Email sending function - calls Supabase Edge Function
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
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    });

    if (error) {
      console.error('Email error:', error);
      return { success: false, error };
    }

    if (data && !data.success) {
      console.error('Email sending failed:', data.error);
      return { success: false, error: data.error };
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

  invoice: (fullName: string, orderNumber: string, productName: string, amount: number) => ({
    subject: `Invoice - Order ${orderNumber}`,
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
            .invoice-box {
              background: white;
              padding: 25px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #e5e7eb;
            }
            .invoice-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .invoice-row:last-child {
              border-bottom: none;
              font-weight: bold;
              font-size: 1.2em;
              color: #667eea;
            }
            .status-badge {
              display: inline-block;
              background: #fef3c7;
              color: #d97706;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
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
            <h1>Invoice</h1>
            <p style="margin: 0; opacity: 0.9;">Order ${orderNumber}</p>
          </div>
          <div class="content">
            <h2>Hi ${fullName},</h2>
            <p>Thank you for your purchase! Here are your order details:</p>
            <div class="invoice-box">
              <div class="invoice-row">
                <span>Order Number:</span>
                <span>${orderNumber}</span>
              </div>
              <div class="invoice-row">
                <span>Product:</span>
                <span>${productName}</span>
              </div>
              <div class="invoice-row">
                <span>Status:</span>
                <span class="status-badge">Pending</span>
              </div>
              <div class="invoice-row">
                <span>Total Amount:</span>
                <span>$${amount.toFixed(2)}</span>
              </div>
            </div>
            <p>Your order is being processed. You will receive a notification once it's ready.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing ProHavenLogs!</p>
            <p style="font-size: 12px; color: #999;">
              This is an automated invoice. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  orderApproved: (customerName: string, orderNumber: string, productName: string, amount: number, orderDate: string) => ({
    subject: `🎉 Order Approved - ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Approved</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f23;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Order Approved!</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your order has been processed successfully</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="background-color: #1a1a2e; padding: 40px 30px;">
                      <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 25px 0;">
                        Hi <strong style="color: #10b981;">${customerName}</strong>,
                      </p>
                      <p style="color: #a0aec0; font-size: 15px; margin: 0 0 30px 0; line-height: 1.6;">
                        Great news! Your order has been approved and is ready. Below are your order details.
                      </p>

                      <!-- Invoice Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; overflow: hidden;">
                        <tr>
                          <td style="padding: 25px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td colspan="2" style="padding-bottom: 20px; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                                  <p style="color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 5px 0;">Invoice</p>
                                  <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">${orderNumber}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">Product</p>
                                  <p style="color: #ffffff; font-size: 15px; font-weight: 500; margin: 5px 0 0 0;">${productName}</p>
                                </td>
                                <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">Date</p>
                                  <p style="color: #ffffff; font-size: 15px; margin: 5px 0 0 0;">${orderDate}</p>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">Payment Method</p>
                                  <p style="color: #ffffff; font-size: 15px; margin: 5px 0 0 0;">Account Balance</p>
                                </td>
                                <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: right;">
                                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">Status</p>
                                  <span style="display: inline-block; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Completed</span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 20px 0 0 0;">
                                  <p style="color: #a0aec0; font-size: 13px; margin: 0;">Total Amount</p>
                                </td>
                                <td style="padding: 20px 0 0 0; text-align: right;">
                                  <p style="color: #10b981; font-size: 28px; font-weight: 700; margin: 0;">$${amount.toFixed(2)}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Info Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px;">
                        <tr>
                          <td style="padding: 15px 20px;">
                            <p style="color: #818cf8; font-size: 14px; margin: 0; line-height: 1.5;">
                              📦 Your product details are now available in your dashboard. Log in to view and access your purchase.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                        <tr>
                          <td align="center">
                            <a href="https://prohavenlogs.com/orders" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">View My Orders</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #16162a; padding: 30px; border-radius: 0 0 16px 16px; text-align: center;">
                      <p style="color: #10b981; font-size: 18px; font-weight: 700; margin: 0 0 5px 0;">ProHavenLogs</p>
                      <p style="color: #64748b; font-size: 13px; margin: 0 0 20px 0;">Premium Digital Products</p>
                      <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.6;">
                        Thank you for your purchase!<br>
                        If you have any questions, contact our support team.
                      </p>
                      <p style="color: #334155; font-size: 11px; margin: 20px 0 0 0;">
                        © ${new Date().getFullYear()} ProHavenLogs. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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
