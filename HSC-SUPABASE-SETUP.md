# HSC Supabase Setup Guide

## ✅ Step 1: Set up your Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Name it "HSC" or "Hillsmere Shores Classifieds"
4. Choose a secure database password
5. Select a region (closest to your community)
6. Click "Create new project"

## ✅ Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these three values:
   - **Project URL** (e.g., `https://abcdefghijk.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`) ⚠️ **Keep this secret!**

## ✅ Step 3: Set up Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Resend Configuration (for magic email)
RESEND_API_KEY=your_resend_api_key_here

# JWT Secret for token signing (generate a random string)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Community Configuration (for IP geofencing)
COMMUNITY_IP_RANGES=192.168.1.0/24,10.0.0.0/8
```

## ✅ Step 4: Create Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql` into the editor
4. Click "Run" to execute the schema
5. ✅ You should see success messages for all tables and policies

## ✅ Step 5: Generate JWT Secret

Run this command in your terminal to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `JWT_SECRET` in `.env.local`

## ✅ Step 6: Get Your Resend API Key

1. Go to [resend.com](https://resend.com) and sign in
2. Go to **API Keys** in your dashboard
3. Click "Create API Key"
4. Name it "HSC Magic Email"
5. Copy the key and paste it as `RESEND_API_KEY` in `.env.local`

## ✅ Step 7: Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check that there are no errors in the console

3. Test the connection by running:
   ```bash
   npm run test:supabase
   ```
   (We'll create this test script next)

## 🚀 What We've Built

### Database Schema
- **users** - Community members with email verification
- **auth_tokens** - Secure magic links and QR codes
- **listings** - Classifieds with public/private visibility
- **qr_codes** - Quick login codes for users

### Security Features
- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- Token expiration (24 hours)
- IP geofencing support (ready for implementation)

### Privacy Model
- **Public listings** - Visible to anyone
- **Private listings** - Only for verified community members
- **Magic email** - Secure login without passwords
- **QR codes** - Quick access for returning users

## 🔄 Next Steps

Once your setup is complete, we'll implement:

1. **Magic email flow** - Send login links via Resend
2. **IP geofencing** - Auto-verify community members
3. **QR code generation** - Quick login for mobile users
4. **Listing integration** - Connect to your existing form
5. **User sessions** - Persistent login state

## 🆘 Troubleshooting

### Common Issues:

**"Cannot read properties of undefined"**
- Check that all environment variables are set correctly
- Restart your development server after changing `.env.local`

**"JWT secret is required"**
- Make sure you generated and set the `JWT_SECRET`
- Verify it's at least 32 characters long

**"Supabase connection failed"**
- Double-check your Project URL and API keys
- Make sure you're using the correct keys (not the JWT secret)

**"RLS policy errors"**
- Make sure you ran the full schema in SQL Editor
- Check that all policies were created successfully

## 📞 Ready to Continue?

Once you've completed this setup, let me know and we'll start implementing the magic email authentication flow! 