/**
 * Contact Info Card Component
 * Displays and allows editing of patient contact information
 */

import { useTranslation } from 'react-i18next';
import { FileText, Edit2, Phone, Mail, Calendar, Save, X, MessageCircle } from 'lucide-react';

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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          {t('clinicalFile.sections.contactInfo')}
        </h3>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={t('clinicalFile.actions.editInfo')}
            aria-label={t('clinicalFile.actions.editInfo')}
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
      <div className="space-y-4">
        {/* Phone */}
        <div>
          <label className="text-gray-500 text-sm block mb-1">{t('clinicalFile.fields.phone')}</label>
          {isEditing ? (
            <input
              type="text"
              value={telefono}
              onChange={(e) => onTelefonoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{telefono || t('clinicalFile.notRegistered')}</span>
              </div>
              {telefono && (
                <button
                  onClick={onSendWhatsApp}
                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
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
          <label className="text-gray-500 text-sm block mb-1">{t('clinicalFile.fields.email')}</label>
          {isEditing ? (
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="flex items-center gap-2 text-gray-900">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{email || t('clinicalFile.notRegistered')}</span>
            </div>
          )}
        </div>

        {/* Last Appointment */}
        {ultimaConsulta && !isEditing && (
          <div>
            <label className="text-gray-500 text-sm block mb-1">{t('clinicalFile.fields.lastAppointment')}</label>
            <div className="flex items-center gap-2 text-gray-900">
              <Calendar className="w-4 h-4 text-gray-400" />
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
            className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>{t('common.cancel')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
