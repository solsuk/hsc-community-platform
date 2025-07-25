'use client';
import { Suspense, useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { useAuth } from '@/hooks/useAuth';
import ListingForm from '@/components/ListingForm';
import BusinessAdModal from '@/components/BusinessAdModal';
import BusinessAdvertiser from '@/components/BusinessAdvertiser';

// Define a type for our listing items - matching API response
interface Listing {
  id: string;
  user_id: string;
  type: 'sell' | 'trade' | 'announce' | 'advertise' | 'wanted';
  title: string;
  basic_description: string;
  detailed_description: string;
  featured_image_url: string;
  price?: number;
  clicks: number;
  created_at: string;
  is_private: boolean;
  category?: string;
  category_display_name?: string;
  status: 'active' | 'sold' | 'expired' | 'draft';
}

export default function Home() {
  const { user, authenticated } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [businessEditModalOpen, setBusinessEditModalOpen] = useState(false);
  const [editingBusinessListing, setEditingBusinessListing] = useState<Listing | null>(null);

  // Helper function to check if current user owns a listing
  const isOwnListing = (listing: Listing): boolean => {
    return authenticated && user?.id === listing.user_id;
  };

  // Edit listing functions
  const handleEditListing = (listing: Listing) => {
    if (listing.type === 'advertise') {
      // Open business advertiser for business advertisements
      setEditingBusinessListing(listing);
      setBusinessEditModalOpen(true);
    } else {
      // Open regular listing form for other listings
      setEditingListing(listing);
      setEditModalOpen(true);
    }
  };

  const handleListingUpdated = (updatedListing: Listing) => {
    setListings(prevListings => 
      prevListings.map(listing => 
        listing.id === updatedListing.id ? updatedListing : listing
      )
    );
    setSelectedListing(updatedListing);
  };

  const handleSoldListing = async (listing: Listing) => {
    if (!authenticated || !user) {
      alert('Please log in to update listings');
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...listing,
          status: 'sold'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark listing as sold');
      }

      const result = await response.json();
      handleListingUpdated(result.listing);
    } catch (error) {
      console.error('Error marking listing as sold:', error);
      alert('Failed to update listing');
    }
  };

  const handleRemoveListing = async (listing: Listing) => {
    if (!authenticated || !user) {
      alert('Please log in to remove listings');
      return;
    }

    if (!confirm('Are you sure you want to remove this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listing.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove listing');
      }

      // Remove from local state
      setListings(prevListings => prevListings.filter(l => l.id !== listing.id));
      setSelectedListing(null);
    } catch (error) {
      console.error('Error removing listing:', error);
      alert('Failed to remove listing');
    }
  };

  // Lightbox functions
  const openLightbox = (images: string[], startIndex: number) => {
    setLightboxImages(images);
    setSelectedImageIndex(startIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImageIndex(0);
    setLightboxImages([]);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxImages.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen]);

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/listings');
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        const data = await response.json();
        setListings(data.listings || []);
      } catch (error) {
        console.error('Error fetching listings:', error);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Add tooltip functionality
  useEffect(() => {
    let tooltip: HTMLDivElement | null = null;

    const createTooltip = () => {
      tooltip = document.createElement('div');
      tooltip.className = 'tooltip-container';
      tooltip.textContent = 'Private Listing';
      document.body.appendChild(tooltip);
    };

    const handleMouseMove = (e: Event) => {
      if (!tooltip) return;
      const mouseEvent = e as MouseEvent;
      tooltip.style.display = 'block';
      tooltip.style.left = `${mouseEvent.clientX}px`;
      tooltip.style.top = `${mouseEvent.clientY}px`;
    };

    const handleMouseLeave = () => {
      if (!tooltip) return;
      tooltip.style.display = 'none';
    };

    // Initialize tooltip and event listeners
    createTooltip();
    const privateTiles = document.querySelectorAll('.private-tile');
    privateTiles.forEach(tile => {
      tile.addEventListener('mousemove', handleMouseMove);
      tile.addEventListener('mouseleave', handleMouseLeave);
    });

    // Cleanup
    return () => {
      if (tooltip) {
        document.body.removeChild(tooltip);
      }
      privateTiles.forEach(tile => {
        tile.removeEventListener('mousemove', handleMouseMove);
        tile.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [listings]); // Re-run when listings change

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFAFA'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listings...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFAFA'}}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Sort listings by date (newest first) and then by clicks
  const sortedListings = [...listings].sort((a, b) => {
    // First sort by date (newest first)
    const dateComparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (dateComparison !== 0) return dateComparison;
    
    // If dates are the same, sort by clicks (most first)
    return b.clicks - a.clicks;
  });

  // Step 2: Organize listings with simple advertisement placement
  const organizeListings = (): Listing[] => {
    // Separate ads from other listings
    const advertisements = sortedListings.filter(item => item.type === 'advertise');
    const nonAdvertisements = sortedListings.filter(item => item.type !== 'advertise');
    
    // Simple interspersing: place an ad every ~6-8 items
    const organizedArray: Listing[] = [];
    let adIndex = 0;
    const adInterval = 7; // Place an ad every 7 items
    
    for (let i = 0; i < nonAdvertisements.length; i++) {
      organizedArray.push(nonAdvertisements[i]);
      
      // Add an ad every adInterval items (but not at the very beginning or end)
      if ((i + 1) % adInterval === 0 && adIndex < advertisements.length && i > 0 && i < nonAdvertisements.length - 1) {
        organizedArray.push(advertisements[adIndex++]);
      }
    }
    
    // Add any remaining ads at the end, but not as the last item
    while (adIndex < advertisements.length && organizedArray.length > 0) {
      // Insert before the last item
      organizedArray.splice(organizedArray.length - 1, 0, advertisements[adIndex++]);
    }
    
    return organizedArray;
  };

  // Invisible click tracking function
  const trackListingClick = async (listingId: string) => {
    try {
      await fetch(`/api/listings/${listingId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'click'
        })
      });
    } catch (error) {
      // Fail silently - don't interrupt user experience
      console.log('Click tracking failed:', error);
    }
  };

  const finalListings = organizeListings();

  return (
    <div>
      {/* Container frame for the entire content area */}
      <div className="min-h-screen" style={{backgroundColor: '#FBFAFA'}}>
        {/* Bento-box style grid - no max width constraint */}
        <div className="tile-grid px-4 sm:px-6 lg:px-8">
            {finalListings.map((listing, index) => {
              const isOwner = isOwnListing(listing);
              return (
              <div
                key={`${listing.id}-${index}`}
                onClick={() => {
                  // Track click for all listings (invisible to users)
                  trackListingClick(listing.id);
                  
                  if (isOwner) {
                    handleEditListing(listing);
                  } else {
                    setSelectedListing(listing);
                  }
                }}
                className={`
                  group relative rounded-2xl transition-all duration-300 border overflow-hidden
                  aspect-square hover:shadow-lg hover:scale-[1.02] cursor-pointer
                  ${listing.is_private ? 'private-tile opacity-60 filter saturate-50' : ''}
                  ${listing.status === 'sold' ? 'opacity-60 filter saturate-50' : ''}
                  ${isOwner ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50/20' : 
                    listing.type === 'advertise' ? 'border-orange-300 ring-2 ring-orange-200/50 shadow-orange-100/50 shadow-xl' : 
                    listing.type === 'wanted' ? 'border-purple-300 ring-2 ring-purple-200/50 shadow-purple-100/50' :
                    'border-gray-200'}
                `}
                style={{
                  backgroundImage: `url(${listing.featured_image_url || '/images/hillsmere-shores-md-2439300.gif'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                role="button"
                aria-label={`View ${listing.title}`}
              >
                {/* Simple overlay for better text readability */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300"></div>
                
                {/* Content */}
                <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                  {/* Top section with badge and private indicator */}
                  <div className="flex items-start justify-between">
                    {/* Listing type label with simple coloring */}
                    <div className={`inline-block px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold mb-2 sm:mb-3 text-white border border-white/30 ${
                      listing.type === 'sell' ? 'bg-green-500' :
                      listing.type === 'trade' ? 'bg-yellow-500' :
                      listing.type === 'announce' ? 'bg-blue-500' :
                      listing.type === 'advertise' ? 'bg-orange-500 border-orange-300 shadow-lg' :
                      listing.type === 'wanted' ? 'bg-purple-500 border-purple-300' :
                      'bg-gray-800'
                    }`}>
                      {listing.type === 'sell' ? 'FOR SALE' : 
                       listing.type === 'advertise' ? 'Ad' : 
                       listing.type === 'wanted' ? 'Wanted' :
                       listing.type.toUpperCase()}
                    </div>
                    {(listing.is_private || listing.status === 'sold') && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-black/60 text-white backdrop-blur-sm border border-white/10">
                        {listing.status === 'sold' ? 'Sold' : 'Private'}
                      </span>
                    )}
                                    </div>
                  
                  {/* Bottom section with title and description */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white drop-shadow-lg">
                      {listing.title}
                    </h3>
                    
                    {/* Price display for sell listings */}
                    {listing.type === 'sell' && listing.price && (
                      <p className="text-lg font-bold text-white drop-shadow-lg">
                        ${listing.price}
                      </p>
                    )}
                    
                    {/* Category display */}
                    {listing.category_display_name && (
                      <p className="text-xs text-white/70 drop-shadow-sm">
                        {listing.category_display_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Floating Edit Button for Owner - Business Ads Only */}
                {isOwner && listing.type === 'advertise' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent tile click
                      handleEditListing(listing);
                    }}
                    className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    ✏️ Edit?
                  </button>
                )}
                
                {/* Floating Edit Button for Owner - Regular Listings */}
                {isOwner && listing.type !== 'advertise' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent tile click
                      handleEditListing(listing);
                    }}
                    className="absolute bottom-3 right-3 bg-blue-500/80 hover:bg-blue-600/90 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/20"
                  >
                    ✏️ Edit?
                  </button>
                )}
              </div>
            );
            })}
        </div>
      </div>
      


      {/* Listing Detail Modal */}
      {selectedListing && (
        <Modal 
          isOpen={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          title={selectedListing.type === 'advertise' ? '' : selectedListing.title}
          className="max-w-4xl"
        >
          {selectedListing.type === 'advertise' ? (
            <BusinessAdModal 
              listing={selectedListing} 
              user={user}
              authenticated={authenticated}
              onEditListing={handleEditListing}
            />
          ) : (
            <div className="space-y-6">
              {/* Listing Image */}
              {selectedListing.featured_image_url && (
                <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={selectedListing.featured_image_url} 
                    alt={selectedListing.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Listing Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Details</h3>
                  <div className="space-y-2">
                    <p><strong>Type:</strong> {selectedListing.type === 'sell' ? 'For Sale' : selectedListing.type.charAt(0).toUpperCase() + selectedListing.type.slice(1)}</p>
                    {selectedListing.category_display_name && (
                      <p><strong>Category:</strong> {selectedListing.category_display_name}</p>
                    )}
                    {selectedListing.price && (
                      <p><strong>Price:</strong> ${selectedListing.price}</p>
                    )}
                    <p><strong>Posted:</strong> {new Date(selectedListing.created_at).toLocaleDateString()}</p>
                    <p><strong>Views:</strong> {selectedListing.clicks}</p>
                    {selectedListing.is_private && (
                      <p><strong>Visibility:</strong> Private</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <div className="space-y-3">
                    {selectedListing.basic_description && (
                      <div>
                        <p className="text-sm text-gray-600">Brief:</p>
                        <p>{selectedListing.basic_description}</p>
                      </div>
                    )}
                    {selectedListing.detailed_description && (
                      <div>
                        <p className="text-sm text-gray-600">Details:</p>
                        <p>{selectedListing.detailed_description}</p>
                      </div>
                    )}
                    {!selectedListing.basic_description && !selectedListing.detailed_description && (
                      <p className="text-gray-500">No description available</p>
                    )}
                  </div>
                </div>
              </div>



            {/* Contact/Action Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              {isOwnListing(selectedListing) ? (
                <>
                  <button 
                    onClick={() => {
                      handleEditListing(selectedListing);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ✏️ Edit Listing
                  </button>
                  <button 
                    onClick={() => {
                      handleSoldListing(selectedListing);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✅ Mark as Sold
                  </button>
                  <button 
                    onClick={() => {
                      handleRemoveListing(selectedListing);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ Remove Listing
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setContactModalOpen(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {selectedListing.type === 'sell' || selectedListing.type === 'trade' ? '📧 Contact Seller' : '📧 Contact'}
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    📤 Share Listing
                  </button>
                </>
              )}
            </div>
            </div>
          )}
        </Modal>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-4"
          style={{ zIndex: 9999999 }}
          onClick={closeLightbox}
        >
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            style={{ zIndex: 9999999 }}
          >
            ×
          </button>
          
          {lightboxImages.length > 1 && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                style={{ zIndex: 9999999 }}
              >
                ‹
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                style={{ zIndex: 9999999 }}
              >
                ›
              </button>
            </>
          )}
          
          <div className="w-full h-full flex items-center justify-center p-8">
            <img 
              src={lightboxImages[selectedImageIndex]} 
              alt={`Image ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{ 
                maxWidth: 'calc(100vw - 4rem)', 
                maxHeight: 'calc(100vh - 4rem)',
                width: 'auto',
                height: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              {selectedImageIndex + 1} / {lightboxImages.length}
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded">
            Use arrow keys or click arrows to navigate • ESC to close
          </div>
        </div>
      )}

      {/* Contact Seller Modal */}
      {contactModalOpen && selectedListing && (
        <Modal 
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          title={`Contact ${selectedListing.type === 'sell' || selectedListing.type === 'trade' ? 'Seller' : 'Poster'}`}
          className="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Regarding:</h4>
              <p className="font-medium">{selectedListing.title}</p>
              {selectedListing.price && (
                <p className="text-green-600 font-semibold">${selectedListing.price}</p>
              )}
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Hi! I'm interested in your ${selectedListing.title}${selectedListing.price ? ` listed for $${selectedListing.price}` : ''}. Is it still available?`}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Edit Listing Modal */}
      <ListingForm
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingListing(null);
        }}
        editingListing={editingListing}
        onListingUpdated={handleListingUpdated}
      />

      {/* Edit Business Advertisement Modal */}
      <BusinessAdvertiser
        isOpen={businessEditModalOpen}
        onClose={() => {
          setBusinessEditModalOpen(false);
          setEditingBusinessListing(null);
        }}
        editingListing={editingBusinessListing}
        onListingUpdated={handleListingUpdated}
      />


    </div>
  );
}
