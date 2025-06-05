# Vercel Deployment Guide

This project is optimized for deployment on Vercel. Follow these steps to deploy your ShipFast application.

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo-name)

## Manual Deployment Steps

### 1. Prerequisites

- Vercel account
- Supabase project set up
- Stripe account (for payments)
- Mailgun account (for emails)

### 2. Environment Variables

In your Vercel dashboard, add these environment variables:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
```

**Optional (but recommended):**
```
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
MAILGUN_API_KEY=your_mailgun_api_key
EMAIL_SERVER=your_email_server
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 3. Deploy

1. Connect your GitHub repository to Vercel
2. Configure the build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

3. Add environment variables in Vercel dashboard
4. Deploy!

### 4. Post-Deployment

1. Update your Supabase project settings:
   - Add your Vercel domain to the allowed origins
   - Update redirect URLs in Authentication > URL Configuration

2. Configure Stripe webhooks:
   - Add your Vercel domain webhook endpoint: `https://your-domain.vercel.app/api/webhook/stripe`

3. Update your domain configuration in `config.ts`

## Performance Optimizations

This project includes several Vercel-specific optimizations:

- ✅ Standalone output for smaller bundle size
- ✅ Image optimization with WebP/AVIF support
- ✅ Automatic static optimization
- ✅ Edge functions for API routes
- ✅ Gzip compression
- ✅ Cache headers for API responses

## Troubleshooting

### Build Errors

If you encounter build errors:

1. Check that all required environment variables are set
2. Ensure your Supabase keys are valid
3. Verify that all dependencies are properly installed

### Runtime Errors

1. Check Vercel function logs in the dashboard
2. Verify environment variables are correctly set
3. Ensure Supabase URLs are accessible from Vercel

### Performance Issues

1. Use the Vercel Analytics tab to monitor performance
2. Check for large bundle sizes in the build output
3. Consider enabling ISR for dynamic pages

## Support

For deployment issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
