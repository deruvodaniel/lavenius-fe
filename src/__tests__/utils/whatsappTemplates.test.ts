import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getWhatsAppTemplates,
  formatTurnoReminderMessage,
  formatPaymentReminderMessage,
  openWhatsApp,
} from '../../lib/utils/whatsappTemplates';

// Constants matching the source file
const SETTINGS_KEY = 'lavenius_settings';
const DEFAULT_TURNO_TEMPLATE = 'Hola {nombre}! Te recuerdo que tenes un turno agendado para el *{fecha}* a las *{hora}*. Podes confirmar tu asistencia? Responde *Si* para confirmar o *No* si necesitas cancelar. Gracias!';
const DEFAULT_PAYMENT_TEMPLATE = 'Hola {nombre}! Te escribo para recordarte que tenes un pago pendiente del *{fecha}* por *{monto}*. Podes abonar por transferencia o en efectivo en tu proxima sesion. Gracias!';

describe('whatsappTemplates', () => {
  // Store original localStorage for restoration
  let localStorageMock: Record<string, string>;
  let windowOpenMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock = {};
    
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return localStorageMock[key] || null;
    });
    
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock window.open
    windowOpenMock = vi.fn();
    vi.stubGlobal('open', windowOpenMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('getWhatsAppTemplates', () => {
    it('returns default templates when localStorage is empty', () => {
      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(DEFAULT_TURNO_TEMPLATE);
      expect(templates.paymentReminder).toBe(DEFAULT_PAYMENT_TEMPLATE);
    });

    it('returns default templates when localStorage has no settings key', () => {
      localStorageMock['other_key'] = JSON.stringify({ foo: 'bar' });

      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(DEFAULT_TURNO_TEMPLATE);
      expect(templates.paymentReminder).toBe(DEFAULT_PAYMENT_TEMPLATE);
    });

    it('returns custom templates from localStorage', () => {
      const customTurno = 'Custom turno template {nombre} {fecha} {hora}';
      const customPayment = 'Custom payment template {nombre} {fecha} {monto}';
      
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: {
          turnoReminder: customTurno,
          paymentReminder: customPayment,
        },
      });

      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(customTurno);
      expect(templates.paymentReminder).toBe(customPayment);
    });

    it('returns default turno template when only payment is customized', () => {
      const customPayment = 'Custom payment template';
      
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: {
          paymentReminder: customPayment,
        },
      });

      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(DEFAULT_TURNO_TEMPLATE);
      expect(templates.paymentReminder).toBe(customPayment);
    });

    it('returns default payment template when only turno is customized', () => {
      const customTurno = 'Custom turno template';
      
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: {
          turnoReminder: customTurno,
        },
      });

      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(customTurno);
      expect(templates.paymentReminder).toBe(DEFAULT_PAYMENT_TEMPLATE);
    });

    it('returns default templates when whatsappTemplates is null', () => {
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: null,
      });

      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(DEFAULT_TURNO_TEMPLATE);
      expect(templates.paymentReminder).toBe(DEFAULT_PAYMENT_TEMPLATE);
    });

    it('returns default templates when whatsappTemplates is missing', () => {
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        otherSetting: 'value',
      });

      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(DEFAULT_TURNO_TEMPLATE);
      expect(templates.paymentReminder).toBe(DEFAULT_PAYMENT_TEMPLATE);
    });

    it('returns default templates when localStorage has invalid JSON', () => {
      localStorageMock[SETTINGS_KEY] = 'invalid-json{';

      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(DEFAULT_TURNO_TEMPLATE);
      expect(templates.paymentReminder).toBe(DEFAULT_PAYMENT_TEMPLATE);
      expect(console.error).toHaveBeenCalled();
    });

    it('returns default templates when custom template is empty string', () => {
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: {
          turnoReminder: '',
          paymentReminder: '',
        },
      });

      const templates = getWhatsAppTemplates();

      // Empty strings are falsy, should fall back to defaults
      expect(templates.turnoReminder).toBe(DEFAULT_TURNO_TEMPLATE);
      expect(templates.paymentReminder).toBe(DEFAULT_PAYMENT_TEMPLATE);
    });

    it('preserves templates with special characters', () => {
      const specialTurno = 'Template with emojis 🎉 and special chars: áéíóú ñ';
      
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: {
          turnoReminder: specialTurno,
        },
      });

      const templates = getWhatsAppTemplates();

      expect(templates.turnoReminder).toBe(specialTurno);
    });
  });

  describe('formatTurnoReminderMessage', () => {
    it('formats message with all placeholders replaced', () => {
      const result = formatTurnoReminderMessage('Juan Pérez', '15/01/2026', '14:30');

      expect(result).toContain('Juan Pérez');
      expect(result).toContain('15/01/2026');
      expect(result).toContain('14:30');
      expect(result).not.toContain('{nombre}');
      expect(result).not.toContain('{fecha}');
      expect(result).not.toContain('{hora}');
    });

    it('uses default template when no custom template exists', () => {
      const result = formatTurnoReminderMessage('María', '20/02/2026', '10:00');

      expect(result).toBe(
        'Hola María! Te recuerdo que tenes un turno agendado para el *20/02/2026* a las *10:00*. Podes confirmar tu asistencia? Responde *Si* para confirmar o *No* si necesitas cancelar. Gracias!'
      );
    });

    it('uses custom template from localStorage', () => {
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: {
          turnoReminder: 'Recordatorio: {nombre} - {fecha} - {hora}',
        },
      });

      const result = formatTurnoReminderMessage('Ana', '01/03/2026', '09:00');

      expect(result).toBe('Recordatorio: Ana - 01/03/2026 - 09:00');
    });

    it('handles empty nombre', () => {
      const result = formatTurnoReminderMessage('', '15/01/2026', '14:30');

      expect(result).toContain('Hola !');
      expect(result).toContain('15/01/2026');
      expect(result).toContain('14:30');
    });

    it('handles empty fecha', () => {
      const result = formatTurnoReminderMessage('Juan', '', '14:30');

      expect(result).toContain('Juan');
      expect(result).toContain('**'); // Empty between asterisks
      expect(result).toContain('14:30');
    });

    it('handles empty hora', () => {
      const result = formatTurnoReminderMessage('Juan', '15/01/2026', '');

      expect(result).toContain('Juan');
      expect(result).toContain('15/01/2026');
      // hora is replaced with empty string
    });

    it('handles special characters in nombre', () => {
      const result = formatTurnoReminderMessage('José María O\'Brien', '15/01/2026', '14:30');

      expect(result).toContain("José María O'Brien");
    });

    it('handles nombres with accents and special chars', () => {
      const result = formatTurnoReminderMessage('Ñoño Ibáñez', '15/01/2026', '14:30');

      expect(result).toContain('Ñoño Ibáñez');
    });

    it('handles all parameters empty', () => {
      const result = formatTurnoReminderMessage('', '', '');

      expect(result).not.toContain('{nombre}');
      expect(result).not.toContain('{fecha}');
      expect(result).not.toContain('{hora}');
    });
  });

  describe('formatPaymentReminderMessage', () => {
    it('formats message with all placeholders replaced', () => {
      const result = formatPaymentReminderMessage('Juan Pérez', '15/01/2026', '$5.000');

      expect(result).toContain('Juan Pérez');
      expect(result).toContain('15/01/2026');
      expect(result).toContain('$5.000');
      expect(result).not.toContain('{nombre}');
      expect(result).not.toContain('{fecha}');
      expect(result).not.toContain('{monto}');
    });

    it('uses default template when no custom template exists', () => {
      const result = formatPaymentReminderMessage('María', '20/02/2026', '$10.000');

      expect(result).toBe(
        'Hola María! Te escribo para recordarte que tenes un pago pendiente del *20/02/2026* por *$10.000*. Podes abonar por transferencia o en efectivo en tu proxima sesion. Gracias!'
      );
    });

    it('uses custom template from localStorage', () => {
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: {
          paymentReminder: 'Pago: {nombre} debe {monto} desde {fecha}',
        },
      });

      const result = formatPaymentReminderMessage('Ana', '01/03/2026', '$3.500');

      expect(result).toBe('Pago: Ana debe $3.500 desde 01/03/2026');
    });

    it('handles empty nombre', () => {
      const result = formatPaymentReminderMessage('', '15/01/2026', '$5.000');

      expect(result).toContain('Hola !');
    });

    it('handles empty monto', () => {
      const result = formatPaymentReminderMessage('Juan', '15/01/2026', '');

      expect(result).toContain('Juan');
      expect(result).toContain('15/01/2026');
      expect(result).not.toContain('{monto}');
    });

    it('handles monto with different formats', () => {
      const result1 = formatPaymentReminderMessage('Juan', '15/01/2026', 'ARS 5000');
      const result2 = formatPaymentReminderMessage('Juan', '15/01/2026', '5000 pesos');
      const result3 = formatPaymentReminderMessage('Juan', '15/01/2026', '$5,000.00');

      expect(result1).toContain('ARS 5000');
      expect(result2).toContain('5000 pesos');
      expect(result3).toContain('$5,000.00');
    });

    it('handles special characters in all fields', () => {
      const result = formatPaymentReminderMessage(
        "María O'Connor",
        '15/01/2026',
        '$1.000,50'
      );

      expect(result).toContain("María O'Connor");
      expect(result).toContain('$1.000,50');
    });
  });

  describe('openWhatsApp', () => {
    it('opens WhatsApp with correct URL format', () => {
      openWhatsApp('5491123456789', 'Hello');

      expect(windowOpenMock).toHaveBeenCalledTimes(1);
      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=Hello',
        '_blank'
      );
    });

    it('encodes message with special characters', () => {
      openWhatsApp('5491123456789', 'Hola! Cómo estás?');

      expect(windowOpenMock).toHaveBeenCalledWith(
        expect.stringContaining('text=Hola!%20C%C3%B3mo%20est%C3%A1s%3F'),
        '_blank'
      );
    });

    it('encodes message with emojis', () => {
      openWhatsApp('5491123456789', 'Hola! 😊');

      const call = windowOpenMock.mock.calls[0][0] as string;
      expect(call).toContain('api.whatsapp.com/send');
      expect(call).toContain('phone=5491123456789');
      // Emoji should be encoded
      expect(call).toContain('%F0%9F%98%8A'); // 😊 encoded
    });

    it('cleans phone number by removing non-digits', () => {
      openWhatsApp('+54 (911) 2345-6789', 'Test');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=Test',
        '_blank'
      );
    });

    it('handles phone number with dashes', () => {
      openWhatsApp('54-911-2345-6789', 'Test');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=Test',
        '_blank'
      );
    });

    it('handles phone number with spaces', () => {
      openWhatsApp('54 911 2345 6789', 'Test');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=Test',
        '_blank'
      );
    });

    it('handles phone number with dots', () => {
      openWhatsApp('54.911.2345.6789', 'Test');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=Test',
        '_blank'
      );
    });

    it('handles empty phone number', () => {
      openWhatsApp('', 'Test message');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=&text=Test%20message',
        '_blank'
      );
    });

    it('handles empty message', () => {
      openWhatsApp('5491123456789', '');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=',
        '_blank'
      );
    });

    it('handles message with newlines', () => {
      openWhatsApp('5491123456789', 'Line 1\nLine 2\nLine 3');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=Line%201%0ALine%202%0ALine%203',
        '_blank'
      );
    });

    it('handles message with WhatsApp formatting (bold)', () => {
      openWhatsApp('5491123456789', '*bold text*');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=*bold%20text*',
        '_blank'
      );
    });

    it('handles message with WhatsApp formatting (italic)', () => {
      openWhatsApp('5491123456789', '_italic text_');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=_italic%20text_',
        '_blank'
      );
    });

    it('handles message with URL', () => {
      openWhatsApp('5491123456789', 'Check this: https://example.com/path?query=1');

      expect(windowOpenMock).toHaveBeenCalledWith(
        expect.stringContaining('text=Check%20this%3A%20https%3A%2F%2Fexample.com%2Fpath%3Fquery%3D1'),
        '_blank'
      );
    });

    it('handles message with ampersands', () => {
      openWhatsApp('5491123456789', 'A & B & C');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=A%20%26%20B%20%26%20C',
        '_blank'
      );
    });

    it('handles realistic turno reminder message', () => {
      const message = formatTurnoReminderMessage('Juan Pérez', '15/01/2026', '14:30');
      openWhatsApp('+54 11 2345-6789', message);

      const call = windowOpenMock.mock.calls[0][0] as string;
      expect(call).toContain('phone=541123456789');
      expect(call).toContain('text=');
      // Verify it's properly encoded
      expect(call).toContain('Hola%20Juan%20P%C3%A9rez');
    });

    it('handles realistic payment reminder message', () => {
      const message = formatPaymentReminderMessage('María López', '01/02/2026', '$5.000');
      openWhatsApp('+54 11 9876-5432', message);

      const call = windowOpenMock.mock.calls[0][0] as string;
      expect(call).toContain('phone=541198765432');
      expect(call).toContain('text=');
    });

    it('preserves phone numbers that are already clean', () => {
      openWhatsApp('5491123456789', 'Test');

      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://api.whatsapp.com/send?phone=5491123456789&text=Test',
        '_blank'
      );
    });

    it('handles very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      openWhatsApp('5491123456789', longMessage);

      expect(windowOpenMock).toHaveBeenCalledTimes(1);
      const call = windowOpenMock.mock.calls[0][0] as string;
      expect(call).toContain('text=' + 'A'.repeat(1000));
    });
  });

  describe('integration: format + open', () => {
    it('correctly formats and opens turno reminder', () => {
      const message = formatTurnoReminderMessage('Ana García', '20/03/2026', '16:00');
      openWhatsApp('5491155556666', message);

      expect(windowOpenMock).toHaveBeenCalledTimes(1);
      const call = windowOpenMock.mock.calls[0][0] as string;
      
      // Verify URL structure
      expect(call).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?phone=\d+&text=.+$/);
      expect(call).toContain('phone=5491155556666');
    });

    it('correctly formats and opens payment reminder', () => {
      const message = formatPaymentReminderMessage('Carlos Ruiz', '10/04/2026', '$7.500');
      openWhatsApp('5491177778888', message);

      expect(windowOpenMock).toHaveBeenCalledTimes(1);
      const call = windowOpenMock.mock.calls[0][0] as string;
      
      expect(call).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?phone=\d+&text=.+$/);
      expect(call).toContain('phone=5491177778888');
    });

    it('handles custom templates with special formatting', () => {
      localStorageMock[SETTINGS_KEY] = JSON.stringify({
        whatsappTemplates: {
          turnoReminder: '🗓️ *TURNO*\n👤 {nombre}\n📅 {fecha}\n🕐 {hora}',
        },
      });

      const message = formatTurnoReminderMessage('Test User', '01/01/2026', '12:00');
      openWhatsApp('5491199990000', message);

      const call = windowOpenMock.mock.calls[0][0] as string;
      // Verify emojis and newlines are encoded
      expect(call).toContain('%F0%9F%97%93'); // 🗓️
      expect(call).toContain('%0A'); // newline
    });
  });
});
