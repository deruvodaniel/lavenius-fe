/**
 * Clinical Section Card Component
 * Reusable card for diagnosis, treatment, and observations
 */

import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';

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
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-foreground mb-4">{title}</h3>
      {isEditing ? (
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full min-h-[80px]"
        />
      ) : (
        <p className="text-muted-foreground leading-relaxed">
          {content || emptyMessage}
        </p>
      )}
    </div>
  );
}
