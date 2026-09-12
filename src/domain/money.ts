export type Money = Readonly<{ amountMinor: bigint; currency: string }>;

export function currencyDigits(currency: string): number {
  if (!Intl.supportedValuesOf('currency').includes(currency)) throw new Error('Moneda no compatible.');
  return new Intl.NumberFormat('es', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits!;
}

export function money(amountMinor: bigint, currency: string): Money {
  currencyDigits(currency);
  if (amountMinor < -9223372036854775808n || amountMinor > 9223372036854775807n) throw new Error('Importe fuera de rango.');
  return Object.freeze({ amountMinor, currency });
}

// Input is a canonical decimal string, never a JavaScript floating-point value.
export function parseMoney(decimal: string, currency: string): Money {
  const digits = currencyDigits(currency);
  if (!/^-?\d+(\.\d+)?$/.test(decimal)) throw new Error('Importe no válido.');
  const negative = decimal.startsWith('-');
  const [whole, fraction = ''] = decimal.replace(/^-/, '').split('.');
  if (fraction.length > digits) throw new Error('Demasiados decimales para esta moneda.');
  const amount = BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits, '0') || '0');
  return money(negative ? -amount : amount, currency);
}

export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('No se pueden sumar monedas diferentes.');
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function decimalString(value: Money): string {
  const digits = currencyDigits(value.currency);
  const negative = value.amountMinor < 0n;
  const raw = (negative ? -value.amountMinor : value.amountMinor).toString().padStart(digits + 1, '0');
  return `${negative ? '-' : ''}${digits ? `${raw.slice(0, -digits)}.${raw.slice(-digits)}` : raw}`;
}

export function serializeMoney(value: Money) {
  return { amountMinor: value.amountMinor.toString(), currency: value.currency, amountDecimal: decimalString(value) };
}

export function ratioBasisPoints(numerator: bigint, denominator: bigint): bigint | null {
  if (denominator <= 0n) return null;
  return numerator * 10000n / denominator;
}
