import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Modal from './Modal';

interface PremiumCampaign {
  id: string;
  listing_id: string;
  campaign_name: string;
  target_position: number;
  bid_amount: number;
  max_daily_budget: number;
  current_daily_spend: number;
  status: 'active' | 'paused' | 'expired' | 'pending_payment';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  impressions: number;
  clicks: number;
  cost_per_click: number;
  created_at: string;
  end_date?: string;
  listings: {
    id: string;
    title: string;
    type: string;
    featured_image_url: string;
    status: string;
  };
}

interface PositionSlot {
  id: number;
  position_name: string;
  position_order: number;
  is_top_row: boolean;
  is_premium: boolean;
  visibility_score: number;
  minimum_bid: number;
  maximum_bid: number;
  base_cost_per_click: number;
  current_winner?: any;
  dynamic_price: number;
  active_bids_count: number;
  competition_level: 'low' | 'medium' | 'high';
}

interface AdvertiseListing {
  id: string;
  title: string;
  type: string;
  featured_image_url: string;
  status: string;
  basic_description: string;
}

interface AnalyticsSummary {
  impressions: number;
  clicks: number;
  contacts: number;
  conversions: number;
  total_spend: number;
  click_through_rate: number;
  contact_rate: number;
  conversion_rate: number;
  average_cost_per_click: number;
}

interface PremiumAdvertiserProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumAdvertiser({ isOpen, onClose }: PremiumAdvertiserProps) {
  const { user, authenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create' | 'analytics'>('campaigns');
  const [campaigns, setCampaigns] = useState<PremiumCampaign[]>([]);
  const [positions, setPositions] = useState<PositionSlot[]>([]);
  const [advertiseListings, setAdvertiseListings] = useState<AdvertiseListing[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<PremiumCampaign | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for creating new campaigns
  const [newCampaign, setNewCampaign] = useState({
    listing_id: '',
    campaign_name: '',
    target_position: 1,
    bid_amount: 0,
    max_daily_budget: 0,
    end_date: ''
  });

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && authenticated) {
      loadCampaigns();
      loadPositions();
      loadAdvertiseListings();
    }
  }, [isOpen, authenticated]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/premium-ads', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load campaigns');
      }
      
      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadPositions = async () => {
    try {
      const response = await fetch('/api/premium-ads/positions');
      
      if (!response.ok) {
        throw new Error('Failed to load positions');
      }
      
      const data = await response.json();
      setPositions(data.positions);
    } catch (error) {
      console.error('Error loading positions:', error);
      setError('Failed to load position data');
    }
  };

  const loadAdvertiseListings = async () => {
    try {
      const response = await fetch('/api/listings?type=advertise', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load advertise listings');
      }
      
      const data = await response.json();
      setAdvertiseListings(data.listings.filter((listing: AdvertiseListing) => listing.status === 'active'));
    } catch (error) {
      console.error('Error loading advertise listings:', error);
      setError('Failed to load your advertisement listings');
    }
  };

  const loadAnalytics = async (campaignId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/premium-ads/analytics?campaign_id=${campaignId}&summary=true`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }
      
      const data = await response.json();
      setAnalytics(data.summary);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/premium-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newCampaign)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }
      
      const data = await response.json();
      setCampaigns([data.campaign, ...campaigns]);
      setNewCampaign({
        listing_id: '',
        campaign_name: '',
        target_position: 1,
        bid_amount: 0,
        max_daily_budget: 0,
        end_date: ''
      });
      setActiveTab('campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const getPositionName = (position: number) => {
    const pos = positions.find(p => p.position_order === position);
    return pos ? pos.position_name : `Position ${position}`;
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'pending_payment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!authenticated) {
    return null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Premium Advertisement Manager"
      className="max-w-6xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'campaigns', label: 'My Campaigns', icon: '📊' },
            { id: 'create', label: 'Create Campaign', icon: '🎯' },
            { id: 'analytics', label: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Premium Campaigns</h3>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create New Campaign
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No premium campaigns yet.</p>
                <p className="text-sm mt-2">Create your first campaign to get started with premium advertising!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{campaign.campaign_name}</h4>
                        <p className="text-sm text-gray-600">{campaign.listings.title}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.payment_status)}`}>
                          {campaign.payment_status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Position</p>
                        <p className="font-medium">{getPositionName(campaign.target_position)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bid Amount</p>
                        <p className="font-medium">${campaign.bid_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Daily Budget</p>
                        <p className="font-medium">${campaign.max_daily_budget.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Daily Spend</p>
                        <p className="font-medium text-green-600">${campaign.current_daily_spend.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t">
                      <div>
                        <p className="text-gray-600">Impressions</p>
                        <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Clicks</p>
                        <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CTR</p>
                        <p className="font-medium">
                          {campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg CPC</p>
                        <p className="font-medium">${campaign.cost_per_click.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4 space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setActiveTab('analytics');
                          loadAnalytics(campaign.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Analytics
                      </button>
                      <button
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Edit Campaign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Campaign Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Create Premium Campaign</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Campaign Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Advertisement Listing
                  </label>
                  <select
                    value={newCampaign.listing_id}
                    onChange={(e) => setNewCampaign({...newCampaign, listing_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select a listing...</option>
                    {advertiseListings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={newCampaign.campaign_name}
                    onChange={(e) => setNewCampaign({...newCampaign, campaign_name: e.target.value})}
                    placeholder="e.g., Holiday Sale 2024"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Position
                  </label>
                  <select
                    value={newCampaign.target_position}
                    onChange={(e) => setNewCampaign({...newCampaign, target_position: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {positions.map((position) => (
                      <option key={position.id} value={position.position_order}>
                        {position.position_name} - Min: ${position.minimum_bid.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bid Amount (per click)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCampaign.bid_amount}
                    onChange={(e) => setNewCampaign({...newCampaign, bid_amount: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Budget
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCampaign.max_daily_budget}
                    onChange={(e) => setNewCampaign({...newCampaign, max_daily_budget: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({...newCampaign, end_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <button
                  onClick={createCampaign}
                  disabled={loading || !newCampaign.listing_id || !newCampaign.campaign_name || newCampaign.bid_amount <= 0}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>

              {/* Position Slots Info */}
              <div className="space-y-4">
                <h4 className="font-medium">Available Positions</h4>
                <div className="space-y-2">
                  {positions.map((position) => (
                    <div
                      key={position.id}
                      className={`p-3 rounded-md border ${
                        newCampaign.target_position === position.position_order
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{position.position_name}</p>
                          <p className="text-sm text-gray-600">
                            Visibility: {position.visibility_score}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${position.dynamic_price.toFixed(2)}</p>
                          <p className={`text-xs ${getCompetitionColor(position.competition_level)}`}>
                            {position.competition_level} competition
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Range: ${position.minimum_bid.toFixed(2)} - ${position.maximum_bid.toFixed(2)}
                        {position.active_bids_count > 0 && (
                          <span className="ml-2">• {position.active_bids_count} active bids</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Campaign Analytics</h3>
              {selectedCampaign && (
                <select
                  value={selectedCampaign.id}
                  onChange={(e) => {
                    const campaign = campaigns.find(c => c.id === e.target.value);
                    if (campaign) {
                      setSelectedCampaign(campaign);
                      loadAnalytics(campaign.id);
                    }
                  }}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.campaign_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedCampaign && analytics && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{selectedCampaign.campaign_name}</h4>
                  <p className="text-sm text-gray-600">{selectedCampaign.listings.title}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Impressions</p>
                    <p className="text-2xl font-bold">{analytics.impressions.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Clicks</p>
                    <p className="text-2xl font-bold">{analytics.clicks.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">CTR</p>
                    <p className="text-2xl font-bold">{analytics.click_through_rate.toFixed(2)}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Total Spend</p>
                    <p className="text-2xl font-bold">${analytics.total_spend.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Contacts</p>
                    <p className="text-2xl font-bold">{analytics.contacts.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Conversions</p>
                    <p className="text-2xl font-bold">{analytics.conversions.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Contact Rate</p>
                    <p className="text-2xl font-bold">{analytics.contact_rate.toFixed(2)}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600">Avg CPC</p>
                    <p className="text-2xl font-bold">${analytics.average_cost_per_click.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {!selectedCampaign && (
              <div className="text-center py-8 text-gray-500">
                <p>Select a campaign to view analytics</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
} 