'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface PaymentSuccessData {
  session_id: string;
  amount: number;
  listing_id: string;
  business_name?: string;
  competitive_bid: boolean;
  payment_type: string;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No payment session found');
      setLoading(false);
      return;
    }

    // Activate the ad and get payment details
    const activateAd = async () => {
      try {
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });

        const data = await response.json();

        if (data.success) {
          setPaymentData(data.payment);
        } else {
          setError(data.error || 'Payment confirmation failed');
        }
      } catch (error) {
        console.error('Error confirming payment:', error);
        setError('Failed to confirm payment');
      } finally {
        setLoading(false);
      }
    };

    activateAd();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Activating your ad...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <span className="text-red-600 text-xl">❌</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Issue</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md font-medium"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <span className="text-green-600 text-xl">✅</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Successful!</h2>
          
          {paymentData && (
            <div className="mt-4 space-y-2">
              <p className="text-gray-600">
                Your business ad {paymentData.business_name ? `"${paymentData.business_name}"` : ''} is now live!
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-green-900 mb-2">Payment Details</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">${paymentData.amount}/week</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Placement:</span>
                    <span className="font-medium">
                      {paymentData.competitive_bid ? '🏆 Premium Position' : '📍 Standard Position'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing:</span>
                    <span className="font-medium">
                      {paymentData.payment_type === 'subscription' ? 'Auto-renew weekly' : 'One-time (1 week)'}
                    </span>
                  </div>
                </div>
              </div>

              {paymentData.competitive_bid && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-yellow-800">
                    🎉 Congratulations! Your competitive bid secured a premium position for better visibility.
                  </p>
                </div>
              )}

              {paymentData.payment_type === 'subscription' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-800">
                    💡 Your ad will automatically renew weekly. You can manage or cancel your subscription anytime from your account.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium"
            >
              View My Ad on HSC
            </button>
            <button
              onClick={() => router.push('/account')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-medium"
            >
              Manage My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
} 