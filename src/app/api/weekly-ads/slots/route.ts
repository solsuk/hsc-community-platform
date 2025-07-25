import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// GET /api/weekly-ads/slots - Fetch available ad slots with pricing
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const forDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get current weekly ads to see which slots are occupied
    // Note: If weekly_ads table doesn't exist yet, we'll return all slots as available
    const { data: currentAds, error } = await supabase
      .from('weekly_ads')
      .select('id, user_id, listing_id, position_slot, weekly_price, listing_title, is_active')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('position_slot', { ascending: true });

    if (error) {
      console.error('Error fetching current ads (table may not exist yet):', error);
      // If table doesn't exist yet, return all slots as available
      const emptySlots = [];
      for (let position = 1; position <= 5; position++) {
        emptySlots.push({
          position,
          is_available: true,
          base_price: 5.00,
          bump_price: 5.00,
          current_occupant: null,
          position_name: `Row ${position}`,
          description: position === 1 ? 'Top position - highest visibility' :
                       position === 2 ? 'Second position - high visibility' :
                       position === 3 ? 'Third position - good visibility' :
                       position === 4 ? 'Fourth position - moderate visibility' :
                       'Fifth position - basic visibility'
        });
      }
      
      return NextResponse.json({
        slots: emptySlots,
        summary: {
          total_slots: 5,
          available_slots: 5,
          occupied_slots: 0,
          lowest_available_position: 1,
          highest_bump_position: null,
          base_weekly_price: 5.00,
          current_market_rate: 5.00
        }
      });
    }

    // Create 5 slots with availability information
    const transformedSlots = [];
    for (let position = 1; position <= 5; position++) {
      const occupiedBy = currentAds?.find(ad => ad.position_slot === position);
      const occupiedCount = currentAds?.length || 0;
      
      transformedSlots.push({
        position,
        is_available: !occupiedBy,
        base_price: 5.00,
        bump_price: occupiedBy ? (5.00 + (occupiedCount * 5.00)) : (5.00 + (occupiedCount * 5.00)),
        current_occupant: occupiedBy ? {
          user_id: occupiedBy.user_id,
          listing_title: occupiedBy.listing_title,
          weekly_price: occupiedBy.weekly_price
        } : null,
        position_name: `Row ${position}`,
        description: position === 1 ? 'Top position - highest visibility' :
                     position === 2 ? 'Second position - high visibility' :
                     position === 3 ? 'Third position - good visibility' :
                     position === 4 ? 'Fourth position - moderate visibility' :
                     'Fifth position - basic visibility'
      });
    }

    // Calculate summary statistics
    const availableCount = transformedSlots.filter((slot: any) => slot.is_available).length;
    const occupiedCount = 5 - availableCount;
    const lowestAvailablePosition = transformedSlots.find((slot: any) => slot.is_available)?.position || null;
    const highestBumpPosition = transformedSlots.find((slot: any) => !slot.is_available)?.position || null;

    return NextResponse.json({
      slots: transformedSlots,
      summary: {
        total_slots: 5,
        available_slots: availableCount,
        occupied_slots: occupiedCount,
        lowest_available_position: lowestAvailablePosition,
        highest_bump_position: highestBumpPosition,
        base_price: 5.00,
        bump_price: 10.00
      },
      pricing: {
        base_weekly_rate: 5.00,
        bump_weekly_rate: 10.00,
        currency: 'USD',
        billing_cycle: 'weekly'
      }
    });
  } catch (error) {
    console.error('Slots API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 