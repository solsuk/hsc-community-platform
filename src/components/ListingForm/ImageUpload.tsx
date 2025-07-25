import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';

interface ImageUploadProps {
  onNext: () => void;
  onBack: () => void;
}

interface UploadedImage {
  file: File;
  url: string;
  fileName?: string;
  uploading: boolean;
  error?: string;
}

export default function ImageUpload({ onNext, onBack }: ImageUploadProps) {
  const { setValue, watch } = useFormContext();
  const { user } = useAuth();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList) => {
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

        // Update the image object
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
    setValue('images', imageUrls);
    
    // Set featured image if it's the first image
    if (imageUrls.length > 0 && !watch('featured_image_url')) {
      setValue('featured_image_url', imageUrls[0]);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = uploadedImages[index];
    
    // If image was uploaded to server, delete it
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
    
    // Update form values
    const imageUrls = newImages
      .filter(img => img.url && !img.error)
      .map(img => img.url);
    setValue('images', imageUrls);
    
    // Update featured image if needed
    if (imageUrls.length > 0) {
      setValue('featured_image_url', imageUrls[0]);
    } else {
      setValue('featured_image_url', '');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Images ({uploadedImages.length}/5)
          {uploading && <span className="text-blue-500 ml-2">Uploading...</span>}
        </label>
        <div className="mt-1">
          <div className="border-2 border-dashed rounded-[25px_25px_25px_5px] p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="image-upload-input"
              disabled={uploadedImages.length >= 5}
            />
            <label htmlFor="image-upload-input" className="cursor-pointer">
              <div className="space-y-1">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-gray-600">
                  <p>
                    Click to select images
                    <br />
                    <span className="text-xs text-gray-500">
                      (Max 5 images, 5MB each)
                    </span>
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Image preview */}
        {uploadedImages.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {uploadedImages.map((imageObj: UploadedImage, index: number) => (
              <div
                key={`${imageObj.file.name}-${index}`}
                className="relative rounded-[25px_25px_25px_5px] overflow-hidden group"
              >
                {/* Image or placeholder */}
                {imageObj.url ? (
                  <img
                    src={imageObj.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(imageObj.file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover opacity-50"
                    />
                  </div>
                )}
                
                {/* Upload status overlay */}
                {imageObj.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-xs">
                      <svg className="animate-spin h-5 w-5 mx-auto mb-1" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Uploading...
                    </div>
                  </div>
                )}
                
                {/* Error overlay */}
                {imageObj.error && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
                    <div className="text-white text-xs text-center p-2">
                      <svg className="h-5 w-5 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Upload failed
                    </div>
                  </div>
                )}

                {/* Featured image indicator */}
                {index === 0 && imageObj.url && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Featured
                  </div>
                )}
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={imageObj.uploading}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-[25px_25px_25px_5px] hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-[25px_25px_25px_5px] hover:bg-green-600"
        >
          Continue
        </button>
      </div>
    </div>
  );
} 