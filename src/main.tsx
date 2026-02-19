import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Initialize i18n - must be imported before App to ensure translations are ready
import './lib/i18n';

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Toaster position="top-right" richColors closeButton />
  </ErrorBoundary>
);
  