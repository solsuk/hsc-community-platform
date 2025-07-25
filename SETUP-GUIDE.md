# HSC Setup Guide

## Quick Start

### 1. Environment Configuration
```bash
# Copy the environment template
cp env-template.txt .env.local

# Edit .env.local with your actual values:
# - Supabase project URL and keys
# - Resend API key  
# - Community IP range for geofencing
```

### 2. Database Setup
```bash
# Run the Supabase schema (in your Supabase dashboard SQL editor)
# Copy and execute the contents of supabase-schema.sql
```

### 3. Development Server
```bash
npm run dev
# Server will start on http://localhost:3000 (or next available port)
```

## Authentication System

### Core Features ✅
- **Magic Email Links**: Users request login links via email
- **IP Geofencing**: Automatic community verification for local IPs  
- **QR Code Generation**: Quick login system for future visits
- **JWT Sessions**: Secure 24-hour token expiration
- **Community Approval**: Manual approval for non-geofenced users

### API Endpoints
- `POST /api/auth/send-magic-link` - Request magic email
- `GET /api/auth/verify?token=...` - Verify magic link token
- `GET /api/auth/me` - Check current session
- `POST /api/auth/logout` - Clear session

### Components
- `useAuth()` - Authentication state hook
- `<LoginForm />` - Magic link request form
- `<AuthStatus />` - User status display

## Required Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
JWT_SECRET=333f998f57ebda6531ce30b5f75f4aa42cac3f1841890f8ca9155d4b2ea947cd
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email
RESEND_API_KEY=your_resend_api_key

# Geofencing
COMMUNITY_IP_RANGE=192.168.1.0/24
```

## Project Structure

```
hsc-new/
├── src/
│   ├── app/
│   │   ├── api/auth/          # Authentication API routes
│   │   ├── auth/verify/       # Email verification page
│   │   ├── page.tsx          # Main application page
│   │   └── layout.tsx        # App layout
│   ├── components/
│   │   ├── AuthStatus.tsx    # User auth status
│   │   ├── LoginForm.tsx     # Magic link form
│   │   └── ...               # Other UI components
│   ├── hooks/
│   │   └── useAuth.ts        # Authentication hook
│   └── lib/
│       ├── auth.ts           # Auth utilities
│       └── supabase.ts       # Database client
├── memory-bank/              # Project documentation
├── supabase-schema.sql       # Database schema
└── env-template.txt          # Environment variables template
```

## Testing the Authentication Flow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Magic Email**
   - Navigate to http://localhost:3000
   - Enter your email address
   - Check your email for the magic link
   - Click the link to authenticate

3. **Test QR Code**
   - After authentication, QR code is generated
   - Save/print the QR code for future quick login
   - Test QR code login flow

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy - authentication will work automatically

### Environment Setup for Production
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Ensure Supabase RLS policies are properly configured
- Test email delivery in production environment

## Troubleshooting

### Common Issues
- **"Missing JWT_SECRET"**: Ensure environment variables are loaded
- **Email not sending**: Check Resend API key configuration
- **Database errors**: Verify Supabase connection and schema
- **Geofencing not working**: Check IP range configuration

### Development Tips
- Use localhost testing for IP geofencing development
- Check browser console for authentication errors
- Review Supabase logs for database issues
- Test with multiple email addresses 