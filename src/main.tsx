import { useState, useEffect } from 'react';
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { esES, enUS, ptBR } from '@clerk/localizations';
import type { LocalizationResource } from '@clerk/types';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ClerkTokenProvider } from './lib/api/ClerkTokenProvider';
import { E2EKeyProvider } from './lib/e2e';

// Initialize i18n - must be imported before App to ensure translations are ready
import i18n from './lib/i18n';

import "./index.css";

// Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file.");
}

const CLERK_LOCALES: Record<string, LocalizationResource> = {
  es: esES,
  en: enUS,
  pt: ptBR,
};

function RootWithClerk({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<LocalizationResource>(
    () => CLERK_LOCALES[i18n.language] ?? esES
  );

  useEffect(() => {
    const onChange = (lang: string) => setLocale(CLERK_LOCALES[lang] ?? esES);
    i18n.on('languageChanged', onChange);
    return () => { i18n.off('languageChanged', onChange); };
  }, []);

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      localization={locale}
    >
      {children}
    </ClerkProvider>
  );
}

declare global {
  interface Window {
    __laveniusRoot?: Root;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = window.__laveniusRoot ?? createRoot(rootElement);
window.__laveniusRoot = root;

root.render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="lavenius-theme">
    <ErrorBoundary>
      <RootWithClerk>
        <ClerkTokenProvider>
          <E2EKeyProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
            <Toaster position="top-right" richColors closeButton />
          </E2EKeyProvider>
        </ClerkTokenProvider>
      </RootWithClerk>
    </ErrorBoundary>
  </ThemeProvider>
);
  
