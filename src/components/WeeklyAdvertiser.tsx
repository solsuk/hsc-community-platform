import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Modal from './Modal';

interface WeeklyAdSubscription {
  id: string;
  listing_id: string;
  position_slot: number;
  weekly_price: number;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  stripe_subscription_id?: string;
  stripe_payment_intent_id?: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending_payment';
  created_at: string;
  updated_at: string;
  listings: {
    id: string;
    title: string;
    type: string;
    featured_image_url: string;
    basic_description: string;
    status: string;
  };
}

interface AdSlot {
  position: number;
  is_available: boolean;
  base_price: number;
  bump_price: number;
  current_occupant?: {
    user_id: string;
    listing_title: string;
    weekly_price: number;
  };
  position_name: string;
  description: string;
}

interface AdvertiseListing {
  id: string;
  title: string;
  type: string;
  featured_image_url: string;
  status: string;
  basic_description: string;
}

interface WeeklyAdvertiserProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeeklyAdvertiser({ isOpen, onClose }: WeeklyAdvertiserProps) {
  const { user, authenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'slots' | 'subscriptions' | 'create'>('slots');
  const [subscriptions, setSubscriptions] = useState<WeeklyAdSubscription[]>([]);
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [advertiseListings, setAdvertiseListings] = useState<AdvertiseListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AdSlot | null>(null);
  
  // Form state for creating new subscriptions
  const [newSubscription, setNewSubscription] = useState({
    listing_id: '',
    target_position: 1,
    auto_renew: false,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && authenticated) {
      loadSubscriptions();
      loadSlots();
      loadAdvertiseListings();
    }
  }, [isOpen, authenticated]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weekly-ads', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load subscriptions');
      }
      
      const data = await response.json();
      setSubscriptions(data.subscriptions);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const response = await fetch('/api/weekly-ads/slots');
      
      if (!response.ok) {
        throw new Error('Failed to load slots');
      }
      
      const data = await response.json();
      setSlots(data.slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setError('Failed to load slot data');
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

  const createSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/weekly-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newSubscription)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }
      
      const data = await response.json();
      setSubscriptions([data.subscription, ...subscriptions]);
      setNewSubscription({
        listing_id: '',
        target_position: 1,
        auto_renew: false,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setActiveTab('subscriptions');
      await loadSlots(); // Refresh slots after creation
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (subscriptionId: string, action: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/weekly-ads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subscription_id: subscriptionId, action })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }
      
      const data = await response.json();
      setSubscriptions(subscriptions.map(sub => 
        sub.id === subscriptionId ? data.subscription : sub
      ));
      await loadSlots(); // Refresh slots after update
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'pending_payment': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlotColor = (position: number, isAvailable: boolean) => {
    if (isAvailable) {
      return 'border-green-500 bg-green-50';
    } else {
      return position === 1 ? 'border-red-500 bg-red-50' :
             position === 2 ? 'border-orange-500 bg-orange-50' :
             position === 3 ? 'border-yellow-500 bg-yellow-50' :
             'border-gray-500 bg-gray-50';
    }
  };

  if (!authenticated) {
    return null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Weekly Advertisement Manager"
      className="max-w-5xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'slots', label: 'Available Slots', icon: '🎯' },
            { id: 'subscriptions', label: 'My Subscriptions', icon: '📊' },
            { id: 'create', label: 'Purchase Ad', icon: '💳' }
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

        {/* Available Slots Tab */}
        {activeTab === 'slots' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Advertisement Positions</h3>
              <div className="text-sm text-gray-600">
                Base: $5/week • Bump: $10/week
              </div>
            </div>

            <div className="grid gap-4">
              {slots.map((slot) => (
                <div
                  key={slot.position}
                  className={`border-2 rounded-lg p-4 transition-all ${getSlotColor(slot.position, slot.is_available)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-lg">{slot.position_name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          slot.is_available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {slot.is_available ? 'Available' : 'Occupied'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
                      
                      {slot.current_occupant && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-sm font-medium">Current: {slot.current_occupant.listing_title}</p>
                          <p className="text-xs text-gray-500">Paying: ${slot.current_occupant.weekly_price}/week</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${slot.is_available ? slot.base_price : slot.bump_price}
                      </div>
                      <div className="text-sm text-gray-500">per week</div>
                      
                      {slot.is_available ? (
                        <button
                          onClick={() => {
                            setNewSubscription({ ...newSubscription, target_position: slot.position });
                            setActiveTab('create');
                          }}
                          className="mt-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Purchase
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setNewSubscription({ ...newSubscription, target_position: slot.position });
                            setActiveTab('create');
                          }}
                          className="mt-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Bump for $10
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Active Subscriptions</h3>
              <button
                onClick={() => setActiveTab('create')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Purchase New Ad
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No active subscriptions yet.</p>
                <p className="text-sm mt-2">Purchase your first weekly ad to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{subscription.listings.title}</h4>
                        <p className="text-sm text-gray-600">Position: Row {subscription.position_slot}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Weekly Price</p>
                        <p className="font-medium">${subscription.weekly_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Start Date</p>
                        <p className="font-medium">{new Date(subscription.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">End Date</p>
                        <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Auto-Renew</p>
                        <p className="font-medium">{subscription.auto_renew ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4 space-x-2">
                      {subscription.status === 'active' && (
                        <button
                          onClick={() => updateSubscription(subscription.id, 'cancel')}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      )}
                      {subscription.status === 'cancelled' && (
                        <button
                          onClick={() => updateSubscription(subscription.id, 'reactivate')}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Subscription Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Purchase Weekly Advertisement</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Purchase Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Advertisement Listing
                  </label>
                  <select
                    value={newSubscription.listing_id}
                    onChange={(e) => setNewSubscription({...newSubscription, listing_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    Target Position
                  </label>
                  <select
                    value={newSubscription.target_position}
                    onChange={(e) => setNewSubscription({...newSubscription, target_position: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {slots.map((slot) => (
                      <option key={slot.position} value={slot.position}>
                        {slot.position_name} - ${slot.is_available ? slot.base_price : slot.bump_price}/week
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newSubscription.start_date}
                    onChange={(e) => setNewSubscription({...newSubscription, start_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newSubscription.end_date}
                    onChange={(e) => setNewSubscription({...newSubscription, end_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto_renew"
                    checked={newSubscription.auto_renew}
                    onChange={(e) => setNewSubscription({...newSubscription, auto_renew: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto_renew" className="ml-2 block text-sm text-gray-900">
                    Auto-renew weekly
                  </label>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Price Summary</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span>Row {newSubscription.target_position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekly Rate:</span>
                      <span>${slots.find(s => s.position === newSubscription.target_position)?.is_available ? 5 : 10}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>7 days</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Total:</span>
                      <span>${slots.find(s => s.position === newSubscription.target_position)?.is_available ? 5 : 10}.00</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={createSubscription}
                  disabled={loading || !newSubscription.listing_id}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium"
                >
                  {loading ? 'Processing...' : 'Purchase Advertisement'}
                </button>
              </div>

              {/* Position Preview */}
              <div className="space-y-4">
                <h4 className="font-medium">Position Preview</h4>
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.position}
                      className={`p-3 rounded-md border-2 ${
                        newSubscription.target_position === slot.position
                          ? 'border-blue-500 bg-blue-50'
                          : slot.is_available 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{slot.position_name}</p>
                          <p className="text-sm text-gray-600">{slot.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${slot.is_available ? slot.base_price : slot.bump_price}</p>
                          <p className="text-xs text-gray-500">
                            {slot.is_available ? 'Available' : 'Occupied'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
} 