'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, authenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!authenticated || !user?.isAdmin)) {
      router.push('/');
    }
  }, [authenticated, user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized if not admin
  if (!authenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Link href="/" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            ← Back to HSC
          </Link>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: '📊',
      current: pathname === '/admin'
    },
    {
      name: 'Algorithm',
      href: '/admin/algorithm',
      icon: '🎛️',
      current: pathname === '/admin/algorithm'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: '📈',
      current: pathname === '/admin/analytics'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: '👥',
      current: pathname === '/admin/users'
    },
    {
      name: 'System',
      href: '/admin/system',
      icon: '⚡',
      current: pathname === '/admin/system'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header Bar - aligns with main site content */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Admin Title */}
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎛️</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HSC Admin Control Center</h1>
                <p className="text-xs text-gray-500">Logged in as {user?.email}</p>
              </div>
            </div>
            
            {/* Back to Site Link */}
            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              ← Back to HSC
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-0">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  item.current
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-base mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
} 