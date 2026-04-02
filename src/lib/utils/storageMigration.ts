/**
 * One-time localStorage migration from "lavenius" to "terappIA" brand keys.
 * Runs before React renders. Safe to remove ~3 months after deploy.
 */

const SENTINEL = 'terappIA_migrated';

if (!localStorage.getItem(SENTINEL)) {
  const exactKeyMap: Record<string, string> = {
    'lavenius-theme': 'terapp-ia-theme',
    'lavenius_language': 'terappIA_language',
    'lavenius_onboarding': 'terappIA_onboarding',
    'lavenius_settings': 'terappIA_settings',
    'lavenius_sidebar_collapsed': 'terappIA_sidebar_collapsed',
    'lavenius_profile': 'terappIA_profile',
    'lavenius-ui': 'terapp-ia-ui',
    'lavenius-setup-progress': 'terapp-ia-setup-progress',
    'lavenius-dashboard-settings': 'terapp-ia-dashboard-settings',
    'lavenius-calendar': 'terapp-ia-calendar',
  };

  // Migrate exact keys
  for (const [oldKey, newKey] of Object.entries(exactKeyMap)) {
    const value = localStorage.getItem(oldKey);
    if (value != null && localStorage.getItem(newKey) == null) {
      localStorage.setItem(newKey, value);
    }
  }

  // Migrate prefix-based keys (onboarding extra data, redirect flags)
  const prefixMap: Record<string, string> = {
    'lavenius_onboarding_extra_': 'terappIA_onboarding_extra_',
    'lavenius_redirected_': 'terappIA_redirected_',
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    for (const [oldPrefix, newPrefix] of Object.entries(prefixMap)) {
      if (key.startsWith(oldPrefix)) {
        const newKey = newPrefix + key.slice(oldPrefix.length);
        const value = localStorage.getItem(key);
        if (value != null && localStorage.getItem(newKey) == null) {
          localStorage.setItem(newKey, value);
        }
      }
    }
  }

  // Also check sessionStorage for redirect keys
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!key) continue;
    if (key.startsWith('lavenius_redirected_')) {
      const newKey = 'terappIA_redirected_' + key.slice('lavenius_redirected_'.length);
      const value = sessionStorage.getItem(key);
      if (value != null && sessionStorage.getItem(newKey) == null) {
        sessionStorage.setItem(newKey, value);
      }
    }
  }

  localStorage.setItem(SENTINEL, '1');
}
