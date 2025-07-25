import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendCouponDownloadEmail(coupon: any, customerInfo: any) {
  try {
    // This is a simple email template - in production you'd use a proper email service
    const emailContent = `
Subject: Coupon Downloaded - ${coupon.title}

Hello,

Great news! A customer has downloaded your coupon "${coupon.title}" from your Hillsmere Shores Classifieds advertisement.

Coupon Details:
- Title: ${coupon.title}
- Discount: ${coupon.discount_text}
- Description: ${coupon.description}
- Downloaded: ${new Date().toLocaleDateString()}
- Total Downloads: ${coupon.download_count + 1}

Customer Information:
- IP Address: ${customerInfo.ip || 'Not available'}
- User Agent: ${customerInfo.userAgent || 'Not available'}
- Download Time: ${new Date().toLocaleString()}

This customer is interested in your business! Consider following up with them or promoting this offer further.

Best regards,
Hillsmere Shores Classifieds Team

---
This is an automated notification. Reply to this email to contact HSC support.
    `;

    console.log('Email would be sent to:', coupon.business_email);
    console.log('Email content:', emailContent);

    // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
    // For now, we'll just log the email content
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const couponId = params.id;
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Fetch coupon details
    const { data: coupon, error } = await supabase
      .from('business_coupons')
      .select('*')
      .eq('id', couponId)
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Check if coupon is expired
    if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Coupon has expired' },
        { status: 410 }
      );
    }

    // Increment download count
    const { error: updateError } = await supabase
      .from('business_coupons')
      .update({ 
        download_count: coupon.download_count + 1,
        last_downloaded: new Date().toISOString()
      })
      .eq('id', couponId);

    if (updateError) {
      console.error('Error updating download count:', updateError);
      // Continue anyway - don't fail the download for this
    }

    // Log the download
    const { error: logError } = await supabase
      .from('coupon_downloads')
      .insert({
        coupon_id: couponId,
        listing_id: coupon.listing_id,
        business_id: coupon.business_id,
        customer_ip: clientIP,
        user_agent: userAgent,
        downloaded_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging download:', logError);
      // Continue anyway
    }

    // Send email notification to business owner
    const emailResult = await sendCouponDownloadEmail(coupon, {
      ip: clientIP,
      userAgent: userAgent
    });

    if (!emailResult.success) {
      console.error('Failed to send email notification:', emailResult.error);
      // Continue anyway - don't fail the download
    }

    // Redirect to the QR destination (or coupon display page)
    const destinationUrl = coupon.qr_destination || `${process.env.NEXT_PUBLIC_BASE_URL}/listing/${coupon.listing_id}`;
    
    // If it's a direct QR code scan, show the coupon info
    const { searchParams } = new URL(request.url);
    const showCoupon = searchParams.get('show') === 'true';
    
    if (showCoupon) {
      // Return coupon information as JSON for display
      return NextResponse.json({
        success: true,
        coupon: {
          id: coupon.id,
          title: coupon.title,
          description: coupon.description,
          discount_text: coupon.discount_text,
          expiration_date: coupon.expiration_date,
          business_name: coupon.business_name || 'Business',
          download_count: coupon.download_count + 1
        },
        message: 'Coupon downloaded successfully!'
      });
    } else {
      // Redirect to destination URL
      return NextResponse.redirect(destinationUrl);
    }

  } catch (error) {
    console.error('Error processing coupon download:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process coupon download' },
      { status: 500 }
    );
  }
} 