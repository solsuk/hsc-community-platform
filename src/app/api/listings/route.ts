import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase';
import { validateAuth } from '@/lib/auth';

// GET /api/listings - Fetch listings with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const isPrivate = searchParams.get('private');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const userId = searchParams.get('userId'); // For user's own listings

    // Build query
    let query = supabase
      .from('listings_with_categories')
      .select(`
        id,
        user_id,
        type,
        category,
        category_display_name,
        title,
        price,
        basic_description,
        detailed_description,
        featured_image_url,
        image_urls,
        video_urls,
        status,
        is_private,
        clicks,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status, but exclude sold listings older than 7 days
    if (status === 'active') {
      query = query.eq('status', 'active');
    } else if (status === 'sold') {
      query = query.eq('status', 'sold').gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    } else {
      query = query.eq('status', status);
    }

    // For general listing display, include both active and recent sold listings
    if (!status || status === 'active') {
      query = query.or(`status.eq.active,and(status.eq.sold,updated_at.gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()})`);
    }

    // Apply filters
    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (isPrivate !== null) query = query.eq('is_private', isPrivate === 'true');
    if (userId) query = query.eq('user_id', userId);
    
    // Price range filters (only for sell listings)
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    
    // Text search across title and descriptions
    if (search) {
      query = query.or(`title.ilike.%${search}%,basic_description.ilike.%${search}%,detailed_description.ilike.%${search}%`);
    }

    const { data: listings, error } = await query;

    if (error) {
      console.error('Listings fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/listings - Create new listing
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      category,
      title,
      price,
      basic_description,
      detailed_description,
      image_urls,
      video_urls,
      featured_image_url,
      is_private = false,
      status = 'active'
    } = body;

    // Validation
    if (!type || !['sell', 'trade', 'announce', 'advertise', 'wanted'].includes(type)) {
      return NextResponse.json({ error: 'Valid listing type is required' }, { status: 400 });
    }

    if (!title || title.trim().length < 3) {
      return NextResponse.json({ error: 'Title must be at least 3 characters' }, { status: 400 });
    }

    if (title.length > 255) {
      return NextResponse.json({ error: 'Title must be less than 255 characters' }, { status: 400 });
    }

    // Type-specific validation
    if ((type === 'sell' || type === 'trade' || type === 'wanted') && !category) {
      return NextResponse.json({ error: 'Category is required for sell, trade, and wanted listings' }, { status: 400 });
    }

    if (type === 'sell' && !price) {
      return NextResponse.json({ error: 'Price is required for sell listings' }, { status: 400 });
    }

    if (type === 'trade' && price) {
      return NextResponse.json({ error: 'Price should not be set for trade listings' }, { status: 400 });
    }

    if (type === 'announce' && (category || price)) {
      return NextResponse.json({ error: 'Category and price should not be set for announcements' }, { status: 400 });
    }

    // Validate basic description length
    if (basic_description && basic_description.length > 150) {
      return NextResponse.json({ error: 'Basic description must be 150 characters or less' }, { status: 400 });
    }

    // Validate image URLs array
    if (image_urls && image_urls.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Create listing
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        user_id: authResult.user.id,
        type,
        category: category || null,
        title: title.trim(),
        price: price ? parseFloat(price) : null,
        basic_description: basic_description?.trim() || null,
        detailed_description: detailed_description?.trim() || null,
        legacy_description: basic_description?.trim() || detailed_description?.trim() || title.trim(), // Fallback for legacy compatibility
        image_urls: image_urls || [],
        video_urls: video_urls || [],
        featured_image_url: featured_image_url || null,
        is_private,
        status
      })
      .select()
      .single();

    if (error) {
      console.error('Listing creation error:', error);
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
    }

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error('Listing creation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 