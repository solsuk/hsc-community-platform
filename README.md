# 🏘️ Hillsmere Shores Classifieds (HSC)

A modern community marketplace platform with advanced admin controls and engagement tracking.

## ✨ Features

### 🎯 **Community Marketplace**
- **4 Listing Types**: Sell (Green), Trade (Blue), Announce (Orange), Wanted (Purple)
- **Smart Categories**: Electronics, Furniture, Autos, Tools, Services, and more
- **Image Upload**: Multi-image support with gallery lightbox
- **Magic Link Authentication**: Passwordless login via email + QR codes
- **Mobile Responsive**: Optimized for all device sizes

### 🔧 **Advanced Admin Panel** 
- **📊 Real-time Dashboard**: Live metrics with actual listing and click data
- **🎛️ Algorithm Control**: Adjust ranking weights with live preview
- **📈 Click Analytics**: Engagement tracking and performance metrics  
- **👥 User Management**: Search, filter, bulk actions with safety checks
- **🔍 System Status**: Health monitoring with diagnostic tools

### 💰 **Business Features**
- **Stripe Integration**: Professional payment processing
- **Business Advertisements**: Premium ad placement system
- **QR Coupon System**: Digital coupons for local businesses
- **Competitive Ad Bidding**: Dynamic pricing for premium positions

### 🤖 **AI Community Assistant**
- **Benjamin Franklin Bot**: Community knowledge base integration
- **Local Information**: HSIA governance, amenities, pet policies, emergency contacts
- **Platform Help**: Guided assistance for posting and navigation

## 🚀 **Technology Stack**

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **Authentication**: Magic Links, QR Code login
- **Payments**: Stripe integration
- **Email**: Resend API
- **Deployment**: Vercel-ready

## 🏗️ **Project Structure**

```
src/
├── app/
│   ├── admin/           # Admin panel pages
│   ├── api/             # Backend API routes  
│   └── auth/            # Authentication pages
├── components/          # Reusable UI components
├── lib/                 # Utilities and configurations
└── types/               # TypeScript definitions
```

## ⚙️ **Installation**

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd hsc-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env-template.txt .env.local
   # Add your API keys and database URLs
   ```

4. **Database Setup**
   - Run the migration scripts in order:
   - `supabase-schema.sql` (base schema)
   - `migration-admin-panel-schema.sql` (admin features)

5. **Start Development**
   ```bash
   npm run dev
   ```

## 🔑 **Key Environment Variables**

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email
RESEND_API_KEY=re_...
```

## 📈 **Admin Panel Features**

### Dashboard
- Real-time listing metrics
- Click tracking analytics  
- Revenue monitoring
- Active user counts

### Algorithm Control
- Adjustable ranking weights (age vs clicks)
- Live preview of ranking changes
- Advanced settings for premium boost
- Engagement threshold controls

### Analytics
- Time-based filtering (24h, 7d, 30d)
- Top performing listings and categories
- Click source breakdown
- Hourly engagement patterns

### User Management  
- Search and filter users
- Bulk actions (ban, admin privileges)
- Safety checks prevent self-modification
- User statistics and reputation scoring

### System Monitoring
- Health checks for all services
- Database performance metrics
- Diagnostic tools and cache management
- Automated alerts and maintenance

## 🎨 **Design Philosophy**

- **Clean & Modern**: Inspired by top marketplace platforms
- **Community-First**: Built specifically for neighborhood connections
- **Admin Transparency**: Real data, no fake metrics
- **Mobile Responsive**: Touch-optimized for all devices
- **Performance Focused**: Fast loading with smart caching

## 🚀 **Deployment**

This project is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard  
3. Deploy automatically on push to main branch

## 📝 **Development Notes**

- **Database**: Uses Supabase with Row Level Security (RLS)
- **Authentication**: Magic links stored securely with expiration
- **Click Tracking**: Invisible, non-intrusive user engagement
- **Admin Access**: Secure role-based permissions
- **Error Handling**: Graceful fallbacks and user-friendly messages

## 🏢 **Matakey Platform**

HSC is the flagship implementation of the Matakey platform concept, designed to be replicated across multiple communities under the Matakey umbrella company.

---

**Built with ❤️ for the Hillsmere Shores Community**

*© 2025 Matakey. Serving communities.*
