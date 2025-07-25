import { useFormContext } from 'react-hook-form';

interface BasicInfoProps {
  onNext: () => void;
  onBack: () => void;
}

export default function BasicInfo({ onNext, onBack }: BasicInfoProps) {
  const { register, formState: { errors }, watch } = useFormContext();
  const title = watch('title');
  const price = watch('price');
  const type = watch('type');
  const category = watch('category');

  const requiresPrice = type === 'sell';
  const showPrice = type === 'sell' || type === 'trade';
  const canProceed = title && title.length >= 3 && (!requiresPrice || price);

  return (
    <div className="space-y-6">
      {/* Show selected type and category */}
      <div className="bg-gray-50 p-4 rounded-[15px_15px_15px_3px]">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600">Type:</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
            {type}
          </span>
          {category && (
            <>
              <span className="text-sm font-medium text-gray-600">Category:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {category.replace('_', ' ')}
              </span>
            </>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="title"
            {...register('title', { 
              required: 'Title is required',
              minLength: { value: 3, message: 'Title must be at least 3 characters' },
              maxLength: { value: 255, message: 'Title must be less than 255 characters' }
            })}
            className="block w-full rounded-[25px_25px_25px_5px] border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            placeholder={
              type === 'announce' ? "What would you like to announce?" :
              type === 'wanted' ? "What are you looking for?" :
              type === 'trade' ? "What would you like to exchange?" :
              "What are you selling?"
            }
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">
              {errors.title.message as string}
            </p>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Make it clear and descriptive for potential viewers
        </p>
      </div>

      {/* Price field for sell listings */}
      {showPrice && (
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            {requiresPrice ? 'Price *' : 'Price (Optional)'}
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="price"
              step="0.01"
              min="0"
              {...register('price', { 
                ...(requiresPrice && { required: 'Price is required for sell listings' }),
                min: { value: 0, message: 'Price must be 0 or greater' },
                max: { value: 999999.99, message: 'Price must be less than $1,000,000' }
              })}
              className="block w-full pl-7 rounded-[25px_25px_25px_5px] border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="0.00"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">
                {errors.price.message as string}
              </p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {type === 'sell' ? 'Enter your asking price' : 'Optional: estimated value for trade reference'}
          </p>
        </div>
      )}

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
          disabled={!canProceed}
          className={`px-4 py-2 text-sm font-medium text-white rounded-[25px_25px_25px_5px] ${
            canProceed
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
} 