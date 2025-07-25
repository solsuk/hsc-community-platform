import { useFormContext } from 'react-hook-form';

interface ReviewSubmitProps {
  onBack: () => void;
  isSubmitting?: boolean;
}

export default function ReviewSubmit({ onBack, isSubmitting = false }: ReviewSubmitProps) {
  const { watch, register } = useFormContext();
  const formData = watch();
  const { 
    type, 
    category,
    title, 
    price,
    basic_description, 
    detailed_description, 
    images 
  } = formData;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sell':
        return 'var(--tile-sell)';
      case 'trade':
        return 'var(--tile-trade)';
      case 'announce':
        return 'var(--tile-announce)';
              case 'wanted':
          return 'var(--tile-wanted)';
        default:
        return '#000000';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900">Review your listing</h4>
        <p className="mt-1 text-sm text-gray-500">
          Please review your listing details before submitting.
        </p>
      </div>

      <div className="border rounded-[25px_25px_25px_5px] overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-4">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getTypeColor(type) }}
            />
            <span className="text-sm font-medium capitalize">{type}</span>
            {category && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600 capitalize">
                  {category.replace('_', ' ')}
                </span>
              </>
            )}
            {price && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm font-medium text-green-600">
                  ${parseFloat(price).toFixed(2)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700">Title</h5>
            <p className="mt-1 font-medium">{title}</p>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700">Basic Description</h5>
            <p className="mt-1 text-gray-600">{basic_description}</p>
          </div>

          {detailed_description && (
            <div>
              <h5 className="text-sm font-medium text-gray-700">Detailed Description</h5>
              <div
                className="mt-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: detailed_description }}
              />
            </div>
          )}

          {images?.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700">
                Images ({images.length})
              </h5>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((file: File, index: number) => (
                  <div
                    key={index}
                    className="relative rounded-[25px_25px_25px_5px] overflow-hidden"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-[15px_15px_15px_3px] space-y-4">
        <h5 className="text-sm font-medium text-gray-700">Listing Options</h5>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-green-500 focus:ring-green-500"
              {...register('isPrivate')}
            />
            <span className="ml-2 text-sm text-gray-600">
              Make this listing private (only visible to community members)
            </span>
          </label>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="active"
                className="border-gray-300 text-green-500 focus:ring-green-500"
                {...register('status')}
                defaultChecked
              />
              <span className="ml-2 text-sm text-gray-600">
                Publish immediately
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                value="draft"
                className="border-gray-300 text-green-500 focus:ring-green-500"
                {...register('status')}
              />
              <span className="ml-2 text-sm text-gray-600">
                Save as draft
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-[25px_25px_25px_5px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-[25px_25px_25px_5px] hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            'Create Listing'
          )}
        </button>
      </div>
    </div>
  );
} 