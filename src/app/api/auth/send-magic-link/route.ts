import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createOrUpdateUser, generateAuthToken, storeAuthToken, isWithinCommunityIP, getAppUrl } from '@/lib/auth'
import { headers } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email, context } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    console.log('Processing magic link request for:', email)

    // Get user's IP address for geofencing
    const headersList = headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')
    const userIP = forwardedFor?.split(',')[0] || realIP || 'unknown'
    
    console.log('User IP:', userIP)
    
    // Check if user is in community IP range
    const isGeoFenced = isWithinCommunityIP(userIP)
    console.log('Is geo-fenced:', isGeoFenced)
    
    // Create or update user in database
    const userId = await createOrUpdateUser(email, isGeoFenced, context || 'general')
    console.log('User ID:', userId)
    
    // Generate magic link token
    const token = await generateAuthToken(userId, email, 'magic_link')
    console.log('Token generated successfully')
    
    // Store token in database
    await storeAuthToken(userId, token, 'magic_link')
    console.log('Token stored in database')
    
    // Create magic link URL
    const magicLinkUrl = `${getAppUrl()}/api/auth/verify?token=${token}`
    console.log('Magic link URL:', magicLinkUrl)
    
    // Determine email content based on context and geofencing status
    let emailSubject = 'Your HSC Community Access Link'
    if (context === 'business_advertising') {
      emailSubject = isGeoFenced 
        ? 'Your HSC Business Advertising Access Link'
        : 'Your HSC Business Advertising Request'
    } else {
      emailSubject = isGeoFenced 
        ? 'Your HSC Community Access Link'
        : 'Your HSC Access Request'
    }
    
    const emailContent = (() => {
      if (context === 'business_advertising') {
        return isGeoFenced
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>🎯 Ready to Advertise Your Business on HSC!</h2>
              <p>Great choice! You're about to join our vibrant local business advertising community.</p>
              <p>We detected you're accessing from within our community. Click the link below to get started with your business advertising:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLinkUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  📢 Start Advertising Your Business
                </a>
              </div>
              <p><strong>What's Next:</strong></p>
              <ul style="padding-left: 20px; line-height: 1.6;">
                <li>Create professional ads with our business-focused tools</li>
                <li>Choose from restaurant menus, service hours, QR coupons & more</li>
                <li>Select premium placement for maximum visibility</li>
                <li>Start at just $5/week with competitive market pricing</li>
              </ul>
              <p><strong>This link expires in 1 hour.</strong></p>
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                Hillsmere Shores Classifieds - Business Advertising Platform<br>
                Questions? Reply to this email for support.
              </p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>🎯 HSC Business Advertising Request Received</h2>
              <p>Thank you for your interest in advertising your business with Hillsmere Shores Classifieds!</p>
              <p>We see you're accessing from outside our community area. Your business advertising request has been submitted for approval.</p>
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">🏢 Business Advertising Benefits:</h3>
                <ul style="color: #92400e; padding-left: 20px; line-height: 1.6;">
                  <li><strong>Targeted Local Audience:</strong> Reach Hillsmere Shores residents directly</li>
                  <li><strong>Business Tools:</strong> Restaurant menus, service hours, QR coupons</li>
                  <li><strong>Premium Placement:</strong> Top-row positioning for maximum visibility</li>
                  <li><strong>Affordable Pricing:</strong> Starting at $5/week, market-driven rates</li>
                </ul>
              </div>
              <p><strong>What happens next:</strong></p>
              <ol style="padding-left: 20px; line-height: 1.6;">
                <li>A community admin will review your business advertising request</li>
                <li>If approved, you'll receive your magic link to get started</li>
                <li>You'll access our full business advertising platform</li>
                <li>Create your first ad and start reaching local customers!</li>
              </ol>
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                Hillsmere Shores Classifieds - Business Advertising Platform<br>
                Questions about business advertising? Reply to this email.
              </p>
            </div>
          `;
      } else {
        return isGeoFenced
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to Hillsmere Shores Classifieds!</h2>
              <p>We detected you're accessing from within our community. Click the link below to access your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLinkUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Access HSC Community
                </a>
              </div>
              <p><strong>This link expires in 1 hour.</strong></p>
              <p>If you didn't request this, you can safely ignore this email.</p>
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">
                Hillsmere Shores Classifieds - Private Community Board
              </p>
            </div>
          `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>HSC Community Access Request</h2>
          <p>Thank you for your interest in Hillsmere Shores Classifieds!</p>
          <p>We see you're accessing from outside our community area. Your request has been submitted for approval.</p>
          <p>Once approved by a community administrator, you'll receive another email with your access link.</p>
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>A community admin will review your request</li>
            <li>If approved, you'll get a magic link to access HSC</li>
            <li>You'll then be able to view and post community listings</li>
          </ul>
          <p>This process helps us maintain our private community atmosphere.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Hillsmere Shores Classifieds - Private Community Board
          </p>
        </div>
      `;
      }
    })();

    console.log('Attempting to send email via Resend...')
    
    // Check if we're in testing mode (can only send to verified email)
    const isTestingMode = !process.env.RESEND_DOMAIN_VERIFIED
    const verifiedTestEmail = 'hugo_eilenberg@mac.com' // Your verified email
    
    // In testing mode, only allow sending to verified email
    if (isTestingMode && email.toLowerCase() !== verifiedTestEmail.toLowerCase()) {
      console.log('Resend is in testing mode - can only send to verified email')
      
      // For testing, we'll simulate success but provide a different message
      return NextResponse.json({
        success: true,
        message: 'Demo mode: In production, a magic link would be sent to your email. For testing, please use hugo_eilenberg@mac.com',
        isGeoFenced,
        emailSent: false,
        testingMode: true
      })
    }
    
    // Send email via Resend - using verified sender
    const emailResult = await resend.emails.send({
      from: 'HSC Community <onboarding@resend.dev>', // This is Resend's verified sender
      to: [email],
      subject: emailSubject,
      html: emailContent,
    })

    console.log('Resend API response:', emailResult)

    if (emailResult.error) {
      console.error('Resend API error details:', emailResult.error)
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: emailResult.error.message || 'Unknown email service error'
      }, { status: 500 })
    }

    console.log('Email sent successfully:', emailResult.data?.id)

    // Return appropriate response
    return NextResponse.json({
      success: true,
      message: isGeoFenced 
        ? 'Magic link sent to your email!'
        : 'Access request submitted! You\'ll receive an email once approved.',
      isGeoFenced,
      emailSent: true,
      emailId: emailResult.data?.id
    })

  } catch (error) {
    console.error('Magic link error:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: typeof error
    })
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
} 