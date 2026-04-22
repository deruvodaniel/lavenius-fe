/**
 * One-time localStorage migration from "lavenius" to "tilia" brand keys.
 * Runs before React renders. Safe to remove ~3 months after deploy.
 */

const SENTINEL = 'tilia_migrated';

if (!localStorage.getItem(SENTINEL)) {
  const exactKeyMap: Record<string, string> = {
    'lavenius-theme': 'tilia-theme',
    'lavenius_language': 'tilia_language',
    'lavenius_onboarding': 'tilia_onboarding',
    'lavenius_settings': 'tilia_settings',
    'lavenius_sidebar_collapsed': 'tilia_sidebar_collapsed',
    'lavenius_profile': 'tilia_profile',
    'lavenius-ui': 'tilia-ui',
    'lavenius-setup-progress': 'tilia-setup-progress',
    'lavenius-dashboard-settings': 'tilia-dashboard-settings',
    'lavenius-calendar': 'tilia-calendar',
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
    'lavenius_onboarding_extra_': 'tilia_onboarding_extra_',
    'lavenius_redirected_': 'tilia_redirected_',
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
      const newKey = 'tilia_redirected_' + key.slice('lavenius_redirected_'.length);
      const value = sessionStorage.getItem(key);
      if (value != null && sessionStorage.getItem(newKey) == null) {
        sessionStorage.setItem(newKey, value);
      }
    }
  }

  localStorage.setItem(SENTINEL, '1');
}
