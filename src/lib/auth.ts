import { SignJWT, jwtVerify } from 'jose'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'
import { createAdminSupabaseClient } from './supabase'
import sharp from 'sharp'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const MAGIC_LINK_EXPIRY_MINUTES = 15 // Magic links expire in 15 minutes for urgency
const QR_CODE_EXPIRY_DAYS = 30 // QR codes last 30 days as persistent keys

// Helper function to get the correct app URL based on environment
export function getAppUrl(): string {
  // In production, try to get from Vercel's automatic environment variables first
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Fallback to manually set environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Final fallback for development
  return 'http://localhost:3000'
}

export interface AuthUser {
  id: string
  email: string
  communityVerified: boolean
  isAdmin: boolean
}

export interface AuthToken {
  id: string
  email: string
  type: 'magic_link' | 'qr_code'
  exp: number
}

// Generate a secure token for authentication
export async function generateAuthToken(
  userId: string, 
  email: string, 
  type: 'magic_link' | 'qr_code' = 'magic_link'
): Promise<string> {
  // Temporary fix: Use UUID-based tokens instead of JWT to avoid VARCHAR(255) limit
  // This creates a much shorter token that we can look up in the database
  
  const tokenId = uuidv4(); // This is always 36 characters
  return tokenId;
}

// Verify and decode a token (now looks up in database instead of JWT verification)
export async function verifyAuthToken(token: string): Promise<AuthToken | null> {
  try {
    const supabase = createAdminSupabaseClient();
    
    // Look up the token in the database
    const { data: tokenData, error } = await supabase
      .from('auth_tokens')
      .select('user_id, token_type, expires_at, used_at')
      .eq('token', token)
      .single();
    
    if (error || !tokenData) {
      console.error('Token not found:', error);
      return null;
    }
    
    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error('Token expired');
      return null;
    }
    
    // Only check if magic links are already used (QR codes are reusable keys)
    if (tokenData.token_type === 'magic_link' && tokenData.used_at) {
      console.error('Magic link already used');
      return null;
    }
    
    // Get user email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', tokenData.user_id)
      .single();
    
    if (userError || !userData) {
      console.error('User not found:', userError);
      return null;
    }
    
    return {
      id: tokenData.user_id,
      email: userData.email,
      type: tokenData.token_type as 'magic_link' | 'qr_code',
      exp: Math.floor(new Date(tokenData.expires_at).getTime() / 1000)
    };
    
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Generate a QR code for quick login
export async function generateQRCode(userId: string, email: string): Promise<string> {
  // Check if user already has an active QR code
  const existingQRCode = await getActiveQRCode(userId)
  
  let token: string
  
  if (existingQRCode) {
    // Reuse existing QR code
    token = existingQRCode.token
    console.log('Reusing existing QR code for user:', userId)
  } else {
    // Create new QR code
    token = await generateAuthToken(userId, email, 'qr_code')
    // Persist the QR-code token so it can be looked up during future scans
    await storeAuthToken(userId, token, 'qr_code')
    console.log('Generated new QR code for user:', userId)
  }
  
  const loginUrl = `${getAppUrl()}/api/auth/verify?token=${token}`
  
  try {
    // Generate QR code as SVG string
    const svgString = await QRCode.toString(loginUrl, {
      errorCorrectionLevel: 'M',
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    })

    // Encode as data URL (removed HSC overlay for better QR code readability)
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`
    return dataUrl
  } catch (error) {
    console.error('QR code generation failed:', error)
    throw new Error('Failed to generate QR code')
  }
}

// Check for existing active QR code for a user
export async function getActiveQRCode(userId: string): Promise<{ token: string; expires_at: string } | null> {
  const supabase = createAdminSupabaseClient()
  
  const { data: existingToken, error } = await supabase
    .from('auth_tokens')
    .select('token, expires_at')
    .eq('user_id', userId)
    .eq('token_type', 'qr_code')
    .gt('expires_at', new Date().toISOString()) // Only active tokens
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !existingToken) {
    return null
  }

  return existingToken
}

// Create or update user in database
export async function createOrUpdateUser(email: string, isGeoFenced: boolean = false, context: string = 'general'): Promise<string> {
  const supabase = createAdminSupabaseClient()
  
  // Define admin emails - add your email here
  const ADMIN_EMAILS = [
    'hugo@eilenberg.org', // Site administrator
    'hugo_eilenberg@mac.com', // Site administrator (actual email)
    // Add more admin emails here as needed
  ]
  
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, is_admin')
    .eq('email', email)
    .single()

  if (existingUser) {
    // Prepare updates
    const updates: any = {};
    
    // Update existing user if they should be admin but aren't yet
    if (isAdmin && !existingUser.is_admin) {
      updates.is_admin = true;
    }
    
    // If this is a business advertising context, ensure they're community verified
    if (context === 'business_advertising') {
      updates.community_verified = true;
    }
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('users')
        .update(updates)
        .eq('id', existingUser.id);
    }
    
    return existingUser.id
  }

  // Determine verification status
  // Business advertisers are automatically verified regardless of geofencing
  const shouldAutoVerify = isGeoFenced || context === 'business_advertising';

  // Create new user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      email,
      community_verified: shouldAutoVerify, // Auto-verify if geo-fenced OR business advertiser
      is_admin: isAdmin, // Set admin status based on email
      email_verified_at: null, // Will be set when they click the magic link
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create user:', error)
    throw new Error('Failed to create user')
  }

  return newUser.id
}

// Validate authentication for API requests
export async function validateAuth(request: Request): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: string;
}> {
  try {
    // Check for session cookie (our primary auth method)
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
      return {
        success: false,
        error: 'No authentication token provided'
      };
    }

    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(cookie => {
        const [name, value] = cookie.split('=');
        return [name, decodeURIComponent(value)];
      })
    );

    const sessionCookie = cookies['hsc-session'];
    if (!sessionCookie) {
      return {
        success: false,
        error: 'No authentication session found'
      };
    }

    // Parse session data
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie);
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid session data'
      };
    }

    // Check if session is still valid (1 hour)
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 1) {
      return {
        success: false,
        error: 'Session expired'
      };
    }

    // Return user data from session
    return {
      success: true,
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        communityVerified: sessionData.communityVerified,
        isAdmin: sessionData.isAdmin
      }
    };
  } catch (error) {
    console.error('Auth validation error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

// Store auth token in database
export async function storeAuthToken(
  userId: string, 
  token: string, 
  type: 'magic_link' | 'qr_code'
): Promise<void> {
  console.log('Storing auth token:', { userId, tokenLength: token.length, type });
  
  const supabase = createAdminSupabaseClient()
  
  const expiresAt = new Date()
  // QR codes are persistent keys (30 days) - Magic links create urgency (15 minutes)
  if (type === 'qr_code') {
    expiresAt.setDate(expiresAt.getDate() + QR_CODE_EXPIRY_DAYS)
  } else {
    expiresAt.setMinutes(expiresAt.getMinutes() + MAGIC_LINK_EXPIRY_MINUTES)
  }
  
  console.log('Token expires at:', expiresAt.toISOString());

  const insertData = {
    token,
    user_id: userId,
    token_type: type,
    expires_at: expiresAt.toISOString(),
  };
  
  console.log('Insert data:', insertData);

  const { data, error } = await supabase
    .from('auth_tokens')
    .insert(insertData)
    .select();

  console.log('Supabase insert result:', { data, error });

  if (error) {
    console.error('Failed to store auth token - detailed error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to store auth token: ${error.message}`)
  }
  
  console.log('Auth token stored successfully');
}

// Mark token as used and verify user's email (QR codes are reusable, magic links are single-use)
export async function markTokenUsed(token: string): Promise<AuthUser | null> {
  const supabase = createAdminSupabaseClient()
  
  // Find the token
  const { data: tokenData, error: tokenError } = await supabase
    .from('auth_tokens')
    .select('user_id, used_at, expires_at, token_type')
    .eq('token', token)
    .single()

  if (tokenError || !tokenData) {
    console.error('Token not found:', tokenError)
    return null
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    console.error('Token expired')
    return null
  }

  // Only check if magic links are already used (QR codes are reusable keys)
  if (tokenData.token_type === 'magic_link' && tokenData.used_at) {
    console.error('Magic link already used')
    return null
  }

  // Mark magic links as used (but not QR codes - they're persistent keys)
  if (tokenData.token_type === 'magic_link') {
    const { error: updateError } = await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    if (updateError) {
      console.error('Failed to mark magic link as used:', updateError)
      return null
    }
  }

  // Update user's email verification
  const { data: user, error: userError } = await supabase
    .from('users')
    .update({ email_verified_at: new Date().toISOString() })
    .eq('id', tokenData.user_id)
    .select('id, email, community_verified, is_admin')
    .single()

  if (userError || !user) {
    console.error('Failed to verify user email:', userError)
    return null
  }

  return {
    id: user.id,
    email: user.email,
    communityVerified: user.community_verified,
    isAdmin: user.is_admin,
  }
}

// Check if an IP address is within the community range
export function isWithinCommunityIP(ip: string): boolean {
  console.log(`Checking IP geofencing for: ${ip}`)
  
  // For development: temporarily allow all IPs to test the flow
  // TODO: Implement proper Hillsmere Neck area IP ranges
  
  // Allow localhost and local development
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    console.log(`Allowing local/development IP: ${ip}`)
    return true
  }
  
  // For now, also allow any IP during testing
  // This should be removed once proper IP ranges are configured
  console.log(`Allowing IP for testing: ${ip}`)
  return true
}

// Send QR key renewal reminder email
export async function sendQRRenewalReminder(email: string): Promise<void> {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY!)
  
  try {
    await resend.emails.send({
      from: 'HSC Community <onboarding@resend.dev>',
      to: [email],
      subject: '🔑 Time to Renew Your HSC Community Key',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🔑 Your HSC Community Key Has Expired</h2>
          <p>Hello HSC Community Member,</p>
          <p>Your QR community key has expired and needs to be renewed to continue accessing the Hillsmere Shores Classifieds.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${getAppUrl()}" style="background: #007cba; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              🔑 Get New Community Key
            </a>
          </div>
          
          <p><strong>Why renew your key?</strong></p>
          <ul>
            <li>📱 Quick mobile access to your listings</li>
            <li>✏️ Edit and update your posts</li>
            <li>✅ Mark items as sold</li>
            <li>🏘️ Stay connected with your community</li>
          </ul>
          
          <p style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <strong>📧 Simply request a new magic link</strong> and you'll receive a fresh 30-day community key via email.
          </p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Hillsmere Shores Classifieds - Your Community Connection</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send QR renewal reminder:', error)
  }
}

// Clean up expired tokens (call this periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  const supabase = createAdminSupabaseClient()
  
  // Get expired QR codes to send renewal reminders
  const { data: expiredQRTokens } = await supabase
    .from('auth_tokens')
    .select(`
      token,
      user_id,
      users!inner(email)
    `)
    .eq('token_type', 'qr_code')
    .lt('expires_at', new Date().toISOString())
  
  // Send renewal reminders for expired QR codes
  if (expiredQRTokens) {
    for (const tokenData of expiredQRTokens) {
      if (tokenData.users && 'email' in tokenData.users) {
        await sendQRRenewalReminder(tokenData.users.email as string)
      }
    }
  }
  
  const { error } = await supabase
    .from('auth_tokens')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Failed to cleanup expired tokens:', error)
  }
} 