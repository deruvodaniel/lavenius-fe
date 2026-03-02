import { useState, useEffect } from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider, type ClerkProviderProps } from '@clerk/clerk-react';
import { esES, enUS, ptBR } from '@clerk/localizations';
import type { LocalizationResource } from '@clerk/types';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ClerkTokenProvider } from './lib/api/ClerkTokenProvider';

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

type LocalizedClerkProviderProps = Pick<ClerkProviderProps, 'children'>;

function LocalizedClerkProvider({ children }: LocalizedClerkProviderProps) {
  const [locale, setLocale] = useState<LocalizationResource>(
    () => CLERK_LOCALES[i18n.language] ?? esES
  );

  useEffect(() => {
    const onChange = (lang: string) => setLocale(CLERK_LOCALES[lang] ?? esES);
    i18n.on('languageChanged', onChange);
    return () => { i18n.off('languageChanged', onChange); };
  }, []);

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/" localization={locale}>
      {children}
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="lavenius-theme">
    <ErrorBoundary>
      <LocalizedClerkProvider>
        <ClerkTokenProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
        </ClerkTokenProvider>
      </LocalizedClerkProvider>
    </ErrorBoundary>
  </ThemeProvider>
);
  