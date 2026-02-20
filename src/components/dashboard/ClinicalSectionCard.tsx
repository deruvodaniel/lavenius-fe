/**
 * Clinical Section Card Component
 * Reusable card for diagnosis, treatment, and observations
 */

import { useTranslation } from 'react-i18next';

interface ClinicalSectionCardProps {
  title: string;
  content: string;
  emptyMessage: string;
  isEditing: boolean;
  onContentChange: (value: string) => void;
}

export function ClinicalSectionCard({
  title,
  content,
  emptyMessage,
  isEditing,
  onContentChange,
}: ClinicalSectionCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-gray-900 mb-4">{title}</h3>
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
        />
      ) : (
        <p className="text-gray-700 leading-relaxed">
          {content || emptyMessage}
        </p>
      )}
    </div>
  );
}
