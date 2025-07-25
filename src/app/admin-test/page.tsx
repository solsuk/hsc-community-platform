'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export default function AdminTestPage() {
  const { user, authenticated, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('Loading...');

  useEffect(() => {
    // Set URL after hydration to avoid mismatch
    setCurrentUrl(window.location.href);
    
    setDebugInfo({
      loading,
      authenticated,
      user: user ? {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        communityVerified: user.communityVerified
      } : null,
      timestamp: new Date().toISOString()
    });
  }, [loading, authenticated, user]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Admin Authentication Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current URL</h2>
          <p className="text-gray-600">
            {currentUrl}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Admin Access Check</h2>
          {loading && (
            <div className="text-blue-600">
              🔄 Loading authentication...
            </div>
          )}
          
          {!loading && !authenticated && (
            <div className="text-red-600">
              ❌ Not authenticated - You need to login first
            </div>
          )}
          
          {!loading && authenticated && !user?.isAdmin && (
            <div className="text-orange-600">
              ⚠️ Authenticated but not admin - Run SQL: UPDATE users SET is_admin = TRUE WHERE email = '{user?.email}';
            </div>
          )}
          
          {!loading && authenticated && user?.isAdmin && (
            <div className="text-green-600">
              ✅ Admin access confirmed! You should be able to access /admin
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a 
              href="/"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            >
              🏠 Back to Main Site
            </a>
            <a 
              href="/admin"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-2"
            >
              🎛️ Try Admin Panel
            </a>
            <a 
              href="/api/auth/logout"
              className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              🚪 Logout
            </a>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">📝 Instructions:</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>If not authenticated: Login through main site first</li>
            <li>If authenticated but not admin: Run SQL to make yourself admin</li>
            <li>If admin: The /admin route should work</li>
            <li>Check browser console (F12) for any JavaScript errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 