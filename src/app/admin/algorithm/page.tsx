'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AlgorithmConfig {
  weight_age: number;
  weight_clicks: number;
  max_age_hours: number;
  boost_premium: boolean;
  engagement_threshold: number;
}

interface ListingPreview {
  id: string;
  title: string;
  type: string;
  created_at: string;
  clicks: number;
  current_score: number;
  new_score: number;
  position_change: 'up' | 'down' | 'same';
}

export default function AlgorithmControl() {
  const [config, setConfig] = useState<AlgorithmConfig>({
    weight_age: 0.6,
    weight_clicks: 0.4,
    max_age_hours: 168, // 7 days
    boost_premium: true,
    engagement_threshold: 10
  });
  
  const [previews, setPreviews] = useState<ListingPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  useEffect(() => {
    if (previewMode) {
      generatePreview();
    }
  }, [config, previewMode]);

  const fetchCurrentConfig = async () => {
    try {
      const response = await fetch('/api/admin/algorithm');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching algorithm config:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    try {
      const response = await fetch('/api/admin/algorithm/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreviews(data.previews);
        }
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Algorithm configuration saved successfully!');
          setPreviewMode(false);
        } else {
          alert('Error saving configuration: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Error saving algorithm config:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleWeightChange = (type: 'age' | 'clicks', value: number) => {
    const newValue = value / 100;
    if (type === 'age') {
      setConfig(prev => ({
        ...prev,
        weight_age: newValue,
        weight_clicks: 1 - newValue
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        weight_clicks: newValue,
        weight_age: 1 - newValue
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading algorithm settings...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mt-2">🎛️ Algorithm Control</h1>
            <p className="text-gray-600">Fine-tune the listing ranking algorithm</p>
          </div>
          <div className="text-sm text-gray-500">
            Status: <span className="text-green-600 font-medium">✅ Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Algorithm Weights</h2>
          
          {/* Age Weight Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">📅 Age Factor</label>
              <span className="text-sm text-gray-600">{Math.round(config.weight_age * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(config.weight_age * 100)}
              onChange={(e) => handleWeightChange('age', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
            />
            <p className="text-xs text-gray-500 mt-1">
              How much newer listings are boosted (recent = higher score)
            </p>
          </div>

          {/* Clicks Weight Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">👆 Clicks Factor</label>
              <span className="text-sm text-gray-600">{Math.round(config.weight_clicks * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(config.weight_clicks * 100)}
              onChange={(e) => handleWeightChange('clicks', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
            />
            <p className="text-xs text-gray-500 mt-1">
              How much popular listings are boosted (more clicks = higher score)
            </p>
          </div>

          {/* Advanced Settings */}
          <div className="border-t pt-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">🔧 Advanced Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Max Age (hours)</label>
                <input
                  type="number"
                  value={config.max_age_hours}
                  onChange={(e) => setConfig(prev => ({ ...prev, max_age_hours: parseInt(e.target.value) }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min="24"
                  max="720"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum age for listings to be ranked</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="boost_premium"
                  checked={config.boost_premium}
                  onChange={(e) => setConfig(prev => ({ ...prev, boost_premium: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="boost_premium" className="ml-2 text-sm text-gray-700">
                  Boost premium advertisements
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Engagement Threshold</label>
                <input
                  type="number"
                  value={config.engagement_threshold}
                  onChange={(e) => setConfig(prev => ({ ...prev, engagement_threshold: parseInt(e.target.value) }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum clicks needed for engagement scoring</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">👁️ Live Preview</h2>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                previewMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {previewMode ? 'Preview On' : 'Preview Off'}
            </button>
          </div>

          {previewMode ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                How these settings would affect current listings:
              </div>
              
              {previews.length > 0 ? (
                previews.slice(0, 8).map((listing, index) => (
                  <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        #{index + 1} {listing.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {listing.type} • {listing.clicks} clicks
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">
                        Score: {listing.new_score.toFixed(3)}
                      </div>
                      <div className={`text-xs font-medium ${
                        listing.position_change === 'up' ? 'text-green-600' :
                        listing.position_change === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {listing.position_change === 'up' ? '↗️' :
                         listing.position_change === 'down' ? '↘️' : '→'}
                        {listing.position_change === 'same' ? 'Same' : 
                         listing.position_change === 'up' ? 'Up' : 'Down'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm">Generating preview...</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-3xl mb-3">🎛️</div>
              <div className="text-sm">Enable preview to see how changes affect ranking</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <strong>Current Formula:</strong> Score = (1/(hours+1)) × {Math.round(config.weight_age * 100)}% + (clicks/max_clicks) × {Math.round(config.weight_clicks * 100)}%
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => fetchCurrentConfig()}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset Changes
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Algorithm'}
            </button>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-2">📈 Expected Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-green-800">Higher age weight ({Math.round(config.weight_age * 100)}%)</div>
            <div className="text-green-700">Newer listings rank higher</div>
          </div>
          <div>
            <div className="font-medium text-blue-800">Higher click weight ({Math.round(config.weight_clicks * 100)}%)</div>
            <div className="text-blue-700">Popular listings rank higher</div>
          </div>
          <div>
            <div className="font-medium text-gray-800">Engagement threshold: {config.engagement_threshold}</div>
            <div className="text-gray-700">Minimum clicks for scoring</div>
          </div>
        </div>
      </div>
    </div>
  );
} 