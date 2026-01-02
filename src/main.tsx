
  import { createRoot } from "react-dom/client";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
    <Toaster position="top-right" richColors />
  </ErrorBoundary>
);
  