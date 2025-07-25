import { NextRequest, NextResponse } from 'next/server'
import { markTokenUsed, verifyAuthToken, generateQRCode, getAppUrl, sendQRRenewalReminder } from '@/lib/auth'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify the JWT token
    const tokenData = await verifyAuthToken(token)
    if (!tokenData) {
      // Check if this was an expired QR code and send renewal reminder
      const supabase = (await import('@/lib/supabase')).createAdminSupabaseClient()
      const { data: expiredToken } = await supabase
        .from('auth_tokens')
        .select(`
          token_type,
          expires_at,
          users!inner(email)
        `)
        .eq('token', token)
        .single()
      
      if (expiredToken?.token_type === 'qr_code' && expiredToken.users && 'email' in expiredToken.users) {
        await sendQRRenewalReminder(expiredToken.users.email as string)
        
        // Redirect to homepage with renewal message
        const redirectUrl = new URL('/', getAppUrl())
        redirectUrl.searchParams.set('expired', 'qr_key')
        return NextResponse.redirect(redirectUrl)
      }
      
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Mark token as used and get user data
    const user = await markTokenUsed(token)
    if (!user) {
      return NextResponse.json({ error: 'Token already used or invalid' }, { status: 401 })
    }

    // Create session cookie
    const cookieStore = cookies()
    const sessionData = {
      userId: user.id,
      email: user.email,
      communityVerified: user.communityVerified,
      isAdmin: user.isAdmin,
      loginTime: new Date().toISOString()
    }

    // Set secure session cookie (expires in 1 hour)
    cookieStore.set('hsc-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    })

    // Only send QR code email for magic link logins, not QR code logins
    if (tokenData.type === 'magic_link') {
      // Generate QR code image (function now handles token storage internally)
      const qrCodeDataUrl = await generateQRCode(user.id, user.email)

      // Get the QR code token for the backup link
      const activeQRCode = await (await import('@/lib/auth')).getActiveQRCode(user.id)
      const backupUrl = activeQRCode ? `${getAppUrl()}/api/auth/verify?token=${activeQRCode.token}` : ''

      // Send follow-up QR code email
      const qrEmailResult = await resend.emails.send({
        from: 'HSC Community <onboarding@resend.dev>',
        to: [user.email],
        subject: 'Your HSC Community Key - QR Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🗝️ Your HSC Community Key</h2>
            <p>Welcome to the Hillsmere Shores Community! Your personal QR key is ready:</p>
            <div style="text-align: center; margin: 30px 0;">
              <img src="${qrCodeDataUrl}" alt="HSC Community Key QR Code" style="max-width: 200px;" />
            </div>
            <p><strong>Your Community Key Instructions:</strong></p>
            <ul>
              <li>💾 <strong>Save this QR key</strong> - it's your permanent access to HSC</li>
              <li>🖨️ <strong>Print it</strong> for easy mobile scanning</li>
              <li>📱 <strong>Scan to enter</strong> - instant access to post, edit, and manage your listings</li>
              <li>🔄 <strong>Reuse anytime</strong> - this key works for 30 days</li>
            </ul>
            
            ${backupUrl ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <h3 style="margin: 0 0 10px 0; color: #007bff;">🔗 Backup Access Link</h3>
              <p style="margin: 0 0 15px 0;">Can't scan the QR code? No problem! Click this link instead:</p>
              <div style="text-align: center;">
                <a href="${backupUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Access HSC Community
                </a>
              </div>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">
                This link works the same as your QR code and expires in 30 days.
              </p>
            </div>
            ` : ''}
            
            <p style="background: #f0f8ff; padding: 15px; border-radius: 8px;">
              <strong>🏘️ HSC Community Key Concept:</strong><br>
              Your QR code is like a key to your community - keep it handy for quick access to manage your listings, check responses, and stay connected with your neighbors.
            </p>
            <p><em>This community key expires in 30 days. We'll remind you when it's time to renew.</em></p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">Hillsmere Shores Classifieds - Your Community Connection</p>
          </div>
        `,
      })

      if (qrEmailResult.error) {
        console.error('Failed to send QR code email:', qrEmailResult.error)
      }
    }

    // Redirect to the main page with success
    const redirectUrl = new URL('/', getAppUrl())
    redirectUrl.searchParams.set('auth', 'success')
    
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify the JWT token
    const tokenData = await verifyAuthToken(token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Mark token as used and get user data
    const user = await markTokenUsed(token)
    if (!user) {
      return NextResponse.json({ error: 'Token already used or invalid' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        communityVerified: user.communityVerified,
        isAdmin: user.isAdmin
      }
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 