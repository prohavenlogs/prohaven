# Resend Email Service Setup Guide

This guide will help you set up Resend as your email service provider for ProHavenLogs.

## Why Resend?

- **3,000 emails/month free** (much better than Supabase's limitations)
- Better email deliverability
- Modern, developer-friendly API
- Professional email templates
- Easy domain verification

## Setup Steps

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** at [https://resend.com/api-keys](https://resend.com/api-keys)
3. Click **Create API Key**
4. Give it a name (e.g., "ProHavenLogs Production")
5. Select the appropriate permissions (Full Access for now)
6. Copy the API key (it starts with `re_`)

### 3. Add API Key to Your Project

1. Open your `.env` file in the project root
2. Replace `re_YOUR_API_KEY_HERE` with your actual API key:
   ```env
   VITE_RESEND_API_KEY="re_abc123xyz..."
   ```
3. Save the file
4. Restart your development server

### 4. Update Email "From" Address (Optional)

By default, emails are sent from `onboarding@resend.dev`. This works for testing, but for production:

1. **Verify your domain** in Resend dashboard:
   - Go to [https://resend.com/domains](https://resend.com/domains)
   - Click **Add Domain**
   - Follow the DNS setup instructions

2. **Update the "from" address** in `/src/lib/email.ts`:
   ```typescript
   from: 'ProHavenLogs <noreply@yourdomain.com>',
   ```

## Email Templates Available

The following email templates are ready to use:

1. **Welcome Email** (`emailTemplates.welcome`)
   - Sent when user signs up
   - Includes email verification instructions
   - Currently implemented in SignUp.tsx

2. **Order Confirmation** (`emailTemplates.orderConfirmation`)
   - Ready to use when order processing is implemented
   - Includes order details and receipt

3. **Password Reset** (`emailTemplates.passwordReset`)
   - Ready to use when password reset feature is implemented
   - Includes secure reset link

## Usage Example

```typescript
import { sendEmail, emailTemplates } from "@/lib/email";

// Send welcome email
const template = emailTemplates.welcome(userFullName);
const result = await sendEmail({
  to: userEmail,
  subject: template.subject,
  html: template.html,
});

if (!result.success) {
  console.error("Email failed:", result.error);
}
```

## Testing

### Test Email Sending

1. Start your development server: `npm run dev`
2. Navigate to the sign-up page
3. Create a new account with a real email address
4. Check your inbox for the welcome email

### Verify in Resend Dashboard

1. Go to [https://resend.com/emails](https://resend.com/emails)
2. You'll see all sent emails with their status
3. Click on any email to see:
   - Delivery status
   - Email content
   - Error logs (if any)

## Troubleshooting

### "Invalid API Key" Error

- Make sure your API key starts with `re_`
- Verify the key is correctly pasted in `.env` (no extra spaces)
- Restart your development server after updating `.env`

### Emails Not Being Delivered

- Check the Resend dashboard for delivery status
- Verify the recipient email address is valid
- Check spam/junk folders
- For production, make sure your domain is verified

### "Rate Limit Exceeded" Error

- Free tier: 3,000 emails/month
- If you hit the limit, consider upgrading or implementing email batching

## Free Tier Limits

- **3,000 emails per month**
- **100 emails per day** (can be increased with verification)
- All email types included
- Full API access

## Need Help?

- Resend Documentation: [https://resend.com/docs](https://resend.com/docs)
- Resend Support: [https://resend.com/support](https://resend.com/support)
- Check your Resend dashboard for email logs and errors

## Migration Complete ✅

The following changes have been made to your codebase:

- ✅ Installed `resend` package
- ✅ Created `/src/lib/email.ts` with email service and templates
- ✅ Updated `/src/pages/SignUp.tsx` to use Resend
- ✅ Added `VITE_RESEND_API_KEY` to `.env`
- ✅ Email templates ready for welcome, orders, and password reset

**Next Step**: Get your Resend API key and add it to `.env`, then test the sign-up flow!
