export type CardNetwork = 'Visa' | 'Mastercard' | 'Amex' | 'RuPay' | 'Discover' | 'Unknown';

export interface CardNetworkMeta {
  name: CardNetwork;
  label: string;
  lengths: number[];
  format: number[]; // e.g. [4, 4, 4, 4] or [4, 6, 5]
  cvvLength: number;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
  badgeTextColor: string;
}

export const CARD_NETWORKS: Record<CardNetwork, CardNetworkMeta> = {
  Visa: {
    name: 'Visa',
    label: 'Visa',
    lengths: [16, 13, 19],
    format: [4, 4, 4, 4],
    cvvLength: 3,
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #2563eb 100%)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    badgeBg: '#1e3a8a',
    badgeTextColor: '#ffffff'
  },
  Mastercard: {
    name: 'Mastercard',
    label: 'Mastercard',
    lengths: [16],
    format: [4, 4, 4, 4],
    cvvLength: 3,
    bgGradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #dc2626 100%)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    badgeBg: '#7f1d1d',
    badgeTextColor: '#ffffff'
  },
  Amex: {
    name: 'Amex',
    label: 'American Express',
    lengths: [15],
    format: [4, 6, 5],
    cvvLength: 4,
    bgGradient: 'linear-gradient(135deg, #082f49 0%, #0369a1 50%, #0284c7 100%)',
    borderColor: 'rgba(14, 165, 233, 0.4)',
    badgeBg: '#0369a1',
    badgeTextColor: '#ffffff'
  },
  RuPay: {
    name: 'RuPay',
    label: 'RuPay',
    lengths: [16],
    format: [4, 4, 4, 4],
    cvvLength: 3,
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #059669 100%)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    badgeBg: '#065f46',
    badgeTextColor: '#ffffff'
  },
  Discover: {
    name: 'Discover',
    label: 'Discover',
    lengths: [16],
    format: [4, 4, 4, 4],
    cvvLength: 3,
    bgGradient: 'linear-gradient(135deg, #431407 0%, #9a3412 50%, #ea580c 100%)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    badgeBg: '#9a3412',
    badgeTextColor: '#ffffff'
  },
  Unknown: {
    name: 'Unknown',
    label: 'Credit / Debit',
    lengths: [16],
    format: [4, 4, 4, 4],
    cvvLength: 3,
    bgGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e1b4b 100%)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    badgeBg: '#334155',
    badgeTextColor: '#e2e8f0'
  }
};

/**
 * Detect card network from card number or prefix
 */
export function detectCardNetwork(input: string): CardNetwork {
  const digits = input.replace(/\D/g, '');
  if (!digits) return 'Unknown';

  // Visa: starts with 4
  if (/^4/.test(digits)) return 'Visa';

  // American Express: starts with 34 or 37
  if (/^3[47]/.test(digits)) return 'Amex';

  // Mastercard: 51-55 or 2221-2720
  if (/^(5[1-5]|2(22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[0-1][0-9]|720))/.test(digits)) {
    return 'Mastercard';
  }

  // RuPay: 60, 6521-6530, 508, 353, 356, 81, 82
  if (/^(60|652[1-9]|653[01]|508[0-9]|353[0-9]|356[0-9]|81|82)/.test(digits)) {
    return 'RuPay';
  }

  // Discover: 6011, 644-649, 65
  if (/^(6011|64[4-9]|65)/.test(digits)) {
    return 'Discover';
  }

  return 'Unknown';
}

/**
 * Luhn checksum algorithm for card number verification
 */
export function validateLuhn(digits: string): boolean {
  const clean = digits.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Format card number with standard spacing (e.g. 4-4-4-4 or 4-6-5 for Amex)
 * Preserves masked formats (e.g. •••• •••• •••• 1234)
 */
export function formatCardNumber(value: string, detectedNetwork?: CardNetwork): string {
  if (!value) return '';

  // If input already has bullets / mask
  if (value.includes('•') || value.includes('*')) {
    return value;
  }

  const digits = value.replace(/\D/g, '');
  const network = detectedNetwork || detectCardNetwork(digits);

  // Amex format: 4 - 6 - 5
  if (network === 'Amex') {
    const part1 = digits.slice(0, 4);
    const part2 = digits.slice(4, 10);
    const part3 = digits.slice(10, 15);

    if (part3) return `${part1} ${part2} ${part3}`;
    if (part2) return `${part1} ${part2}`;
    return part1;
  }

  // Standard format: 4 - 4 - 4 - 4 (up to 16 or 19 digits)
  const parts: string[] = [];
  for (let i = 0; i < digits.length && i < 19; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

export interface CardValidationResult {
  digits: string;
  formatted: string;
  network: CardNetwork;
  isPartial: boolean;
  isValid: boolean;
  isComplete: boolean;
  error: string | null;
  warning: string | null;
}

/**
 * Full card validation for input fields
 */
export function validateCardNumber(input: string): CardValidationResult {
  const digits = input.replace(/\D/g, '');
  const isMasked = input.includes('•') || input.includes('*');
  const network = detectCardNetwork(digits);

  // If partial input (e.g. user entered statement last 4 digits) or masked
  if (isMasked || digits.length <= 4) {
    return {
      digits,
      formatted: input,
      network,
      isPartial: true,
      isValid: digits.length >= 4,
      isComplete: false,
      error: digits.length > 0 && digits.length < 4 ? 'Enter at least 4 digits' : null,
      warning: null
    };
  }

  const expectedLength = network === 'Amex' ? 15 : 16;
  const formatted = formatCardNumber(digits, network);

  // Still typing
  if (digits.length < expectedLength) {
    return {
      digits,
      formatted,
      network,
      isPartial: false,
      isValid: false,
      isComplete: false,
      error: null,
      warning: `Enter ${expectedLength} digits (${digits.length}/${expectedLength})`
    };
  }

  // Exact or complete length
  const isChecksumValid = validateLuhn(digits);

  if (isChecksumValid) {
    return {
      digits,
      formatted,
      network,
      isPartial: false,
      isValid: true,
      isComplete: true,
      error: null,
      warning: null
    };
  }

  return {
    digits,
    formatted,
    network,
    isPartial: false,
    isValid: false,
    isComplete: true,
    error: `Invalid ${network !== 'Unknown' ? network : 'card'} checksum`,
    warning: null
  };
}

/**
 * Format expiry date into MM/YY
 */
export function formatExpiryDate(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 2) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return clean;
}

/**
 * Validate expiry date MM/YY
 */
export function validateExpiryDate(value: string): { isValid: boolean; error: string | null } {
  const clean = value.replace(/\D/g, '');
  if (!clean) return { isValid: false, error: 'Expiry date is required' };

  if (clean.length < 4) {
    return { isValid: false, error: 'Incomplete expiry (MM/YY)' };
  }

  const month = parseInt(clean.slice(0, 2), 10);
  const year = parseInt('20' + clean.slice(2, 4), 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid month (01-12)' };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, error: 'Card has expired' };
  }

  return { isValid: true, error: null };
}

