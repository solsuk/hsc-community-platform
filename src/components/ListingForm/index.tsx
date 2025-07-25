import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import Modal from '../Modal';
import { useAuth } from '@/hooks/useAuth';
import RichTextEditor from '../RichTextEditor';

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

interface ListingFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'sell' | 'trade' | 'announce' | 'advertise' | 'wanted' | null;
  editingListing?: Listing | null;
  onListingUpdated?: (listing: Listing) => void;
}

interface Category {
  id: number;
  name: string;
  display_name: string;
  applies_to: string[];
  sort_order: number;
}

interface UploadedImage {
  file: File;
  url: string;
  fileName?: string;
  uploading: boolean;
  error?: string;
}

export type FormData = {
  type: 'sell' | 'trade' | 'announce' | 'wanted';
  category?: string;
  title: string;
  price?: number;
  basic_description?: string;
  detailed_description?: string;
  images: string[];
  featured_image_url?: string;
  video_urls?: string[];
  isPrivate: boolean;
  status: 'active' | 'draft' | 'sold';
};

export default function ListingForm({ isOpen, onClose, initialType, editingListing, onListingUpdated }: ListingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const methods = useForm<FormData>({
    defaultValues: {
      type: initialType || 'sell',
      isPrivate: false,
      status: 'active',
      images: [],
      video_urls: []
    }
  });

  const isEditing = Boolean(editingListing);

  const selectedType = methods.watch('type');
  const selectedCategory = methods.watch('category');

  // Fetch categories when type changes
  useEffect(() => {
    if (selectedType === 'sell' || selectedType === 'trade' || selectedType === 'wanted') {
      // Clear the previous category selection when switching types
      methods.setValue('category', undefined);
      // Use 'sell' categories for 'wanted' listings since people can want the same items others sell
      const typeForCategories = selectedType === 'wanted' ? 'sell' : selectedType;
      fetchCategories(typeForCategories);
    } else {
      setCategories([]);
      methods.setValue('category', undefined);
    }
  }, [selectedType]);

  // Set initial type when form opens or populate editing data
  useEffect(() => {
    if (isOpen && editingListing) {
      // Populate form with editing data
      methods.reset({
        type: editingListing.type,
        category: editingListing.category,
        title: editingListing.title,
        price: editingListing.price,
        basic_description: editingListing.basic_description,
        detailed_description: editingListing.detailed_description,
        images: editingListing.featured_image_url ? [editingListing.featured_image_url] : [],
        featured_image_url: editingListing.featured_image_url,
        video_urls: [],
        isPrivate: editingListing.is_private,
        status: editingListing.status === 'expired' ? 'active' : editingListing.status
      });
    } else if (isOpen && initialType) {
      // Set the initial type and clear any previous state
      methods.reset({
        type: initialType,
        isPrivate: false,
        status: 'active',
        images: [],
        video_urls: []
      });
      
      // If this type requires categories, fetch them immediately
      if (initialType === 'sell' || initialType === 'trade' || initialType === 'wanted') {
        const typeForCategories = initialType === 'wanted' ? 'sell' : initialType;
        fetchCategories(typeForCategories);
      }
    } else if (!isOpen) {
      methods.reset();
      setUploadedImages([]);
      setSubmitError(null);
      setCategories([]);
      setLoadingCategories(false);
    }
  }, [isOpen, initialType, editingListing]);

  const fetchCategories = async (type: string) => {
    setLoadingCategories(true);
    try {
      const response = await fetch(`/api/categories?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!user) {
      alert('Please log in to upload images');
      return;
    }

    setUploading(true);
    const newImages: UploadedImage[] = [...uploadedImages];
    
    for (let i = 0; i < files.length && newImages.length < 5; i++) {
      const file = files[i];
      
      const imageObj: UploadedImage = {
        file,
        url: '',
        uploading: true
      };
      
      newImages.push(imageObj);
      setUploadedImages([...newImages]);
      
      try {
        // Use our upload API endpoint
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
            fileName: fileName, // Store fileName for deletion
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
    methods.setValue('images', imageUrls);
    
    if (imageUrls.length > 0 && !methods.watch('featured_image_url')) {
      methods.setValue('featured_image_url', imageUrls[0]);
    }
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
    methods.setValue('images', imageUrls);
    
    if (imageUrls.length > 0) {
      methods.setValue('featured_image_url', imageUrls[0]);
    } else {
      methods.setValue('featured_image_url', '');
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setSubmitError('Please log in to create a listing');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const listingData = {
        type: data.type,
        category: data.category,
        title: data.title,
        price: data.price,
        basic_description: data.basic_description,
        detailed_description: data.detailed_description,
        image_urls: data.images,
        video_urls: data.video_urls || [],
        featured_image_url: data.featured_image_url,
        is_private: data.isPrivate,
        status: data.status
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
        
        // Handle specific authentication errors
        if (response.status === 401) {
          throw new Error('Please log in to create listings. Click "Join HSC" to get started.');
        }
        
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} listing`);
      }

      const result = await response.json();
      console.log(`Listing ${isEditing ? 'updated' : 'created'}:`, result.listing);
      
      // Call the callback if provided (for editing)
      if (isEditing && onListingUpdated) {
        onListingUpdated(result.listing);
      }
      
      methods.reset();
      setUploadedImages([]);
      onClose();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} listing:`, error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiresCategory = selectedType === 'sell' || selectedType === 'trade' || selectedType === 'wanted';
  const requiresPrice = selectedType === 'sell';



  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEditing ? "Edit Listing" : 
        selectedType === 'announce' ? "Create an Announcement" :
        selectedType === 'wanted' ? "Post a Wanted Ad" :
        selectedType === 'trade' ? "Create a Trade Listing" :
        "Create a For Sale Listing"
      }
      className="max-w-4xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Listing Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Listing Type</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'sell', label: 'For Sale', desc: 'List items for sale', color: 'green' },
                { id: 'trade', label: 'Trade', desc: 'Exchange items', color: 'blue' },
                { id: 'announce', label: 'Announce', desc: 'Community updates', color: 'orange' },
                { id: 'wanted', label: 'Wanted', desc: 'Looking for items/help', color: 'purple' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`p-3 rounded-[15px_15px_15px_3px] border-2 transition-all text-center ${
                    selectedType === type.id
                      ? type.color === 'purple' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : type.color === 'blue'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : type.color === 'orange'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => methods.setValue('type', type.id as any)}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs opacity-70">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          {requiresCategory && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              {loadingCategories ? (
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                  <span>Loading categories...</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      className={`p-2 rounded-[10px_10px_10px_2px] border text-sm transition-all ${
                        selectedCategory === category.name
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => methods.setValue('category', category.name)}
                    >
                      {category.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...methods.register('title', { required: 'Title is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-[15px_15px_15px_3px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={
                selectedType === 'announce' ? "What would you like to announce?" :
                selectedType === 'wanted' ? "What are you looking for?" :
                selectedType === 'trade' ? "What would you like to exchange?" :
                "What are you selling?"
              }
            />
            {methods.formState.errors.title && (
              <p className="text-sm text-red-600">{methods.formState.errors.title.message}</p>
            )}
          </div>

          {/* Price (for sell listings) */}
          {requiresPrice && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  {...methods.register('price', { 
                    required: selectedType === 'sell' ? 'Price is required' : false,
                    valueAsNumber: true 
                  })}
                  type="number"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-[15px_15px_15px_3px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {methods.formState.errors.price && (
                <p className="text-sm text-red-600">{methods.formState.errors.price.message}</p>
              )}
            </div>
          )}

          {/* Basic Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Basic Information</label>
            <textarea
              {...methods.register('basic_description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-[15px_15px_15px_3px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={2}
              maxLength={150}
              placeholder="Brief description (150 characters max)"
            />
            <div className="text-xs text-gray-500 text-right">
              {methods.watch('basic_description')?.length || 0}/150
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Details</label>
            <div className="border border-gray-300 rounded-[15px_15px_15px_3px] overflow-hidden">
              <RichTextEditor
                value={methods.watch('detailed_description') || ''}
                onChange={(value) => methods.setValue('detailed_description', value)}
                placeholder="Add detailed description with formatting..."
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Images ({uploadedImages.length}/5)
              {uploading && <span className="text-blue-500 ml-2">Uploading...</span>}
            </label>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-[15px_15px_15px_3px] p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
                disabled={uploadedImages.length >= 5}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <div className="text-4xl">📷</div>
                  <div className="text-sm text-gray-600">
                    Click to select images
                    <br />
                    <span className="text-xs text-gray-500">Max 5 images, 5MB each</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {uploadedImages.map((imageObj, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                    {imageObj.url ? (
                      <img
                        src={imageObj.url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        {imageObj.uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                        ) : (
                          <span className="text-red-500 text-xs">Error</span>
                        )}
                      </div>
                    )}
                    
                    {index === 0 && imageObj.url && (
                      <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                        Featured
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy and Status */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...methods.register('isPrivate')}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Private listing (community members only)</span>
            </label>

            <select
              {...methods.register('status')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="active">Publish now</option>
              <option value="draft">Save as draft</option>
            </select>
          </div>

          {/* Error message */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[15px_15px_15px_3px]">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Special Edit Actions - Only show when editing */}
          {isEditing && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Quick Actions:</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/listings/${editingListing!.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          ...editingListing,
                          status: 'sold'
                        }),
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        if (onListingUpdated) onListingUpdated(result.listing);
                        onClose();
                      }
                    } catch (error) {
                      console.error('Error marking as sold:', error);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-[15px_15px_15px_3px] hover:bg-green-700 transition-colors text-sm"
                >
                  ✅ Mark as Sold
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to remove this listing? This action cannot be undone.')) {
                      return;
                    }
                    
                    try {
                      const response = await fetch(`/api/listings/${editingListing!.id}`, {
                        method: 'DELETE',
                        credentials: 'include',
                      });
                      
                      if (response.ok) {
                        // Note: We can't update the listings here since this component doesn't have access to setListings
                        // The parent component will handle the UI update
                        onClose();
                        window.location.reload(); // Temporary solution to refresh the page
                      }
                    } catch (error) {
                      console.error('Error removing listing:', error);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-[15px_15px_15px_3px] hover:bg-red-700 transition-colors text-sm"
                >
                  🗑️ Remove Listing
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-[15px_15px_15px_3px] hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!selectedCategory && requiresCategory) || loadingCategories}
              className={`px-6 py-2 rounded-[15px_15px_15px_3px] text-white transition-colors ${
                isSubmitting || (!selectedCategory && requiresCategory) || loadingCategories
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              title={
                loadingCategories ? 'Loading categories...' :
                (!selectedCategory && requiresCategory) ? 'Please select a category first' :
                ''
              }
            >
              {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : 
               loadingCategories ? 'Loading...' :
               (isEditing ? 'Update Listing' : 'Create Listing')}
            </button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
} 