import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create or update coupon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      listing_id, 
      business_id, 
      business_email,
      coupon_data 
    } = body;

    if (!listing_id || !business_id || !coupon_data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store coupon in database
    const { data, error } = await supabase
      .from('business_coupons')
      .insert({
        listing_id,
        business_id,
        business_email,
        title: coupon_data.title,
        description: coupon_data.description,
        discount_text: coupon_data.discount_text,
        qr_destination: coupon_data.qr_destination || `${process.env.NEXT_PUBLIC_BASE_URL}/listing/${listing_id}`,
        expiration_date: coupon_data.expiration_date,
        is_active: true,
        download_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating coupon:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create coupon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: data,
      qr_code_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/coupons/${data.id}/qr`
    });

  } catch (error) {
    console.error('Error in coupon creation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get coupons for a listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listing_id = searchParams.get('listing_id');
    const business_id = searchParams.get('business_id');

    if (!listing_id && !business_id) {
      return NextResponse.json(
        { success: false, error: 'listing_id or business_id required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('business_coupons')
      .select('*')
      .eq('is_active', true);

    if (listing_id) {
      query = query.eq('listing_id', listing_id);
    } else if (business_id) {
      query = query.eq('business_id', business_id);
    }

    const { data: coupons, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch coupons' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      coupons: coupons || []
    });

  } catch (error) {
    console.error('Error in coupon fetch:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 