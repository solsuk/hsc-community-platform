import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { validateAuth } from '@/lib/auth';

// PUT /api/listings/[id] - Update listing
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
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

    // First, verify the listing exists and belongs to the user
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check if user owns the listing
    if (existingListing.user_id !== authResult.user.id) {
      return NextResponse.json({ error: 'You can only edit your own listings' }, { status: 403 });
    }

    // Update listing
    const { data: listing, error } = await supabase
      .from('listings')
      .update({
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
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Listing update error:', error);
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    return NextResponse.json({ listing }, { status: 200 });
  } catch (error) {
    console.error('Listing update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/listings/[id] - Delete listing
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate authentication
    const authResult = await validateAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Authentication required' }, { status: 401 });
    }

    const { id } = params;
    const supabase = createAdminSupabaseClient();

    // First, verify the listing exists and belongs to the user
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check if user owns the listing
    if (existingListing.user_id !== authResult.user.id) {
      return NextResponse.json({ error: 'You can only delete your own listings' }, { status: 403 });
    }

    // Delete listing
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Listing deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Listing deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Listing deletion API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 