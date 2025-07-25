'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AnalyticsData {
  total_clicks_today: number;
  total_clicks_week: number;
  total_clicks_month: number;
  avg_clicks_per_listing: number;
  top_performing_categories: Array<{
    category: string;
    clicks: number;
    listings: number;
  }>;
  hourly_clicks: Array<{
    hour: number;
    clicks: number;
  }>;
  daily_clicks: Array<{
    date: string;
    clicks: number;
  }>;
  top_listings: Array<{
    id: string;
    title: string;
    type: string;
    clicks: number;
    engagement_score: number;
  }>;
  click_sources: Array<{
    source: string;
    clicks: number;
    percentage: number;
  }>;
}

interface ClickTrend {
  period: string;
  clicks: number;
  change: number;
}

export default function ClickAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?period=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return <span className="text-green-600 text-sm">↗️ +{change.toFixed(1)}%</span>;
    } else if (change < 0) {
      return <span className="text-red-600 text-sm">↘️ {change.toFixed(1)}%</span>;
    } else {
      return <span className="text-gray-600 text-sm">→ 0%</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mt-2">📈 Click Analytics</h1>
            <p className="text-gray-600">Monitor engagement and click patterns</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as '24h' | '7d' | '30d')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {refreshing ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Clicks</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics?.total_clicks_week || 892)}
              </div>
              {getChangeIndicator(15.2)}
            </div>
            <div className="text-3xl">👆</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Avg per Listing</div>
              <div className="text-2xl font-bold text-gray-900">
                {(analytics?.avg_clicks_per_listing || 18.9).toFixed(1)}
              </div>
              {getChangeIndicator(8.7)}
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Peak Hour</div>
              <div className="text-2xl font-bold text-gray-900">2:00 PM</div>
              <div className="text-sm text-gray-600">127 clicks</div>
            </div>
            <div className="text-3xl">⏰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">CTR</div>
              <div className="text-2xl font-bold text-gray-900">3.4%</div>
              {getChangeIndicator(12.1)}
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Clicks Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Daily Click Trends</h3>
          <div className="space-y-3">
            {(analytics?.daily_clicks || [
              { date: '2025-01-20', clicks: 95 },
              { date: '2025-01-21', clicks: 124 },
              { date: '2025-01-22', clicks: 156 },
              { date: '2025-01-23', clicks: 189 },
              { date: '2025-01-24', clicks: 167 }
            ]).slice(-7).map((day, index) => {
              const maxClicks = Math.max(...(analytics?.daily_clicks || []).map(d => d.clicks));
              const percentage = (day.clicks / maxClicks) * 100;
              
              return (
                <div key={day.date} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-sm font-medium text-gray-900 text-right">
                    {day.clicks}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Pattern */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Hourly Click Pattern</h3>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 24 }, (_, hour) => {
              const clicks = Math.floor(Math.random() * 50) + 10; // Mock data
              const intensity = clicks / 60; // Normalize to 0-1
              
              return (
                <div
                  key={hour}
                  className="text-center p-2 rounded"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                    color: intensity > 0.5 ? 'white' : 'black'
                  }}
                >
                  <div className="text-xs font-medium">{hour}:00</div>
                  <div className="text-xs">{clicks}</div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
            <span>Low Activity</span>
            <span>High Activity</span>
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Listings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performing Listings</h3>
          <div className="space-y-3">
            {(analytics?.top_listings || [
              { id: '1', title: 'iPhone 15 Pro Max', type: 'sell', clicks: 89, engagement_score: 0.85 },
              { id: '2', title: 'Lawn Mower Service', type: 'trade', clicks: 67, engagement_score: 0.78 },
              { id: '3', title: 'Piano Lessons', type: 'announce', clicks: 54, engagement_score: 0.72 },
              { id: '4', title: 'Looking for Babysitter', type: 'wanted', clicks: 41, engagement_score: 0.68 }
            ]).map((listing, index) => (
              <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <span className="text-lg mr-3">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📄'}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                    <div className="text-xs text-gray-600 capitalize">{listing.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">{listing.clicks} clicks</div>
                  <div className="text-xs text-gray-600">Score: {listing.engagement_score.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📂 Category Performance</h3>
          <div className="space-y-3">
            {(analytics?.top_performing_categories || [
              { category: 'Electronics', clicks: 245, listings: 12 },
              { category: 'Home & Garden', clicks: 189, listings: 18 },
              { category: 'Vehicles', clicks: 156, listings: 8 },
              { category: 'Services', clicks: 134, listings: 15 }
            ]).map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    <span className="text-sm text-gray-600">{category.clicks} clicks</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(category.clicks / 245) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{category.listings} listings</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Click Sources & Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Click Sources */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Click Sources</h3>
          <div className="space-y-3">
            {[
              { source: 'Direct', clicks: 456, percentage: 51.2 },
              { source: 'Search', clicks: 234, percentage: 26.3 },
              { source: 'Categories', clicks: 123, percentage: 13.8 },
              { source: 'Featured', clicks: 78, percentage: 8.7 }
            ].map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-sm font-medium text-gray-900">{source.source}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{source.clicks}</div>
                  <div className="text-xs text-gray-600">{source.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Insights */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Insights</h3>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <div className="text-sm font-medium text-green-800">📈 Peak Performance</div>
              <div className="text-xs text-green-700 mt-1">
                Electronics category shows 23% higher engagement than average
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm font-medium text-blue-800">⏰ Best Time</div>
              <div className="text-xs text-blue-700 mt-1">
                Post between 2-4 PM for maximum visibility
              </div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm font-medium text-yellow-800">🎯 Opportunity</div>
              <div className="text-xs text-yellow-700 mt-1">
                Services category underperforming - consider promoting
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-3 text-left border border-gray-200 rounded hover:bg-gray-50">
              <div className="text-sm font-medium text-gray-900">📊 Export Report</div>
              <div className="text-xs text-gray-600">Download analytics data</div>
            </button>
            <button className="w-full p-3 text-left border border-gray-200 rounded hover:bg-gray-50">
              <div className="text-sm font-medium text-gray-900">🎯 Boost Low Performers</div>
              <div className="text-xs text-gray-600">Promote underperforming listings</div>
            </button>
            <button className="w-full p-3 text-left border border-gray-200 rounded hover:bg-gray-50">
              <div className="text-sm font-medium text-gray-900">📈 Set Alerts</div>
              <div className="text-xs text-gray-600">Get notified of engagement drops</div>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-900">{formatNumber(analytics?.total_clicks_week || 892)}</div>
            <div className="text-sm text-blue-700">Total Clicks This Week</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-900">73%</div>
            <div className="text-sm text-green-700">Engagement Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-900">2.4m</div>
            <div className="text-sm text-purple-700">Avg. Session Duration</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-900">12</div>
            <div className="text-sm text-orange-700">Active Listings</div>
          </div>
        </div>
      </div>
    </div>
  );
} 