/**
 * Currency formatting utilities for Candy Tempest
 */

export interface CurrencyOptions {
  symbol?: string;
  decimals?: number;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  symbolPosition?: 'before' | 'after';
}

const defaultOptions: Required<CurrencyOptions> = {
  symbol: '$',
  decimals: 2,
  thousandsSeparator: ',',
  decimalSeparator: '.',
  symbolPosition: 'before'
};

/**
 * Format number as currency
 */
export function formatCurrency(
  amount: number, 
  options: CurrencyOptions = {}
): string {
  const opts = { ...defaultOptions, ...options };
  
  // Handle special cases
  if (isNaN(amount) || !isFinite(amount)) {
    return `${opts.symbol}0${opts.decimalSeparator}00`;
  }
  
  // Round to specified decimals
  const rounded = Math.round(amount * Math.pow(10, opts.decimals)) / Math.pow(10, opts.decimals);
  
  // Split into integer and decimal parts
  const parts = Math.abs(rounded).toFixed(opts.decimals).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Add thousands separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, opts.thousandsSeparator);
  
  // Combine parts
  let result = formattedInteger;
  if (opts.decimals > 0) {
    result += opts.decimalSeparator + decimalPart.padEnd(opts.decimals, '0');
  }
  
  // Add negative sign if needed
  if (rounded < 0) {
    result = '-' + result;
  }
  
  // Add currency symbol
  if (opts.symbolPosition === 'before') {
    result = opts.symbol + result;
  } else {
    result = result + opts.symbol;
  }
  
  return result;
}

/**
 * Format bet amount with appropriate precision
 */
export function formatBet(amount: number): string {
  if (amount >= 1) {
    return formatCurrency(amount, { decimals: 2 });
  } else {
    return formatCurrency(amount, { decimals: 2 });
  }
}

/**
 * Format win amount with dynamic precision for readability
 */
export function formatWin(amount: number): string {
  if (amount >= 1000) {
    return formatCurrency(amount, { decimals: 0 });
  } else if (amount >= 100) {
    return formatCurrency(amount, { decimals: 1 });
  } else {
    return formatCurrency(amount, { decimals: 2 });
  }
}

/**
 * Format balance with appropriate precision
 */
export function formatBalance(amount: number): string {
  if (amount >= 10000) {
    return formatCurrency(amount, { decimals: 0 });
  } else if (amount >= 1000) {
    return formatCurrency(amount, { decimals: 1 });
  } else {
    return formatCurrency(amount, { decimals: 2 });
  }
}

/**
 * Format multiplier display
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier}x`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Parse currency string back to number
 */
export function parseCurrency(currencyString: string, options: CurrencyOptions = {}): number {
  const opts = { ...defaultOptions, ...options };
  
  // Remove currency symbol and clean string
  let cleanString = currencyString
    .replace(opts.symbol, '')
    .replace(new RegExp('\\' + opts.thousandsSeparator, 'g'), '')
    .replace(opts.decimalSeparator, '.')
    .trim();
  
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format large numbers with suffixes (K, M, B)
 */
export function formatLargeNumber(num: number, decimals: number = 1): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  } else {
    return num.toFixed(decimals);
  }
}