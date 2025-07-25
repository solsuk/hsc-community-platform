# HSC Project Brief

## Project Overview
**Name**: Hillsmere Shores Classifieds (HSC)
**Vision**: Private community classifieds platform without requiring social media or subjecting users to spam
**Current Status**: Authentication system implemented, UI components functional, focus on functionality over design

## Core Philosophy
Private community classifieds that serve Hillsmere Shores residents with secure, email-based authentication and geofencing capabilities.

## Target Users
- **Listers**: Community members who want to sell items or share information
- **Browsers**: Community members looking for items or seeking information
- **Visitors**: Non-community members who can view public listings only

## Essential Features

### Authentication System (IMPLEMENTED ✅)
- **Magic Email Authentication**: Secure login links sent to verified community members
- **IP Geofencing**: Automatic qualification for geofenced users within community boundaries  
- **QR Code Generation**: Unique QR codes for quick future logins
- **Community Key System**: Approval workflow for non-geofenced users
- **Session Management**: JWT-based authentication with 24-hour expiration

### User Experience Flows (IMPLEMENTED ✅)
1. **Geofenced Lister**: IP detection → Magic email → Login + QR code → Listing privileges
2. **Non-Geofenced Lister**: Key request → Approval → Magic email + QR code → Listing privileges  
3. **Public Browser**: View public listings without authentication
4. **Authenticated Browser**: Login → Access private listings + enhanced features

### Privacy & Visibility (READY FOR IMPLEMENTATION)
- **Public Listings**: Visible to anyone visiting the site
- **Private Listings**: Visible only to authenticated community members
- **User Control**: Privacy toggle per listing

### Technical Implementation (COMPLETED ✅)
- **Database**: Supabase with complete schema (users, auth_tokens, listings, qr_codes)
- **Email Service**: Resend integration for magic links
- **Authentication**: JWT tokens with secure verification
- **Deployment**: Vercel with Next.js 14 + TypeScript

## Current Priority: Clean Integration & Functionality
**Goal**: Get everything working in a clean structure before focusing on design improvements.

## Success Metrics
- Users can successfully request and receive magic links
- Authentication flow works end-to-end
- Listing creation and viewing functions properly
- Community verification through IP geofencing works
- QR code generation and login works

## Known Technical Debt
- Project structure fragmented across multiple directories
- Some styling inconsistencies with bento box design system
- Need environment configuration setup
- Server startup from proper directory 