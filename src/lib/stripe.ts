import Stripe from 'stripe';
import { loadStripe, Stripe as StripeJs } from '@stripe/stripe-js';

// Server-side Stripe instance (lazy initialization)
let stripe: Stripe | null = null;

const getServerStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });
  }
  return stripe;
};

// Client-side Stripe instance
let stripePromise: Promise<StripeJs | null>;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Business Ad pricing configuration
export const AD_PRICING = {
  BASE_WEEKLY_RATE: 5.00,
  COMPETITIVE_INCREMENT: 5.00,
  CURRENCY: 'usd',
};

// Payment types for business ads
export type PaymentType = 'one_time' | 'subscription';
export type PaymentDuration = '1_week';

export interface AdPaymentInfo {
  listing_id: string;
  user_id: string;
  user_email: string;
  weekly_amount: number;
  payment_type: PaymentType;
  auto_renew: boolean;
  competitive_bid?: boolean;
}

// Create Stripe checkout session for business ads
export async function createCheckoutSession({
  listing_id,
  user_id,
  user_email,
  weekly_amount,
  payment_type,
  auto_renew,
  competitive_bid = false
}: AdPaymentInfo) {
  try {
    const stripe = getServerStripe();
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }

    const baseParams: Stripe.Checkout.SessionCreateParams = {
      customer_email: user_email,
      line_items: [
        {
          price_data: {
            currency: AD_PRICING.CURRENCY,
            product_data: {
              name: competitive_bid 
                ? `Business Ad - Premium Placement ($${weekly_amount}/week)`
                : `Business Ad - Standard Placement ($${weekly_amount}/week)`,
              description: competitive_bid
                ? `Competitive positioning for better visibility`
                : `Standard business advertisement placement`,
              images: [], // Could add HSC logo here
            },
            unit_amount: Math.round(weekly_amount * 100), // Convert to cents
            recurring: payment_type === 'subscription' ? {
              interval: 'week',
              interval_count: 1,
            } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: payment_type === 'subscription' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        listing_id,
        user_id,
        weekly_amount: weekly_amount.toString(),
        auto_renew: auto_renew.toString(),
        competitive_bid: competitive_bid.toString(),
        payment_type,
      },
    };

    const session = await stripe.checkout.sessions.create(baseParams);
    return { success: true, session_id: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Get checkout session details
export async function getCheckoutSession(sessionId: string) {
  try {
    const stripe = getServerStripe();
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return { success: true, session };
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Cancel a subscription (for auto-renew cancellation)
export async function cancelSubscription(subscriptionId: string) {
  try {
    const stripe = getServerStripe();
    if (!stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return { success: true, subscription };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Calculate competitive bid amount based on current market state
export function calculateCompetitiveBid(currentTopBid: number): number {
  if (currentTopBid === 0) {
    return AD_PRICING.BASE_WEEKLY_RATE;
  }
  return currentTopBid + AD_PRICING.COMPETITIVE_INCREMENT;
}

// Validate payment amount
export function validatePaymentAmount(amount: number): boolean {
  return amount >= AD_PRICING.BASE_WEEKLY_RATE && 
         amount % AD_PRICING.COMPETITIVE_INCREMENT === 0;
}

export { getServerStripe as stripe, getStripe };
export default getServerStripe; 