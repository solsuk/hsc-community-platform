# HSC Vercel Deployment Checklist

## 🚀 Pre-Deployment Setup

### 1. Environment Variables to Transfer
Copy these from `.env.local` to Vercel:

```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Authentication
JWT_SECRET=your_jwt_secret_here_32_characters_min
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app

# Email Service
RESEND_API_KEY=re_your_resend_api_key_here

# AI Chatbot
XAI_API_KEY=xai-your_x_ai_api_key_here
OPENAI_API_KEY=your-openai-api-key-here

# IP Geofencing
COMMUNITY_IP_RANGE=192.168.1.0/24
```

### 2. Critical Updates Needed
- [ ] Update `NEXT_PUBLIC_APP_URL` to actual Vercel domain
- [ ] Verify all API keys are valid
- [ ] Test database connectivity

## 🔧 Deployment Process

### Step 1: Initialize Git & Push to GitHub
```bash
git init
git add .
git commit -m "Initial HSC deployment"
git branch -M main
git remote add origin https://github.com/yourusername/hsc-new.git
git push -u origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com
2. Import from GitHub
3. Select hsc-new repository
4. Configure environment variables
5. Deploy!

### Step 3: Post-Deployment Testing
- [ ] QR code login functionality
- [ ] Create new listing
- [ ] Upload images
- [ ] AI chatbot responses
- [ ] Listing search
- [ ] User authentication flow

## 🧪 Test Cases for Live Site

### Authentication Flow
1. **QR Code Generation**: Visit `/auth/qr` - should show QR code
2. **Email Login**: Scan QR → receive email → click link → logged in
3. **Protected Routes**: Try accessing `/dashboard` without login

### Listing Management
1. **Create Listing**: Add title, description, images, category
2. **Image Upload**: Test multiple image uploads
3. **Public/Private Toggle**: Verify visibility settings
4. **Edit/Delete**: Modify existing listings

### AI Chatbot
1. **Grok Responses**: Ask "What is HSC?" - should get salty response
2. **Listing Search**: Search "furniture" - should return listings
3. **Off-topic Redirect**: Ask about weather - should redirect humorously
4. **Fallback System**: If Grok fails, should use knowledge base

### Performance
- [ ] Page load times < 3 seconds
- [ ] Image loading optimization
- [ ] Mobile responsiveness
- [ ] API response times

## 🚨 Common Issues & Solutions

### Environment Variables
- **Issue**: API calls failing
- **Solution**: Double-check all env vars are set in Vercel dashboard

### Database Connection
- **Issue**: Supabase connection errors
- **Solution**: Verify SUPABASE_SERVICE_ROLE_KEY is correct

### AI Chatbot
- **Issue**: "Sorry, I had trouble processing that"
- **Solution**: Check XAI_API_KEY and Grok credits

### File Uploads
- **Issue**: Images not uploading
- **Solution**: Verify Supabase storage bucket permissions

## 📊 Success Metrics
- [ ] All core features working
- [ ] No console errors
- [ ] Fast load times
- [ ] Mobile-friendly
- [ ] AI responses working
- [ ] Database operations successful

---

**Ready to deploy!** 🎉 