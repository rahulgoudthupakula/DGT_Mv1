import metadata from 'libphonenumber-js/metadata.max.json';
import type { CountryCode } from 'libphonenumber-js';

/** National length limits come from the same metadata used by phone validation. */
export function vendorPhoneLimit(country: CountryCode, digits = ''): number {
  const entry = metadata.countries[country];
  const lengths = entry[3] as number[];
  const prefix = entry[5];
  // Allow a domestic zero prefix (e.g. UK 020...), but not an extra +1 digit.
  const prefixLength = typeof prefix === 'string' && /^0+$/.test(prefix) && digits.startsWith(prefix)
    ? prefix.length : 0;
  return Math.max(...lengths) + prefixLength;
}

export function limitVendorPhone(country: CountryCode, value: string): string {
  const digits = value.replace(/[^0-9]/g, '');
  return digits.slice(0, vendorPhoneLimit(country, digits));
}
