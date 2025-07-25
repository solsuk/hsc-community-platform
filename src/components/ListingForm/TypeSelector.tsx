import { useFormContext } from 'react-hook-form';
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  display_name: string;
  applies_to: string[];
  sort_order: number;
}

interface TypeSelectorProps {
  onNext: () => void;
}

const types = [
  { id: 'sell', label: 'For Sale', color: 'var(--tile-sell)' },
  { id: 'trade', label: 'Trade', color: 'var(--tile-trade)' },
  { id: 'announce', label: 'Announce', color: 'var(--tile-announce)' },
  { id: 'wanted', label: 'Wanted', color: '#8B5CF6' },
] as const;

export default function TypeSelector({ onNext }: TypeSelectorProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const selectedType = watch('type');
  const selectedCategory = watch('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories when type changes to sell, trade, or wanted
  useEffect(() => {
    if (selectedType === 'sell' || selectedType === 'trade' || selectedType === 'wanted') {
      // Use 'sell' categories for 'wanted' listings since people can want the same items others sell
      const typeForCategories = selectedType === 'wanted' ? 'sell' : selectedType;
      fetchCategories(typeForCategories);
    } else {
      setCategories([]);
      setValue('category', undefined);
    }
  }, [selectedType, setValue]);

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

  const requiresCategory = selectedType === 'sell' || selectedType === 'trade' || selectedType === 'wanted';
  const canProceed = selectedType && (!requiresCategory || selectedCategory);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            className={`p-6 rounded-[25px_25px_25px_5px] transition-all duration-200 flex flex-col items-center justify-center space-y-2 ${
              selectedType === type.id
                ? 'ring-2 ring-offset-2 transform scale-[1.02]'
                : 'hover:transform hover:scale-[1.01]'
            }`}
            style={{
              backgroundColor: selectedType === type.id ? type.color : '#EAE8E4',
              color: selectedType === type.id ? 'white' : 'black',
            }}
            onClick={() => {
              setValue('type', type.id);
            }}
          >
            <span className="text-lg font-semibold">{type.label}</span>
            <span className="text-sm opacity-80">
              {type.id === 'sell' && 'List items for sale'}
              {type.id === 'trade' && 'Exchange items with others'}
              {type.id === 'announce' && 'Share community updates'}
              {type.id === 'wanted' && 'Looking for items, services, or help'}
            </span>
          </button>
        ))}
      </div>

      {/* Category Selection for Sell/Trade */}
      {requiresCategory && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Select Category</h3>
          
          {loadingCategories ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              <span className="ml-2 text-gray-600">Loading categories...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  className={`p-3 rounded-[15px_15px_15px_3px] border-2 transition-all duration-200 text-sm ${
                    selectedCategory === category.name
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setValue('category', category.name)}
                >
                  {category.display_name}
                </button>
              ))}
            </div>
          )}

          {requiresCategory && !selectedCategory && (
            <p className="text-sm text-red-600">Please select a category to continue</p>
          )}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`px-4 py-2 rounded-[25px_25px_25px_5px] text-white font-medium transition-all duration-200 ${
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