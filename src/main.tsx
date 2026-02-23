import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ClerkTokenProvider } from './lib/api/ClerkTokenProvider';

// Initialize i18n - must be imported before App to ensure translations are ready
import './lib/i18n';

import "./index.css";

// Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file.");
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ClerkTokenProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </ClerkTokenProvider>
    </ClerkProvider>
  </ErrorBoundary>
);
  