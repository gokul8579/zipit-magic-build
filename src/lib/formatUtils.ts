/**
 * Format number in Indian numbering system (lakhs and crores)
 * Examples: 1,00,000 (1 lakh), 1,00,00,000 (1 crore)
 */
export function formatIndianNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const numStr = Math.abs(num).toString();
  const [intPart, decPart] = numStr.split('.');
  
  if (intPart.length <= 3) {
    return num.toLocaleString('en-IN', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
  }
  
  const lastThree = intPart.substring(intPart.length - 3);
  const otherDigits = intPart.substring(0, intPart.length - 3);
  const formattedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  
  const formatted = formattedOther + ',' + lastThree;
  const result = (num < 0 ? '-' : '') + formatted + (decPart ? '.' + decPart.substring(0, 2) : '');
  
  return result;
}

/**
 * Format currency in Indian format with ₹ symbol
 */
export function formatIndianCurrency(num: number | null | undefined): string {
  return '₹' + formatIndianNumber(num);
}

/**
 * Parse Indian formatted number string to number
 */
export function parseIndianNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const cleaned = value.toString().replace(/,/g, "");
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}
