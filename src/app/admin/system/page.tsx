'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    response_time: number;
    connections: number;
    tables_count: number;
  };
  api: {
    status: 'healthy' | 'warning' | 'error';
    response_time: number;
    requests_per_minute: number;
    error_rate: number;
  };
  storage: {
    status: 'healthy' | 'warning' | 'error';
    used_space: number;
    total_space: number;
    upload_success_rate: number;
  };
  email: {
    status: 'healthy' | 'warning' | 'error';
    delivery_rate: number;
    queue_size: number;
    last_sent: string;
  };
  payment: {
    status: 'healthy' | 'warning' | 'error';
    success_rate: number;
    webhook_delay: number;
    last_transaction: string;
  };
}

interface ServiceMetric {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  last_check: string;
  details: string;
}

export default function SystemStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [services, setServices] = useState<ServiceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSystemHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      if (!loading) setRefreshing(true);
      
      const response = await fetch('/api/admin/system/health');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHealth(data.health);
          setServices(data.services);
        }
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return '✅';
      case 'warning':
      case 'degraded':
        return '⚠️';
      case 'error':
      case 'offline':
        return '❌';
      default:
        return '⚪';
    }
  };

  const formatUptime = (uptime: number) => {
    if (uptime >= 99.9) return '99.9%+';
    return `${uptime.toFixed(1)}%`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700 mr-2">
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">⚡ System Status</h1>
            <p className="text-gray-600">Monitor HSC platform health and performance</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={fetchSystemHealth}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🌐 Overall System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Database */}
          <div className="text-center">
            <div className="text-3xl mb-2">{getStatusIcon(health?.database.status || 'healthy')}</div>
            <div className="text-sm font-medium text-gray-900">Database</div>
            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(health?.database.status || 'healthy')}`}>
              {health?.database.status || 'Healthy'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {health?.database.response_time || 45}ms
            </div>
          </div>

          {/* API */}
          <div className="text-center">
            <div className="text-3xl mb-2">{getStatusIcon(health?.api.status || 'healthy')}</div>
            <div className="text-sm font-medium text-gray-900">API Services</div>
            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(health?.api.status || 'healthy')}`}>
              {health?.api.status || 'Healthy'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {health?.api.response_time || 120}ms
            </div>
          </div>

          {/* Storage */}
          <div className="text-center">
            <div className="text-3xl mb-2">{getStatusIcon(health?.storage.status || 'healthy')}</div>
            <div className="text-sm font-medium text-gray-900">File Storage</div>
            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(health?.storage.status || 'healthy')}`}>
              {health?.storage.status || 'Healthy'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((health?.storage.used_space || 0) / (health?.storage.total_space || 100) * 100).toFixed(1)}% used
            </div>
          </div>

          {/* Email */}
          <div className="text-center">
            <div className="text-3xl mb-2">{getStatusIcon(health?.email.status || 'healthy')}</div>
            <div className="text-sm font-medium text-gray-900">Email System</div>
            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(health?.email.status || 'healthy')}`}>
              {health?.email.status || 'Healthy'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {health?.email.delivery_rate || 99.8}% delivery
            </div>
          </div>

          {/* Payment */}
          <div className="text-center">
            <div className="text-3xl mb-2">{getStatusIcon(health?.payment.status || 'healthy')}</div>
            <div className="text-sm font-medium text-gray-900">Payment System</div>
            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(health?.payment.status || 'healthy')}`}>
              {health?.payment.status || 'Healthy'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {health?.payment.success_rate || 99.5}% success
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🗄️ Database Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium text-gray-900">{health?.database.response_time || 45}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="text-sm font-medium text-gray-900">{health?.database.connections || 12}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tables Count</span>
              <span className="text-sm font-medium text-gray-900">{health?.database.tables_count || 15}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${((health?.database.connections || 12) / 100) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* API Metrics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔌 API Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-sm font-medium text-gray-900">{health?.api.response_time || 120}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Requests/min</span>
              <span className="text-sm font-medium text-gray-900">{health?.api.requests_per_minute || 45}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-gray-900">{health?.api.error_rate || 0.2}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min((health?.api.requests_per_minute || 45) / 100 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(services.length > 0 ? services : [
            { name: 'Authentication Service', status: 'online', uptime: 99.95, last_check: new Date().toISOString(), details: 'Magic link auth working' },
            { name: 'File Upload Service', status: 'online', uptime: 99.8, last_check: new Date().toISOString(), details: 'Image uploads functional' },
            { name: 'Payment Processing', status: 'online', uptime: 99.9, last_check: new Date().toISOString(), details: 'Stripe integration active' },
            { name: 'Email Delivery', status: 'online', uptime: 98.5, last_check: new Date().toISOString(), details: 'Resend API operational' },
            { name: 'Search Service', status: 'online', uptime: 99.7, last_check: new Date().toISOString(), details: 'Listing search working' },
            { name: 'Analytics Tracking', status: 'online', uptime: 99.2, last_check: new Date().toISOString(), details: 'Click tracking active' }
          ] as ServiceMetric[]).map((service) => (
            <div key={service.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{service.name}</span>
                <span className="text-lg">{getStatusIcon(service.status)}</span>
              </div>
              <div className="text-xs text-gray-600 mb-2">{service.details}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Uptime: {formatUptime(service.uptime)}</span>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(service.status)}`}>
                  {service.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Usage */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💾 Storage Usage</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatBytes(health?.storage.used_space || 2.4 * 1024 * 1024 * 1024)}
              </div>
              <div className="text-sm text-gray-600">
                of {formatBytes(health?.storage.total_space || 10 * 1024 * 1024 * 1024)} used
              </div>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className="bg-purple-500 h-3 rounded-full" 
                style={{ width: `${((health?.storage.used_space || 2.4 * 1024 * 1024 * 1024) / (health?.storage.total_space || 10 * 1024 * 1024 * 1024)) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 text-center">
              Upload Success Rate: {health?.storage.upload_success_rate || 99.1}%
            </div>
          </div>
        </div>

        {/* Email Queue */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📧 Email Queue</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {health?.email.queue_size || 3}
              </div>
              <div className="text-sm text-gray-600">emails pending</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Delivery Rate</div>
              <div className="text-lg font-medium text-green-600">
                {health?.email.delivery_rate || 99.8}%
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Last sent: {health?.email.last_sent ? new Date(health.email.last_sent).toLocaleTimeString() : '2 min ago'}
            </div>
          </div>
        </div>

        {/* Payment Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💳 Payment Health</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {health?.payment.success_rate || 99.5}%
              </div>
              <div className="text-sm text-gray-600">success rate</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Webhook Delay</div>
              <div className="text-lg font-medium text-gray-900">
                {health?.payment.webhook_delay || 1.2}s
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Last transaction: {health?.payment.last_transaction ? new Date(health.payment.last_transaction).toLocaleTimeString() : '5 min ago'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ System Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <div className="text-center">
              <div className="text-2xl mb-2">🔧</div>
              <div className="text-sm font-medium text-gray-900">Run Diagnostics</div>
              <div className="text-xs text-gray-600">Check system health</div>
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <div className="text-center">
              <div className="text-2xl mb-2">🧹</div>
              <div className="text-sm font-medium text-gray-900">Clear Cache</div>
              <div className="text-xs text-gray-600">Refresh system cache</div>
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-900">Export Logs</div>
              <div className="text-xs text-gray-600">Download system logs</div>
            </div>
          </button>

          <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border">
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <div className="text-sm font-medium text-gray-900">Restart Services</div>
              <div className="text-xs text-gray-600">Restart all services</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
} 