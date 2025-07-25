import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/categories - Fetch listing categories
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Filter by listing type (sell, trade, etc.)
    const type = searchParams.get('type');
    
    let query = supabase
      .from('listing_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    // Filter categories by applicable listing type
    if (type) {
      query = query.contains('applies_to', [type]);
    }
    
    const { data: categories, error } = await query;
    
    if (error) {
      console.error('Categories fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 