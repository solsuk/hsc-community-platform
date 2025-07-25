'use client';

import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <span className="text-yellow-600 text-xl">⏸️</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Cancelled</h2>
          <p className="mt-2 text-gray-600">
            Your payment was cancelled and your business ad was not activated.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-blue-900 mb-2">What happens now?</h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>• Your ad draft has been saved</li>
              <li>• You can complete payment later</li>
              <li>• No charges were made to your account</li>
              <li>• Your ad will activate immediately after successful payment</li>
            </ul>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md font-medium"
            >
              Try Payment Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-medium"
            >
              Return to Home
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact us for assistance with your business advertisement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 