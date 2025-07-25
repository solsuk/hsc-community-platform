import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Modal from './Modal';

interface BusinessType {
  id: string;
  name: string;
  description: string;
  icon: string;
  fields: string[];
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

interface BusinessAdvertiserProps {
  isOpen: boolean;
  onClose: () => void;
  editingListing?: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    basic_description: string;
    detailed_description: string;
    featured_image_url?: string;
    image_urls?: string[];
  } | null;
  onListingUpdated?: (updatedListing: any) => void;
}

const BUSINESS_TYPES: BusinessType[] = [
  {
    id: 'restaurant',
    name: 'Restaurant/Food Service',
    description: 'Restaurants, cafes, food trucks, catering',
    icon: '🍽️',
    fields: ['menu', 'hours', 'delivery', 'dietary_options', 'online_ordering']
  },
  {
    id: 'service',
    name: 'Service Business',
    description: 'Plumbing, electrical, cleaning, repair services',
    icon: '🔧',
    fields: ['service_area', 'emergency_available', 'certifications', 'before_after_photos', 'booking']
  },
  {
    id: 'retail',
    name: 'Retail/Shopping',
    description: 'Stores, boutiques, online shops',
    icon: '🛍️',
    fields: ['product_categories', 'store_hours', 'sales_promotions', 'inventory_highlights', 'online_store']
  },
  {
    id: 'events',
    name: 'Events/Entertainment',
    description: 'Concerts, parties, shows, activities',
    icon: '🎉',
    fields: ['event_datetime', 'ticket_pricing', 'venue_info', 'rsvp_tracking', 'social_media']
  },
  {
    id: 'professional',
    name: 'Professional Services',
    description: 'Real estate, legal, consulting, finance',
    icon: '💼',
    fields: ['credentials', 'service_descriptions', 'testimonials', 'consultation_booking', 'portfolio']
  },
  {
    id: 'other',
    name: 'Other Business',
    description: 'Any other type of business',
    icon: '🏪',
    fields: ['basic_info', 'contact_methods', 'description']
  }
];

export default function BusinessAdvertiser({ isOpen, onClose, editingListing, onListingUpdated }: BusinessAdvertiserProps) {
  const { user, authenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState<'business_type' | 'create_ad' | 'preview' | 'placement' | 'payment'>('business_type');
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    title: '',
    description: '',
    discount_text: '',
    qr_destination: '',
    expiration_date: ''
  });

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<Array<{
    file: File;
    url: string;
    fileName?: string;
    uploading: boolean;
    error?: string;
  }>>([]);
  const [uploading, setUploading] = useState(false);

  // Track if component is mounted to prevent updates after unmount
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Ad bidding state
  const [marketState, setMarketState] = useState<{
    current_top_bid: number;
    price_to_beat: number;
    total_active_bids: number;
    positions: any[];
  } | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(5.00);
  const [loadingMarket, setLoadingMarket] = useState(false);

  // Helper to check if we're in editing mode
  const isEditing = Boolean(editingListing);

  // Ad placement and payment state
  const [paymentType, setPaymentType] = useState<'one_time' | 'subscription'>('one_time');
  const [selectedPlacement, setSelectedPlacement] = useState<'standard' | 'competitive'>('standard');
  const [savedListingId, setSavedListingId] = useState<string | null>(null);

  // Load market state for bidding
  const loadMarketState = async () => {
    if (!authenticated || !isMounted) return;
    
    setLoadingMarket(true);
    try {
      const response = await fetch('/api/ad-positions');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMarketState(data.market_state);
          setBidAmount(data.market_state.price_to_beat);
        }
      }
    } catch (error) {
      console.error('Error loading market state:', error);
    } finally {
      setLoadingMarket(false);
    }
  };

  // Populate form data when editing a listing
  useEffect(() => {
    if (editingListing && isOpen) {
      // Parse business info from existing listing
      const businessName = editingListing.title.split(' - ')[0] || editingListing.title;
      const headline = editingListing.title.includes(' - ') ? 
        editingListing.title.split(' - ').slice(1).join(' - ') : 
        editingListing.basic_description;
      
      // Detect business type
      const detectedType = editingListing.title.toLowerCase().includes('pizza') || editingListing.title.toLowerCase().includes('restaurant') ? 'restaurant' :
        editingListing.title.toLowerCase().includes('plumbing') || editingListing.title.toLowerCase().includes('service') ? 'service' :
        editingListing.title.toLowerCase().includes('boutique') || editingListing.title.toLowerCase().includes('style') ? 'retail' :
        editingListing.title.toLowerCase().includes('law') || editingListing.title.toLowerCase().includes('attorney') ? 'professional' : 'other';

      const businessType = BUSINESS_TYPES.find(bt => bt.id === detectedType);
      if (businessType) {
        setSelectedBusinessType(businessType);
      }

      setAdData({
        business_name: businessName,
        business_type: detectedType,
        headline: headline,
        description: editingListing.detailed_description || editingListing.basic_description,
        call_to_action: 'Contact Us',
        contact_methods: {
          phone: '',
          email: '',
          website: '',
          address: '',
          social_media: {
            facebook: '',
            instagram: '',
            twitter: ''
          }
        },
        featured_image: editingListing.featured_image_url || '',
        gallery_images: editingListing.image_urls || [],
        business_specific: {
          reservation_link: '',
          reservation_platform: '',
          menu_upload: '',
          hours: {
            monday: { open: '', close: '', closed: false },
            tuesday: { open: '', close: '', closed: false },
            wednesday: { open: '', close: '', closed: false },
            thursday: { open: '', close: '', closed: false },
            friday: { open: '', close: '', closed: false },
            saturday: { open: '', close: '', closed: false },
            sunday: { open: '', close: '', closed: false }
          },
          dietary_options: [] as string[],
          delivery_options: [] as string[],
          coupons: [] as Array<{
            id: string;
            title: string;
            description: string;
            discount_text: string;
            qr_destination: string;
            expiration_date: string;
            is_active: boolean;
            download_count: number;
          }>
        } as any,
        placement_preference: 'standard',
        weekly_budget: 5,
        auto_renew: false,
        allow_mailing_list_signup: false
      });

      // Set up uploaded images for editing
      if (editingListing.featured_image_url || editingListing.image_urls?.length) {
        const existingImages = [];
        
        // Add featured image
        if (editingListing.featured_image_url) {
          existingImages.push({
            file: new File([], 'existing-featured.jpg'),
            url: editingListing.featured_image_url,
            uploading: false,
            fileName: editingListing.featured_image_url.split('/').pop() || 'existing-image'
          });
        }
        
        // Add additional images
        if (editingListing.image_urls && editingListing.image_urls.length) {
          editingListing.image_urls.forEach((url, index) => {
            if (url !== editingListing.featured_image_url) {
              existingImages.push({
                file: new File([], `existing-${index}.jpg`),
                url: url,
                uploading: false,
                fileName: url.split('/').pop() || `existing-image-${index}`
              });
            }
          });
        }
        
        setUploadedImages(existingImages);
      }

      // Skip business type selection and go to create_ad step
      setCurrentStep('create_ad');
    }
  }, [editingListing, isOpen]);

  // Form state for the advertisement
  const [adData, setAdData] = useState({
    // Basic info
    business_name: '',
    business_type: '',
    headline: '',
    description: '',
    call_to_action: '',
    
    // Contact information
    contact_methods: {
      phone: '',
      email: '',
      website: '',
      address: '',
      social_media: {
        facebook: '',
        instagram: '',
        twitter: ''
      }
    },
    
    // Images
    featured_image: '',
    gallery_images: [] as string[],
    
    // Business-specific fields (populated based on business type)
    business_specific: {
      // Restaurant-specific fields
      reservation_link: '', // Resy, OpenTable, etc.
      reservation_platform: '', // 'resy', 'opentable', 'custom', etc.
      menu_upload: '',
      hours: {
        monday: { open: '', close: '', closed: false },
        tuesday: { open: '', close: '', closed: false },
        wednesday: { open: '', close: '', closed: false },
        thursday: { open: '', close: '', closed: false },
        friday: { open: '', close: '', closed: false },
        saturday: { open: '', close: '', closed: false },
        sunday: { open: '', close: '', closed: false }
      },
      dietary_options: [] as string[],
      delivery_options: [] as string[],
      coupons: [] as Array<{
        id: string;
        title: string;
        description: string;
        discount_text: string;
        qr_destination: string; // URL where QR code leads
        expiration_date: string;
        is_active: boolean;
        download_count: number;
      }>
    } as any,
    
    // Placement preferences
    placement_preference: 'standard', // 'standard' or 'top_row'
    weekly_budget: 5,
    auto_renew: false,
    
    // Mailing list
    allow_mailing_list_signup: false
  });

  // Load market state when modal opens or placement step is reached
  useEffect(() => {
    if (isOpen && authenticated && (currentStep === 'placement' || currentStep === 'preview')) {
      loadMarketState();
    }
  }, [isOpen, authenticated, currentStep]);

  // Load slots when modal opens
  useEffect(() => {
    let isMounted = true;

    const loadSlotsIfMounted = async () => {
      if (!isMounted) return;
      
      try {
        const response = await fetch('/api/weekly-ads/slots');
        if (!response.ok) {
          console.error('Slots API response not ok:', response.status, response.statusText);
          throw new Error(`Failed to load slots: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
          console.error('Slots API returned error:', data.error);
          throw new Error(data.error);
        }
        
        // Only update state if component is still mounted
        if (isMounted) {
          setSlots(data.slots || []);
          setError(null);
        }
      } catch (error) {
        console.error('Error loading slots:', error);
        if (isMounted) {
          setError('Failed to load placement options. Please try again.');
          setSlots([]);
        }
      }
    };

    if (isOpen && authenticated) {
      loadSlotsIfMounted();
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [isOpen, authenticated]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('business_type');
      setSelectedBusinessType(null);
      setError(null);
      setSlots([]);
      // Reset form data
      setAdData({
        business_name: '',
        business_type: '',
        headline: '',
        description: '',
        call_to_action: '',
        contact_methods: {
          phone: '',
          email: '',
          website: '',
          address: '',
          social_media: {
            facebook: '',
            instagram: '',
            twitter: ''
          }
        },
        featured_image: '',
        gallery_images: [] as string[],
        business_specific: {
          reservation_link: '',
          reservation_platform: '',
          menu_upload: '',
          hours: {
            monday: { open: '', close: '', closed: false },
            tuesday: { open: '', close: '', closed: false },
            wednesday: { open: '', close: '', closed: false },
            thursday: { open: '', close: '', closed: false },
            friday: { open: '', close: '', closed: false },
            saturday: { open: '', close: '', closed: false },
            sunday: { open: '', close: '', closed: false }
          },
          dietary_options: [] as string[],
          delivery_options: [] as string[],
          coupons: [] as Array<{
            id: string;
            title: string;
            description: string;
            discount_text: string;
            qr_destination: string;
            expiration_date: string;
            is_active: boolean;
            download_count: number;
          }>
        } as any,
                 placement_preference: 'standard',
        weekly_budget: 5,
        auto_renew: false,
        allow_mailing_list_signup: false
      });
      
      // Reset image state
      setUploadedImages([]);
      setUploading(false);
      
      // Reset coupon form
      setNewCoupon({
        title: '',
        description: '',
        discount_text: '',
        qr_destination: '',
        expiration_date: ''
      });
    }
  }, [isOpen]);



  const handleBusinessTypeSelect = (businessType: BusinessType) => {
    if (!isMounted) return;
    setSelectedBusinessType(businessType);
    setAdData({
      ...adData,
      business_type: businessType.id
    });
    setCurrentStep('create_ad');
  };

  const handleAdDataChange = (field: string, value: any) => {
    if (!isMounted) return;
    setAdData({
      ...adData,
      [field]: value
    });
  };

  const handleNextStep = () => {
    if (!isMounted) return;
    switch (currentStep) {
      case 'business_type':
        setCurrentStep('create_ad');
        break;
      case 'create_ad':
        setCurrentStep('preview');
        break;
      case 'preview':
        setCurrentStep('placement');
        break;
      case 'placement':
        setCurrentStep('payment');
        break;
    }
  };

  const handlePreviousStep = () => {
    if (!isMounted) return;
    switch (currentStep) {
      case 'create_ad':
        // When editing, don't go back to business type selection
        if (isEditing) {
          onClose();
        } else {
          setCurrentStep('business_type');
        }
        break;
      case 'preview':
        setCurrentStep('create_ad');
        break;
      case 'placement':
        setCurrentStep('preview');
        break;
      case 'payment':
        setCurrentStep('placement');
        break;
    }
  };

  const calculateCurrentPrice = (targetPosition: number) => {
    // Market-driven pricing: $5 base + $5 for each competing advertiser
    const basePrice = 5;
    const competitorsCount = slots.filter(slot => !slot.is_available).length;
    return basePrice + (competitorsCount * 5);
  };

  // Handle saving the advertisement
  const handleSaveAdvertisement = async () => {
    if (!user) {
      setError('Please log in to save your advertisement');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format the ad data for the listings API
      const listingData = {
        type: 'advertise',
        title: `${adData.business_name}${adData.headline ? ' - ' + adData.headline : ''}`,
        basic_description: adData.headline || adData.description.substring(0, 100),
        detailed_description: adData.description,
        featured_image_url: adData.featured_image,
        image_urls: adData.gallery_images,
        is_private: false,
        status: 'active'
      };

      const url = isEditing ? `/api/listings/${editingListing!.id}` : '/api/listings';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(listingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} advertisement`);
      }

      const result = await response.json();
      console.log(`Advertisement ${isEditing ? 'updated' : 'created'}:`, result.listing);
      
      // Save the listing ID for payment processing
      setSavedListingId(result.listing.id);
      
      // Call the callback if provided (for editing)
      if (isEditing && onListingUpdated) {
        onListingUpdated(result.listing);
      }
      
      // Return the listing ID for payment processing
      return result.listing.id;
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} advertisement:`, error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Image upload functionality
  const handleImageUpload = async (files: FileList) => {
    if (!user) {
      alert('Please log in to upload images');
      return;
    }

    setUploading(true);
    const newImages = [...uploadedImages];
    
    for (let i = 0; i < files.length && newImages.length < 5; i++) {
      const file = files[i];
      
      const imageObj = {
        file,
        url: '',
        uploading: true
      };
      
      newImages.push(imageObj);
      setUploadedImages([...newImages]);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const { url, fileName } = await response.json();

        const imageIndex = newImages.findIndex(img => img.file === file);
        if (imageIndex !== -1) {
          newImages[imageIndex] = {
            ...newImages[imageIndex],
            url: url,
            fileName: fileName,
            uploading: false
          };
          setUploadedImages([...newImages]);
        }
        
      } catch (error) {
        console.error('Upload error:', error);
        const imageIndex = newImages.findIndex(img => img.file === file);
        if (imageIndex !== -1) {
          newImages[imageIndex] = {
            ...newImages[imageIndex],
            uploading: false,
            error: error instanceof Error ? error.message : 'Upload failed'
          };
          setUploadedImages([...newImages]);
        }
      }
    }
    
    setUploading(false);
    
    // Update form with image URLs
    const imageUrls = newImages
      .filter(img => img.url && !img.error)
      .map(img => img.url);
    
    setAdData({
      ...adData,
      gallery_images: imageUrls,
      featured_image: imageUrls.length > 0 ? imageUrls[0] : adData.featured_image
    });
  };

  const removeImage = async (index: number) => {
    const imageToRemove = uploadedImages[index];
    
    if (imageToRemove.url && !imageToRemove.error && imageToRemove.fileName) {
      try {
        const response = await fetch(`/api/upload?fileName=${encodeURIComponent(imageToRemove.fileName)}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          console.error('Error deleting image from server');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
    
    const newImages = [...uploadedImages];
    newImages.splice(index, 1);
    setUploadedImages(newImages);
    
    const imageUrls = newImages
      .filter(img => img.url && !img.error)
      .map(img => img.url);
    
    setAdData({
      ...adData,
      gallery_images: imageUrls,
      featured_image: imageUrls.length > 0 ? imageUrls[0] : ''
    });
  };

  const renderBusinessTypeSelector = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">What type of business are you advertising?</h3>
        <p className="text-gray-600 mb-8">We'll customize your ad creator to help you showcase your business effectively.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUSINESS_TYPES.map((businessType) => (
          <button
            key={businessType.id}
            onClick={() => handleBusinessTypeSelect(businessType)}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 text-left"
          >
            <div className="text-4xl mb-3">{businessType.icon}</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{businessType.name}</h4>
            <p className="text-sm text-gray-600">{businessType.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderBasicFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Name *
        </label>
        <input
          type="text"
          value={adData.business_name}
          onChange={(e) => handleAdDataChange('business_name', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Your business name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Headline *
        </label>
        <input
          type="text"
          value={adData.headline}
          onChange={(e) => handleAdDataChange('headline', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Grab attention with a compelling headline"
          maxLength={60}
        />
        <p className="text-sm text-gray-500 mt-1">{adData.headline.length}/60 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={adData.description}
          onChange={(e) => handleAdDataChange('description', e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="Describe your business, products, or services..."
          maxLength={300}
        />
        <p className="text-sm text-gray-500 mt-1">{adData.description.length}/300 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Images ({uploadedImages.length}/5)
          {uploading && <span className="text-orange-500 ml-2">Uploading...</span>}
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Add your business logo, food photos, storefront, or product images to make your ad stand out
        </p>
        
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            className="hidden"
            id="business-image-upload"
            disabled={uploadedImages.length >= 5 || uploading}
          />
          <label htmlFor="business-image-upload" className="cursor-pointer">
            <div className="space-y-2">
              <div className="text-4xl">🖼️</div>
              <div className="text-sm text-gray-600">
                <strong>Click to select images</strong>
                <br />
                <span className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB each (max 5 images)
                </span>
              </div>
            </div>
          </label>
        </div>

        {/* Image Preview */}
        {uploadedImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {uploadedImages.map((imageObj, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border-2 border-gray-200">
                {imageObj.url ? (
                  <img
                    src={imageObj.url}
                    alt={`Business image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    {imageObj.uploading ? (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        <span className="text-xs text-gray-500">Uploading...</span>
                      </div>
                    ) : (
                      <span className="text-red-500 text-xs">Upload Error</span>
                    )}
                  </div>
                )}
                
                {/* Featured Badge */}
                {index === 0 && imageObj.url && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Featured
                  </div>
                )}
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  disabled={imageObj.uploading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadedImages.length > 0 && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> The first image will be your featured image and appear prominently in your ad.
              {uploadedImages.length > 1 && ` Additional images create a gallery for customers to browse.`}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Call to Action
        </label>
        <select
          value={adData.call_to_action}
          onChange={(e) => handleAdDataChange('call_to_action', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">Select a call to action</option>
          <option value="Call Now">Call Now</option>
          <option value="Visit Website">Visit Website</option>
          <option value="Contact Us">Contact Us</option>
          <option value="Learn More">Learn More</option>
          <option value="Get Quote">Get Quote</option>
          <option value="Book Now">Book Now</option>
          <option value="Visit Store">Visit Store</option>
          {/* Restaurant-specific options */}
          {selectedBusinessType?.id === 'restaurant' && (
            <>
              <option value="Make Reservation">Make Reservation</option>
              <option value="Order Online">Order Online</option>
              <option value="View Menu">View Menu</option>
              <option value="Get Directions">Get Directions</option>
            </>
          )}
        </select>
      </div>
    </div>
  );

  const renderContactFields = () => (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={adData.contact_methods.phone}
            onChange={(e) => handleAdDataChange('contact_methods', { ...adData.contact_methods, phone: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={adData.contact_methods.email}
            onChange={(e) => handleAdDataChange('contact_methods', { ...adData.contact_methods, email: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="business@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            value={adData.contact_methods.website}
            onChange={(e) => handleAdDataChange('contact_methods', { ...adData.contact_methods, website: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="https://yourbusiness.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <input
            type="text"
            value={adData.contact_methods.address}
            onChange={(e) => handleAdDataChange('contact_methods', { ...adData.contact_methods, address: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="123 Main St, Hillsmere Shores, MD"
          />
        </div>
      </div>

      <div className="mt-6">
        <h5 className="text-md font-medium text-gray-900 mb-3">Social Media (Optional)</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facebook
            </label>
            <input
              type="url"
              value={adData.contact_methods.social_media.facebook}
              onChange={(e) => handleAdDataChange('contact_methods', { 
                ...adData.contact_methods, 
                social_media: { ...adData.contact_methods.social_media, facebook: e.target.value }
              })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="facebook.com/yourbusiness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram
            </label>
            <input
              type="url"
              value={adData.contact_methods.social_media.instagram}
              onChange={(e) => handleAdDataChange('contact_methods', { 
                ...adData.contact_methods, 
                social_media: { ...adData.contact_methods.social_media, instagram: e.target.value }
              })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="instagram.com/yourbusiness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter
            </label>
            <input
              type="url"
              value={adData.contact_methods.social_media.twitter}
              onChange={(e) => handleAdDataChange('contact_methods', { 
                ...adData.contact_methods, 
                social_media: { ...adData.contact_methods.social_media, twitter: e.target.value }
              })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="twitter.com/yourbusiness"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRestaurantSpecificFields = () => (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Features</h4>
      
      {/* Reservation System */}
      {(adData.call_to_action === 'Make Reservation') && (
        <div className="p-4 bg-orange-50 rounded-lg">
          <h5 className="text-md font-medium text-gray-900 mb-3">Reservation System</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation Platform
              </label>
              <select
                value={adData.business_specific.reservation_platform}
                onChange={(e) => handleAdDataChange('business_specific', { 
                  ...adData.business_specific, 
                  reservation_platform: e.target.value 
                })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select platform</option>
                <option value="resy">Resy</option>
                <option value="opentable">OpenTable</option>
                <option value="tock">Tock</option>
                <option value="yelp">Yelp Reservations</option>
                <option value="custom">Custom/Website</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation Link
              </label>
              <input
                type="url"
                value={adData.business_specific.reservation_link}
                onChange={(e) => handleAdDataChange('business_specific', { 
                  ...adData.business_specific, 
                  reservation_link: e.target.value 
                })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="https://resy.com/cities/your-restaurant"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hours of Operation */}
      <div>
        <h5 className="text-md font-medium text-gray-900 mb-3">Hours of Operation</h5>
        <div className="space-y-3">
          {Object.entries(adData.business_specific.hours).map(([day, hours]) => {
            const dayHours = hours as { open: string; close: string; closed: boolean };
            return (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-20 text-sm font-medium text-gray-700 capitalize">
                {day}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={dayHours.closed}
                  onChange={(e) => handleAdDataChange('business_specific', {
                    ...adData.business_specific,
                    hours: {
                      ...adData.business_specific.hours,
                      [day]: { ...dayHours, closed: e.target.checked }
                    }
                  })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">Closed</label>
              </div>
              {!dayHours.closed && (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={dayHours.open}
                    onChange={(e) => handleAdDataChange('business_specific', {
                      ...adData.business_specific,
                      hours: {
                        ...adData.business_specific.hours,
                        [day]: { ...dayHours, open: e.target.value }
                      }
                    })}
                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={dayHours.close}
                    onChange={(e) => handleAdDataChange('business_specific', {
                      ...adData.business_specific,
                      hours: {
                        ...adData.business_specific.hours,
                        [day]: { ...dayHours, close: e.target.value }
                      }
                    })}
                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Dietary Options */}
      <div>
        <h5 className="text-md font-medium text-gray-900 mb-3">Dietary Options</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Halal', 'Kosher', 'Organic'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={adData.business_specific.dietary_options.includes(option)}
                onChange={(e) => {
                  const currentOptions = adData.business_specific.dietary_options;
                  const newOptions = e.target.checked
                    ? [...currentOptions, option]
                    : currentOptions.filter((opt: string) => opt !== option);
                  handleAdDataChange('business_specific', {
                    ...adData.business_specific,
                    dietary_options: newOptions
                  });
                }}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Delivery Options */}
      <div>
        <h5 className="text-md font-medium text-gray-900 mb-3">Delivery & Takeout</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Dine-In', 'Takeout', 'Delivery', 'Curbside', 'DoorDash', 'Uber Eats', 'Grubhub'].map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="checkbox"
                checked={adData.business_specific.delivery_options.includes(option)}
                onChange={(e) => {
                  const currentOptions = adData.business_specific.delivery_options;
                  const newOptions = e.target.checked
                    ? [...currentOptions, option]
                    : currentOptions.filter((opt: string) => opt !== option);
                  handleAdDataChange('business_specific', {
                    ...adData.business_specific,
                    delivery_options: newOptions
                  });
                }}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCouponCreator = () => {
    const addCoupon = () => {
      if (!isMounted) return;
      if (!newCoupon.title || !newCoupon.description || !newCoupon.discount_text) {
        alert('Please fill in all coupon fields');
        return;
      }

      const coupon = {
        id: Date.now().toString(),
        ...newCoupon,
        qr_destination: newCoupon.qr_destination || (typeof window !== 'undefined' ? window.location.href : ''), // Default to current listing
        is_active: true,
        download_count: 0
      };

      handleAdDataChange('business_specific', {
        ...adData.business_specific,
        coupons: [...adData.business_specific.coupons, coupon]
      });

      setNewCoupon({
        title: '',
        description: '',
        discount_text: '',
        qr_destination: '',
        expiration_date: ''
      });
    };

    const removeCoupon = (couponId: string) => {
      if (!isMounted) return;
      handleAdDataChange('business_specific', {
        ...adData.business_specific,
        coupons: adData.business_specific.coupons.filter((c: any) => c.id !== couponId)
      });
    };

    return (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">QR Code Coupons</h4>
        <p className="text-sm text-gray-600 mb-4">
          Create digital coupons with QR codes. Customers can scan or click to redeem. You'll receive an email notification when someone downloads your coupon.
        </p>

        {/* Existing Coupons */}
        {adData.business_specific.coupons.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-md font-medium text-gray-900">Your Coupons</h5>
            {adData.business_specific.coupons.map((coupon: any) => (
              <div key={coupon.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h6 className="font-medium text-gray-900">{coupon.title}</h6>
                    <p className="text-sm text-gray-600">{coupon.description}</p>
                    <p className="text-sm font-medium text-green-600">{coupon.discount_text}</p>
                    <p className="text-xs text-gray-500">
                      QR leads to: {coupon.qr_destination || 'Your listing'}
                    </p>
                    {coupon.expiration_date && (
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(coupon.expiration_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeCoupon(coupon.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Coupon */}
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <h5 className="text-md font-medium text-gray-900 mb-3">Create New Coupon</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coupon Title *
                </label>
                <input
                  type="text"
                  value={newCoupon.title}
                  onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Welcome Special"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Text *
                </label>
                <input
                  type="text"
                  value={newCoupon.discount_text}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_text: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., 20% Off First Order"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={newCoupon.description}
                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Coupon terms and conditions..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QR Code Destination (Optional)
                </label>
                <input
                  type="url"
                  value={newCoupon.qr_destination}
                  onChange={(e) => setNewCoupon({ ...newCoupon, qr_destination: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="https://your-menu.com (defaults to listing)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  value={newCoupon.expiration_date}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expiration_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <button
              onClick={addCoupon}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium"
            >
              Add Coupon
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handlePayment = async (weeklyAmount: number, isCompetitive: boolean) => {
    let listingId = savedListingId;
    
    console.log('🔍 Starting payment process. Saved listing ID:', listingId);
    
    if (!listingId) {
      console.log('📝 No saved listing ID, creating listing first...');
      // Save listing first if not already saved
      const result = await handleSaveAdvertisement();
      if (!result) {
        console.error('❌ Failed to create listing');
        alert('Failed to create listing. Please try again.');
        return;
      }
      listingId = result;
      console.log('✅ Listing created with ID:', listingId);
    }

    try {
      setLoading(true);

      console.log('💳 Creating checkout session with data:', {
        listing_id: listingId,
        weekly_amount: weeklyAmount,
        payment_type: paymentType,
        auto_renew: paymentType === 'subscription'
      });

      // Create checkout session
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          weekly_amount: weeklyAmount,
          payment_type: paymentType,
          auto_renew: paymentType === 'subscription'
        })
      });

      const checkoutData = await checkoutResponse.json();
      console.log('💳 Checkout response:', checkoutData);

      if (checkoutResponse.ok && checkoutData.success) {
        console.log('✅ Redirecting to Stripe checkout');
        // Redirect to Stripe checkout
        window.location.href = checkoutData.checkout_url;
      } else {
        console.error('❌ Payment setup failed:', checkoutData.error);
        alert(`Payment setup failed: ${checkoutData.error}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPlacementSelector = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Ad Placement & Payment</h3>
        <p className="text-gray-600 mb-6">
          Select your placement option and payment preference
        </p>
      </div>

      {loadingMarket ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading pricing options...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Placement Options */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Standard Placement */}
            <div 
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlacement === 'standard' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlacement('standard')}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">📍 Standard Placement</h4>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPlacement === 'standard' 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}></div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">$5<span className="text-sm text-gray-500">/week</span></div>
              <p className="text-sm text-gray-600 mb-4">Regular grid position with all standard features</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Business profile with images</li>
                <li>• Contact methods display</li>
                <li>• Standard visibility</li>
                <li>• All creation tools included</li>
              </ul>
            </div>

            {/* Competitive Placement */}
            <div 
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlacement === 'competitive' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlacement('competitive')}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">🏆 Premium Positioning</h4>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPlacement === 'competitive' 
                    ? 'bg-orange-500 border-orange-500' 
                    : 'border-gray-300'
                }`}></div>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                ${marketState?.price_to_beat || 5}
                <span className="text-sm text-gray-500">/week</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {(marketState?.current_top_bid || 0) > 0 
                  ? `Beat current top bid ($${marketState?.current_top_bid || 0}/week)`
                  : 'Be the first to claim premium position'
                }
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Everything in Standard</li>
                <li>• Top-row placement priority</li>
                <li>• Higher visibility</li>
                <li>• Competitive advantage</li>
              </ul>
              {(marketState?.total_active_bids || 0) > 0 && (
                <div className="mt-3 text-sm text-orange-700 font-medium">
                  🔥 Competing against {marketState?.total_active_bids || 0} other business{(marketState?.total_active_bids || 0) > 1 ? 'es' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Payment Type Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">💳 Payment Preference</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentType === 'one_time' 
                    ? 'border-blue-500 bg-white' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentType('one_time')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">One Week Only</h5>
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    paymentType === 'one_time' 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'
                  }`}></div>
                </div>
                <p className="text-sm text-gray-600">Pay once, ad runs for 1 week</p>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentType === 'subscription' 
                    ? 'border-blue-500 bg-white' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentType('subscription')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Auto-Renew Weekly</h5>
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    paymentType === 'subscription' 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'
                  }`}></div>
                </div>
                <p className="text-sm text-gray-600">Automatically renew each week</p>
                <p className="text-xs text-gray-500 mt-1">Cancel anytime</p>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📋 Summary</h4>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                {selectedPlacement === 'standard' ? 'Standard Placement' : 'Premium Positioning'}
              </span>
              <span className="font-bold text-gray-900">
                ${selectedPlacement === 'standard' ? 5 : (marketState?.price_to_beat || 5)}/week
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                {paymentType === 'one_time' ? 'One-time payment' : 'Auto-renew weekly'}
              </span>
              <span>
                {paymentType === 'subscription' ? 'Cancel anytime' : '1 week duration'}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const weeklyAmount = selectedPlacement === 'standard' ? 5 : (marketState?.price_to_beat || 5);
                const isCompetitive = selectedPlacement === 'competitive';
                handlePayment(weeklyAmount, isCompetitive);
              }}
              disabled={loading}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium text-center"
            >
              {loading ? 'Processing...' : '🚀 Publish Ad'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">💡 How It Works</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Your ad activates immediately after payment</li>
          <li>• Premium positioning means higher visibility and more clicks</li>
          <li>• Auto-renew subscriptions can be cancelled anytime</li>
          <li>• All payments are secure via Stripe</li>
          <li>• {selectedPlacement === 'competitive' ? 'Competitive positions update weekly based on bids' : 'Standard placement gives you all the essential features'}</li>
        </ul>
      </div>
    </div>
  );

  const renderAdPreview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Preview Your Advertisement</h3>
        <p className="text-gray-600 mb-6">This is exactly how your ad will appear to customers</p>
      </div>

      {/* Preview Container */}
      <div className="max-w-2xl mx-auto">
        {/* Business Ad Preview */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-6 shadow-lg">
          {/* Business Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Ad
                </span>
                <span className="text-sm text-gray-500">
                  {selectedBusinessType?.name || 'Business Advertisement'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {adData.business_name || 'Your Business Name'}
              </h2>
              <h3 className="text-lg font-semibold text-orange-600 mb-3">
                {adData.headline || 'Your compelling headline will appear here'}
              </h3>
            </div>
            
            {/* Featured Image */}
            {adData.featured_image && (
              <div className="ml-6 flex-shrink-0">
                <img
                  src={adData.featured_image}
                  alt="Business Logo/Featured Image"
                  className="w-20 h-20 object-cover rounded-lg border-2 border-orange-200"
                />
              </div>
            )}
          </div>

          {/* Image Gallery */}
          {adData.gallery_images.length > 1 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                🖼️ Business Gallery
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {adData.gallery_images.slice(1).map((imageUrl: string, index: number) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`Business image ${index + 2}`}
                    className="w-full h-20 object-cover rounded-lg border border-orange-100 hover:border-orange-300 transition-colors cursor-pointer"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed">
              {adData.description || 'Your business description will be displayed here to attract customers and explain your services or products.'}
            </p>
          </div>

          {/* Restaurant Features */}
          {selectedBusinessType?.id === 'restaurant' && (
            <div className="space-y-3 mb-4">
              {/* Hours */}
              {Object.values(adData.business_specific.hours).some((h: any) => h.open && !h.closed) && (
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    🕐 Hours of Operation
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(adData.business_specific.hours).map(([day, hours]) => {
                      const dayHours = hours as { open: string; close: string; closed: boolean };
                      return (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize font-medium">{day}:</span>
                          <span className="text-gray-600">
                            {dayHours.closed ? 'Closed' : 
                             dayHours.open && dayHours.close ? `${dayHours.open} - ${dayHours.close}` : 'Hours not set'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dietary Options */}
              {adData.business_specific.dietary_options.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    🥗 Dietary Options
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {adData.business_specific.dietary_options.map((option: string) => (
                      <span key={option} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Options */}
              {adData.business_specific.delivery_options.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-orange-100">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    🚚 Service Options
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {adData.business_specific.delivery_options.map((option: string) => (
                      <span key={option} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QR Coupons */}
          {adData.business_specific.coupons.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                🎟️ Special Offers
              </h4>
              <div className="grid gap-3">
                {adData.business_specific.coupons.map((coupon: any) => (
                  <div key={coupon.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-green-800">{coupon.title}</h5>
                        <p className="text-sm text-green-700 mb-1">{coupon.description}</p>
                        <p className="text-lg font-bold text-green-600">{coupon.discount_text}</p>
                        {coupon.expiration_date && (
                          <p className="text-xs text-green-600">
                            Expires: {new Date(coupon.expiration_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="w-16 h-16 bg-white border-2 border-green-300 rounded-lg flex items-center justify-center">
                          <div className="text-xs text-center text-green-600">
                            📱<br/>QR<br/>Code
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="border-t border-orange-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  {adData.contact_methods.phone && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📞</span>
                      {adData.contact_methods.phone}
                    </div>
                  )}
                  {adData.contact_methods.email && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">✉️</span>
                      {adData.contact_methods.email}
                    </div>
                  )}
                  {adData.contact_methods.address && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📍</span>
                      {adData.contact_methods.address}
                    </div>
                  )}
                  {adData.contact_methods.website && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">🌐</span>
                      {adData.contact_methods.website}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                {adData.call_to_action && (
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    {adData.call_to_action}
                  </button>
                )}
                
                {/* Reservation Button for Restaurants */}
                {selectedBusinessType?.id === 'restaurant' && adData.business_specific.reservation_link && (
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Make Reservation
                  </button>
                )}

                {/* Mailing List Button */}
                {adData.allow_mailing_list_signup && (
                  <button className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Join Mailing List
                  </button>
                )}
                
                <button className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors">
                  Contact Business
                </button>
              </div>
            </div>

            {/* Social Media */}
            {(adData.contact_methods.social_media.facebook || 
              adData.contact_methods.social_media.instagram || 
              adData.contact_methods.social_media.twitter) && (
              <div className="mt-3 pt-3 border-t border-orange-100">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Follow Us</h5>
                <div className="flex space-x-3">
                  {adData.contact_methods.social_media.facebook && (
                    <span className="text-blue-600">📘 Facebook</span>
                  )}
                  {adData.contact_methods.social_media.instagram && (
                    <span className="text-pink-600">📷 Instagram</span>
                  )}
                  {adData.contact_methods.social_media.twitter && (
                    <span className="text-blue-400">🐦 Twitter</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Notes */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📋 Preview Notes</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your ad will appear with the orange "Ad" badge for visibility</li>
            {adData.featured_image && <li>• Featured image appears as business logo/header image</li>}
            {adData.gallery_images.length > 1 && <li>• Additional images create a clickable gallery for customers</li>}
            <li>• QR codes will be fully functional when published</li>
            <li>• Contact buttons will link to your actual contact methods</li>
            <li>• Ad placement affects visibility - higher positions get more views</li>
            {selectedBusinessType?.id === 'restaurant' && (
              <li>• Reservation button will link to your {adData.business_specific.reservation_platform || 'booking system'}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderMailingListOption = () => (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="allow_mailing_list"
          checked={adData.allow_mailing_list_signup}
          onChange={(e) => handleAdDataChange('allow_mailing_list_signup', e.target.checked)}
          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
        />
        <label htmlFor="allow_mailing_list" className="ml-3 block text-sm text-gray-900">
          <strong>Allow customers to join your mailing list</strong>
        </label>
      </div>
      <p className="text-sm text-gray-600 mt-2 ml-7">
        When customers click "Join Mailing List" on your ad, we'll send you their contact information via email.
      </p>
    </div>
  );

  const renderAdCreator = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditing ? 'Edit Your Advertisement' : 'Create Your Advertisement'}
        </h3>
        <p className="text-gray-600 mb-2">
          {isEditing ? 'Editing' : 'Creating'} ad for: <span className="font-semibold text-orange-600">{selectedBusinessType?.name}</span>
        </p>
        {!isEditing && (
          <button
            onClick={() => setCurrentStep('business_type')}
            className="text-sm text-orange-600 hover:text-orange-800"
          >
            Change business type
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
          {renderBasicFields()}
        </div>

        <div>
          {renderContactFields()}
        </div>
      </div>

      {/* Restaurant-Specific Features */}
      {selectedBusinessType?.id === 'restaurant' && (
        <div className="mt-8">
          {renderRestaurantSpecificFields()}
        </div>
      )}

      {/* QR Code Coupons - Available for all business types */}
      <div className="mt-8">
        {renderCouponCreator()}
      </div>

      {renderMailingListOption()}
    </div>
  );

  const renderStepIndicator = () => {
    const steps = [
      { id: 'business_type', name: 'Business Type', icon: '🏪' },
      { id: 'create_ad', name: 'Create Ad', icon: '✏️' },
      { id: 'preview', name: 'Preview', icon: '👀' },
      { id: 'placement', name: 'Placement', icon: '🎯' },
      { id: 'payment', name: 'Payment', icon: '💳' }
    ];

    const currentStepIndex = steps.findIndex(step => step.id === currentStep);

    return (
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                index <= currentStepIndex
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step.icon}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index <= currentStepIndex ? 'text-orange-600' : 'text-gray-400'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-4 ${
                  index < currentStepIndex ? 'bg-orange-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!authenticated) {
    return null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEditing ? "Edit Your Business Advertisement" : "Create Your Business Advertisement"}
      className="max-w-6xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6">
        {renderStepIndicator()}

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

        {/* Step Content */}
        {currentStep === 'business_type' && renderBusinessTypeSelector()}
        {currentStep === 'create_ad' && renderAdCreator()}
        {currentStep === 'preview' && renderAdPreview()}
        {currentStep === 'placement' && renderPlacementSelector()}

        {currentStep === 'payment' && (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium">Payment processing coming soon...</h3>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={currentStep === 'business_type' ? onClose : handlePreviousStep}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            {currentStep === 'business_type' || (currentStep === 'create_ad' && isEditing) ? 'Cancel' : 'Previous'}
          </button>

          {currentStep === 'create_ad' && (
            <button
              onClick={handleNextStep}
              disabled={!adData.business_name || !adData.headline || !adData.description}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-md font-medium"
            >
              Continue to Preview
            </button>
          )}

          {currentStep === 'preview' && (
            <div className="flex space-x-3">
              {isEditing ? (
                <button
                  onClick={handleSaveAdvertisement}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              ) : (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
                >
                  Continue to Payment & Placement
                </button>
              )}
            </div>
          )}

          {currentStep === 'placement' && (
            <div className="text-center">
              <p className="text-gray-600">Payment is handled above. Choose your placement option and payment preference to continue.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
} 