import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const couponId = params.id;

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

    // Generate QR code pointing to the coupon download endpoint
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/coupons/${couponId}/download`;
    
    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Return the QR code as an image
    return new NextResponse(qrCodeBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': `inline; filename="coupon-${couponId}.png"`
      }
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
} 