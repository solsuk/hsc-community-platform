import { useFormContext } from 'react-hook-form';
import RichTextEditor from '../RichTextEditor';

interface DescriptionEditorProps {
  onNext: () => void;
  onBack: () => void;
}

export default function DescriptionEditor({ onNext, onBack }: DescriptionEditorProps) {
  const { setValue, watch, register, formState: { errors } } = useFormContext();
  const basicDescription = watch('basic_description');
  const detailedDescription = watch('detailed_description');
  const type = watch('type');

  const isAnnouncement = type === 'announce';
  const canProceed = isAnnouncement ? basicDescription : (basicDescription && detailedDescription);

  return (
    <div className="space-y-6">
      {/* Basic Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Basic Description *
        </label>
        <div className="mt-1">
          <textarea
            {...register('basic_description', { 
              required: 'Basic description is required',
              maxLength: { value: 150, message: 'Basic description must be 150 characters or less' }
            })}
            className="block w-full rounded-[25px_25px_25px_5px] border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            rows={3}
            placeholder="Brief summary for preview cards (max 150 characters)"
            maxLength={150}
          />
          {errors.basic_description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.basic_description.message as string}
            </p>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          This short description will appear in listing previews. Keep it concise and engaging.
        </p>
        <div className="text-right text-xs text-gray-500 mt-1">
          {basicDescription ? basicDescription.length : 0}/150 characters
        </div>
      </div>

      {/* Detailed Description - Only for non-announcements */}
      {!isAnnouncement && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Detailed Description *
          </label>
          <div className="mt-1">
            <RichTextEditor
              value={detailedDescription || ''}
              onChange={(value) => setValue('detailed_description', value)}
              placeholder="Provide detailed information about your listing. Use the toolbar to format your text, add colors, and include emojis to make your listing stand out!"
              className="min-h-[200px]"
            />
            {errors.detailed_description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.detailed_description.message as string}
              </p>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Use formatting, colors, and emojis to make your listing stand out! Include condition, dimensions, or any special details.
          </p>
        </div>
      )}

      {/* For announcements, show info */}
      {isAnnouncement && (
        <div className="bg-blue-50 p-4 rounded-[15px_15px_15px_3px]">
          <p className="text-sm text-blue-700">
            💡 <strong>Announcements</strong> use only the basic description. Keep it clear and informative for the community.
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