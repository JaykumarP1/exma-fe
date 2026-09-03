export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'USD ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR (€)' },
  { code: 'GBP', symbol: '£', name: 'GBP (£)' },
  { code: 'INR', symbol: '₹', name: 'INR (₹)' },
  { code: 'CAD', symbol: 'C$', name: 'CAD (C$)' },
  { code: 'AUD', symbol: 'A$', name: 'AUD (A$)' },
  { code: 'JPY', symbol: '¥', name: 'JPY (¥)' }
];

export function getCurrencySymbol(code?: string): string {
  if (!code) return '$';
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found ? found.symbol : '$';
}

export function formatCurrency(
  amount: number | string,
  currencyCode: string = 'USD',
  options?: { withSign?: boolean }
): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount) || '0');
  if (isNaN(num)) return `${getCurrencySymbol(currencyCode)}0.00`;
  const symbol = getCurrencySymbol(currencyCode);
  const decimals = currencyCode.toUpperCase() === 'JPY' ? 0 : 2;
  const absNum = Math.abs(num);
  const formattedNum = absNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  if (options?.withSign && num !== 0) {
    return num > 0 ? `+${symbol}${formattedNum}` : `-${symbol}${formattedNum}`;
  }

  return `${symbol}${formattedNum}`;
}

