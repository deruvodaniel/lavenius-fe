import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Mail, Phone, Globe, MapPin, Instagram, Linkedin, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/useAuth';
import { getNameInitials } from '@/lib/utils/nameInitials';

// ============================================================================
// PROFILE DATA (reuses same localStorage key as Perfil)
// ============================================================================

const PROFILE_KEY = 'lavenius_profile';

interface ProfileData {
  avatarUrl?: string;
  licenseNumber?: string;
  specialty?: string;
  bio?: string;
  phone?: string;
  alternativePhone?: string;
  officeAddress?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    linkedin?: string;
  };
}

const loadProfile = (): ProfileData => {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {};
};

// ============================================================================
// PUBLIC PROFILE COMPONENT
// ============================================================================

export function PublicProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = loadProfile();

  const fullName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : '';
  const initials = user
    ? getNameInitials(`${user.firstName} ${user.lastName || ''}`, 'U')
    : 'U';
  const avatarUrl = profile.avatarUrl || user?.imageUrl;

  const hasSocial = profile.socialMedia?.instagram || profile.socialMedia?.linkedin;
  const hasContact = profile.phone || user?.email || profile.website || profile.officeAddress;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Preview Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{t('profile.share.previewDescription')}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/configuracion?tab=profile')}
            className="flex-shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('profile.share.backToSettings')}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-6 pt-8 pb-16" />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">{initials}</span>
                  </div>
                )}
              </div>

              {/* Name & Specialty */}
              <div className="text-center sm:text-left flex-1 min-w-0 pb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{fullName || 'Terapeuta'}</h1>
                {profile.specialty ? (
                  <p className="text-indigo-600 font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <Award className="w-4 h-4" />
                    {profile.specialty}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm mt-1">{t('profile.share.noSpecialty')}</p>
                )}
                {profile.licenseNumber && (
                  <p className="text-gray-500 text-xs mt-1">
                    {t('profile.professional.licenseNumber')}: {profile.licenseNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Bio */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('profile.professional.bio')}
          </h2>
          {profile.bio ? (
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
          ) : (
            <p className="text-gray-400 italic">{t('profile.share.noBio')}</p>
          )}
        </Card>

        {/* Contact Info */}
        {hasContact && (
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t('profile.share.contactInfo')}
            </h2>
            <div className="space-y-3">
              {user?.email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm">{user.email}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm">{profile.phone}</span>
                </div>
              )}
              {profile.officeAddress && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm">{profile.officeAddress}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-indigo-600" />
                  </div>
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Social Media */}
        {hasSocial && (
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t('profile.social.title')}
            </h2>
            <div className="flex gap-3">
              {profile.socialMedia?.instagram && (
                <a
                  href={`https://instagram.com/${profile.socialMedia.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-200 rounded-lg text-sm text-pink-700 hover:from-purple-100 hover:to-pink-100 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  {profile.socialMedia.instagram}
                </a>
              )}
              {profile.socialMedia?.linkedin && (
                <a
                  href={profile.socialMedia.linkedin.startsWith('http') ? profile.socialMedia.linkedin : `https://${profile.socialMedia.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
            </div>
          </Card>
        )}

        {/* Book Session CTA */}
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-gray-900">{t('profile.share.bookSession')}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{t('profile.share.bookSessionDescription')}</p>
            </div>
            <Button disabled className="w-full sm:w-auto">
              {t('profile.share.bookSession')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
