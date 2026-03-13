/**
 * PhoneInput — International phone number input with country selector
 *
 * Uses react-international-phone headless hook integrated with shadcn/ui Input.
 * Features: country flags, E.164 output, country guessing, paste-safe.
 *
 * Argentina mask fix: the default mask for /^9/ (mobile) only allows 10 digits
 * but AR mobile numbers have 11 digits after +54 (e.g. 9 2235 831983).
 * We patch the AR country data to fix this.
 */

import { useRef, useState, useCallback, useMemo } from 'react';
import {
  usePhoneInput,
  FlagImage,
  defaultCountries,
  parseCountry,
  buildCountryData,
} from 'react-international-phone';
import type { CountryIso2, CountryData } from 'react-international-phone';
import { Input } from '@/components/ui/input';
import { cn } from '@/components/ui/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Patch Argentina country data with corrected phone masks.
 * Default library masks for AR /^9/ only allow 10 digits, but Argentine
 * mobile numbers have 11 digits after country code:
 *   +54 9 11 XXXX-XXXX     (Buenos Aires mobile)
 *   +54 9 2235 83-1983      (Mar del Plata mobile)
 *   +54 9 2944 90-7473      (San Martín de los Andes mobile)
 */
const patchedCountries: CountryData[] = defaultCountries.map((country) => {
  const parsed = parseCountry(country);
  if (parsed.iso2 === 'ar') {
    return buildCountryData({
      name: parsed.name,
      iso2: parsed.iso2,
      dialCode: parsed.dialCode,
      format: {
        default: '(..) .... ....',
        '/^9/': '(.) .... ......',   // 1+4+6 = 11 digits (mobile with 9 prefix)
        '/^11/': '(..) .... ....',   // 2+4+4 = 10 digits (Buenos Aires landline)
        '/^(2|3|4|5)/': '(.) .... ....', // 1+4+4 = 9 digits (provincial landline)
      },
      priority: parsed.priority ?? 0,
      areaCodes: parsed.areaCodes,
    });
  }
  return country;
});

interface PhoneInputProps {
  /** Phone value in E.164 format (e.g. "+5491112345678") */
  value: string;
  /** Called with the new E.164 phone string on change */
  onChange: (phone: string) => void;
  /** Default country ISO2 code */
  defaultCountry?: CountryIso2;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Mark as invalid */
  'aria-invalid'?: boolean;
  /** Accessibility: describedby */
  'aria-describedby'?: string;
  /** HTML id for label association */
  id?: string;
  /** Additional className for the wrapper */
  className?: string;
}

// Preferred countries at the top of the dropdown (LATAM + common)
const PREFERRED_COUNTRIES: CountryIso2[] = ['ar', 'uy', 'cl', 'br', 'mx', 'co', 'pe', 'us', 'es'];

export function PhoneInput({
  value,
  onChange,
  defaultCountry = 'ar',
  placeholder,
  disabled = false,
  id,
  className,
  ...ariaProps
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    inputValue,
    country,
    setCountry,
    handlePhoneValueChange,
  } = usePhoneInput({
    defaultCountry,
    value,
    countries: patchedCountries,
    preferredCountries: PREFERRED_COUNTRIES,
    forceDialCode: true,
    onChange: (data) => {
      onChange(data.phone);
    },
    inputRef,
  });

  /**
   * Handle paste events — strip country code prefix if present.
   * When forceDialCode is true, the input already shows "+54 ".
   * If the user pastes "+54 9 2235 831983", without this handler
   * it would result in "+54 +54 9 2235 831983" (duplicated).
   */
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text').trim();

    // Only intercept if the pasted text starts with "+" (full E.164 number)
    if (!pastedText.startsWith('+')) return;

    e.preventDefault();

    // Strip all non-digit characters except the leading +
    const cleaned = '+' + pastedText.slice(1).replace(/\D/g, '');

    // Let the library handle the full E.164 value via the onChange prop
    onChange(cleaned);
  }, [onChange]);

  const handleCountrySelect = (iso2: CountryIso2) => {
    setCountry(iso2, { focusOnInput: true });
    setDropdownOpen(false);
  };

  // Close dropdown on outside click
  const handleBlur = (e: React.FocusEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node)) {
      setDropdownOpen(false);
    }
  };

  // Build sorted country list: preferred first, then rest alphabetically
  const sortedCountries = (() => {
    const preferred = PREFERRED_COUNTRIES
      .map((iso2) => defaultCountries.find((c) => parseCountry(c).iso2 === iso2))
      .filter(Boolean);
    const rest = defaultCountries.filter(
      (c) => !PREFERRED_COUNTRIES.includes(parseCountry(c).iso2)
    );
    return { preferred, rest };
  })();

  return (
    <div className={cn('relative', className)} onBlur={handleBlur}>
      <div className="flex">
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => !disabled && setDropdownOpen(!dropdownOpen)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 px-2 border border-r-0 rounded-l-md',
            'border-input bg-muted/50 hover:bg-muted transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:pointer-events-none disabled:opacity-50',
            'dark:bg-input/30',
            'h-9 shrink-0'
          )}
          aria-label="Select country"
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
        >
          <FlagImage iso2={country.iso2} size="20px" />
          <ChevronDown className={cn(
            'w-3 h-3 text-muted-foreground transition-transform',
            dropdownOpen && 'rotate-180'
          )} />
        </button>

        {/* Phone input */}
        <Input
          ref={inputRef}
          id={id}
          type="tel"
          value={inputValue}
          onChange={handlePhoneValueChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          className="rounded-l-none"
          {...ariaProps}
        />
      </div>

      {/* Country dropdown */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 w-72 max-h-60 overflow-y-auto',
            'rounded-md border border-border bg-popover shadow-lg',
            'py-1 text-sm animate-in fade-in-0 zoom-in-95'
          )}
        >
          {/* Preferred countries */}
          {sortedCountries.preferred.map((countryData) => {
            if (!countryData) return null;
            const parsed = parseCountry(countryData);
            return (
              <CountryOption
                key={parsed.iso2}
                country={parsed}
                isSelected={parsed.iso2 === country.iso2}
                onSelect={handleCountrySelect}
              />
            );
          })}

          {/* Separator */}
          <div className="my-1 border-t border-border" />

          {/* All other countries */}
          {sortedCountries.rest.map((countryData) => {
            const parsed = parseCountry(countryData);
            return (
              <CountryOption
                key={parsed.iso2}
                country={parsed}
                isSelected={parsed.iso2 === country.iso2}
                onSelect={handleCountrySelect}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Individual country option in the dropdown */
function CountryOption({
  country,
  isSelected,
  onSelect,
}: {
  country: { iso2: CountryIso2; name: string; dialCode: string };
  isSelected: boolean;
  onSelect: (iso2: CountryIso2) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(country.iso2)}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 text-left',
        'hover:bg-accent hover:text-accent-foreground transition-colors',
        'focus-visible:outline-none focus-visible:bg-accent',
        isSelected && 'bg-accent/50 font-medium'
      )}
    >
      <FlagImage iso2={country.iso2} size="18px" className="shrink-0" />
      <span className="truncate text-foreground">{country.name}</span>
      <span className="ml-auto text-muted-foreground shrink-0">+{country.dialCode}</span>
    </button>
  );
}
