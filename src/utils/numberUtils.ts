/**
 * Utility functions for handling numbers and ensuring English numerals are used
 */

/**
 * Converts any Arabic/Persian numerals to English numerals
 * @param input - The string that may contain non-English numerals
 * @returns String with only English numerals
 */
export function toEnglishDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  
  // Convert to string if it's a number
  const str = input.toString();
  
  // Replace Arabic/Persian numerals with English equivalents
  return str.replace(/[٠-٩۰-۹]/g, function(match) {
    // Arabic numerals: ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩
    // Persian numerals: ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    
    if (arabicDigits.includes(match)) {
      return String(arabicDigits.indexOf(match));
    } else {
      return String(persianDigits.indexOf(match));
    }
  });
}

/**
 * Validates if a string contains only English numerals
 * @param input - The string to validate
 * @returns Boolean indicating if the string contains only English numerals
 */
export function containsOnlyEnglishDigits(input: string): boolean {
  // Check if the string contains only English digits (0-9), decimal point, and minus sign
  return /^-?[0-9]+(\.[0-9]+)?$/.test(input.trim());
}

/**
 * Formats a number to a localized string with English numerals
 * @param value - The number to format
 * @returns Formatted string with English numerals
 */
export function formatNumber(value: number): string {
  // Use 'en-US' locale to ensure English numerals
  return value.toLocaleString('en-US');
}

/**
 * Parses a string that may contain non-English numerals to a number
 * @param input - The string to parse
 * @returns The parsed number or NaN if invalid
 */
export function parseNumber(input: string): number {
  // First convert any non-English digits to English
  const englishDigits = toEnglishDigits(input);
  
  // Remove any non-numeric characters except decimal point and minus sign
  const cleanedInput = englishDigits.replace(/[^\d.-]/g, '');
  
  // Parse the cleaned input
  return parseFloat(cleanedInput);
}

/**
 * Formats a percentage value with English numerals
 * @param value - The percentage value
 * @param decimalPlaces - Number of decimal places (default: 1)
 * @returns Formatted percentage string with English numerals
 */
export function formatPercentage(value: number, decimalPlaces: number = 1): string {
  return value.toFixed(decimalPlaces) + '%';
}

/**
 * Formats a number for display in charts (K for thousands, M for millions)
 * @param value - The number to format
 * @returns Formatted string with K or M suffix
 */
export function formatDisplayNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}