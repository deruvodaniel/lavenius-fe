/**
 * WhatsApp Templates Utility
 * Loads WhatsApp message templates from localStorage settings
 */

const SETTINGS_KEY = 'lavenius_settings';

// Default templates (same as in Configuracion.tsx)
const DEFAULT_TURNO_TEMPLATE = 'Hola {nombre}! Te recuerdo que tenes un turno agendado para el *{fecha}* a las *{hora}*. Podes confirmar tu asistencia? Responde *Si* para confirmar o *No* si necesitas cancelar. Gracias!';
const DEFAULT_PAYMENT_TEMPLATE = 'Hola {nombre}! Te escribo para recordarte que tenes un pago pendiente del *{fecha}* por *{monto}*. Podes abonar por transferencia o en efectivo en tu proxima sesion. Gracias!';

interface WhatsAppTemplates {
  turnoReminder: string;
  paymentReminder: string;
}

/**
 * Load WhatsApp templates from localStorage
 */
export function getWhatsAppTemplates(): WhatsAppTemplates {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        turnoReminder: settings.whatsappTemplates?.turnoReminder || DEFAULT_TURNO_TEMPLATE,
        paymentReminder: settings.whatsappTemplates?.paymentReminder || DEFAULT_PAYMENT_TEMPLATE,
      };
    }
  } catch (error) {
    console.error('Error loading WhatsApp templates:', error);
  }
  
  return {
    turnoReminder: DEFAULT_TURNO_TEMPLATE,
    paymentReminder: DEFAULT_PAYMENT_TEMPLATE,
  };
}

/**
 * Format turno reminder message with patient data
 */
export function formatTurnoReminderMessage(
  nombre: string,
  fecha: string,
  hora: string
): string {
  const templates = getWhatsAppTemplates();
  return templates.turnoReminder
    .replace('{nombre}', nombre)
    .replace('{fecha}', fecha)
    .replace('{hora}', hora);
}

/**
 * Format payment reminder message with patient data
 */
export function formatPaymentReminderMessage(
  nombre: string,
  fecha: string,
  monto: string
): string {
  const templates = getWhatsAppTemplates();
  return templates.paymentReminder
    .replace('{nombre}', nombre)
    .replace('{fecha}', fecha)
    .replace('{monto}', monto);
}

/**
 * Open WhatsApp with a message
 * Handles emoji encoding properly for WhatsApp Desktop/Web/Mobile
 */
export function openWhatsApp(phone: string, message: string): void {
  // Clean phone number (remove non-digits)
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Use the web API URL format which handles Unicode better
  // The key is to use encodeURIComponent on the full message
  // after ensuring it's properly normalized
  const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  
  window.open(url, '_blank');
}
