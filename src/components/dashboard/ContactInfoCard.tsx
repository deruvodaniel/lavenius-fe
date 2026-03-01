/**
 * Contact Info Card Component
 * Displays and allows editing of patient contact information
 */

import { useTranslation } from 'react-i18next';
import { FileText, Edit2, Phone, Mail, Calendar, Save, X, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ContactInfoCardProps {
  telefono: string;
  email: string;
  ultimaConsulta?: string;
  isEditing: boolean;
  onTelefonoChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSendWhatsApp: () => void;
  formatFecha: (fecha: string) => string;
}

export function ContactInfoCard({
  telefono,
  email,
  ultimaConsulta,
  isEditing,
  onTelefonoChange,
  onEmailChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSendWhatsApp,
  formatFecha,
}: ContactInfoCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          {t('clinicalFile.sections.contactInfo')}
        </h3>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="p-1 hover:bg-muted rounded transition-colors"
            title={t('clinicalFile.actions.editInfo')}
            aria-label={t('clinicalFile.actions.editInfo')}
          >
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="space-y-4">
        {/* Phone */}
        <div>
          <label className="text-muted-foreground text-sm block mb-1">{t('clinicalFile.fields.phone')}</label>
          {isEditing ? (
            <Input
              type="text"
              value={telefono}
              onChange={(e) => onTelefonoChange(e.target.value)}
              className="w-full"
            />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{telefono || t('clinicalFile.notRegistered')}</span>
              </div>
              {telefono && (
                <button
                  onClick={onSendWhatsApp}
                  className="p-1.5 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title={t('clinicalFile.actions.sendWhatsApp')}
                  aria-label={t('clinicalFile.actions.sendWhatsApp')}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="text-muted-foreground text-sm block mb-1">{t('clinicalFile.fields.email')}</label>
          {isEditing ? (
            <Input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full"
            />
          ) : (
            <div className="flex items-center gap-2 text-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{email || t('clinicalFile.notRegistered')}</span>
            </div>
          )}
        </div>

        {/* Last Appointment */}
        {ultimaConsulta && !isEditing && (
          <div>
            <label className="text-muted-foreground text-sm block mb-1">{t('clinicalFile.fields.lastAppointment')}</label>
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formatFecha(ultimaConsulta)}</span>
            </div>
          </div>
        )}
      </div>
      
      {isEditing && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={onSaveEdit}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{t('common.save')}</span>
          </button>
          <button
            onClick={onCancelEdit}
            className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground py-2 rounded hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{t('common.cancel')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
