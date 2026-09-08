export interface CountryInfo {
  /** ISO 3166-1 alpha-2 */
  code: string;
  name: string;
  /** ISO 4217 */
  currency: string;
  /** BCP-47 locale used for Intl.NumberFormat currency formatting */
  locale: string;
}

// A curated set of countries covering the major economies in every region.
// Not exhaustive (full ISO 3166 is ~250 entries) but broad enough that most
// operators will find their own country here; add more as needed.
// (Grouped by region here for readability — COUNTRIES below is the
// alphabetically-sorted version actually used to populate dropdowns.)
const RAW_COUNTRIES: CountryInfo[] = [
  { code: "US", name: "United States", currency: "USD", locale: "en-US" },
  { code: "CA", name: "Canada", currency: "CAD", locale: "en-CA" },
  { code: "MX", name: "Mexico", currency: "MXN", locale: "es-MX" },
  { code: "BR", name: "Brazil", currency: "BRL", locale: "pt-BR" },
  { code: "AR", name: "Argentina", currency: "ARS", locale: "es-AR" },
  { code: "CL", name: "Chile", currency: "CLP", locale: "es-CL" },
  { code: "CO", name: "Colombia", currency: "COP", locale: "es-CO" },
  { code: "PE", name: "Peru", currency: "PEN", locale: "es-PE" },

  { code: "GB", name: "United Kingdom", currency: "GBP", locale: "en-GB" },
  { code: "IE", name: "Ireland", currency: "EUR", locale: "en-IE" },
  { code: "FR", name: "France", currency: "EUR", locale: "fr-FR" },
  { code: "DE", name: "Germany", currency: "EUR", locale: "de-DE" },
  { code: "ES", name: "Spain", currency: "EUR", locale: "es-ES" },
  { code: "PT", name: "Portugal", currency: "EUR", locale: "pt-PT" },
  { code: "IT", name: "Italy", currency: "EUR", locale: "it-IT" },
  { code: "NL", name: "Netherlands", currency: "EUR", locale: "nl-NL" },
  { code: "BE", name: "Belgium", currency: "EUR", locale: "nl-BE" },
  { code: "CH", name: "Switzerland", currency: "CHF", locale: "de-CH" },
  { code: "AT", name: "Austria", currency: "EUR", locale: "de-AT" },
  { code: "SE", name: "Sweden", currency: "SEK", locale: "sv-SE" },
  { code: "NO", name: "Norway", currency: "NOK", locale: "nb-NO" },
  { code: "DK", name: "Denmark", currency: "DKK", locale: "da-DK" },
  { code: "FI", name: "Finland", currency: "EUR", locale: "fi-FI" },
  { code: "PL", name: "Poland", currency: "PLN", locale: "pl-PL" },
  { code: "GR", name: "Greece", currency: "EUR", locale: "el-GR" },
  { code: "TR", name: "Turkey", currency: "TRY", locale: "tr-TR" },
  { code: "UA", name: "Ukraine", currency: "UAH", locale: "uk-UA" },
  { code: "RU", name: "Russia", currency: "RUB", locale: "ru-RU" },

  { code: "NG", name: "Nigeria", currency: "NGN", locale: "en-NG" },
  { code: "GH", name: "Ghana", currency: "GHS", locale: "en-GH" },
  { code: "KE", name: "Kenya", currency: "KES", locale: "en-KE" },
  { code: "TZ", name: "Tanzania", currency: "TZS", locale: "en-TZ" },
  { code: "UG", name: "Uganda", currency: "UGX", locale: "en-UG" },
  { code: "ZA", name: "South Africa", currency: "ZAR", locale: "en-ZA" },
  { code: "EG", name: "Egypt", currency: "EGP", locale: "ar-EG" },
  { code: "MA", name: "Morocco", currency: "MAD", locale: "ar-MA" },
  { code: "ET", name: "Ethiopia", currency: "ETB", locale: "en-ET" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", locale: "fr-CI" },
  { code: "SN", name: "Senegal", currency: "XOF", locale: "fr-SN" },
  { code: "CM", name: "Cameroon", currency: "XAF", locale: "fr-CM" },
  { code: "RW", name: "Rwanda", currency: "RWF", locale: "en-RW" },

  { code: "AE", name: "United Arab Emirates", currency: "AED", locale: "ar-AE" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", locale: "ar-SA" },
  { code: "QA", name: "Qatar", currency: "QAR", locale: "ar-QA" },
  { code: "IL", name: "Israel", currency: "ILS", locale: "he-IL" },
  { code: "JO", name: "Jordan", currency: "JOD", locale: "ar-JO" },

  { code: "IN", name: "India", currency: "INR", locale: "en-IN" },
  { code: "PK", name: "Pakistan", currency: "PKR", locale: "en-PK" },
  { code: "BD", name: "Bangladesh", currency: "BDT", locale: "bn-BD" },
  { code: "CN", name: "China", currency: "CNY", locale: "zh-CN" },
  { code: "JP", name: "Japan", currency: "JPY", locale: "ja-JP" },
  { code: "KR", name: "South Korea", currency: "KRW", locale: "ko-KR" },
  { code: "SG", name: "Singapore", currency: "SGD", locale: "en-SG" },
  { code: "MY", name: "Malaysia", currency: "MYR", locale: "ms-MY" },
  { code: "ID", name: "Indonesia", currency: "IDR", locale: "id-ID" },
  { code: "PH", name: "Philippines", currency: "PHP", locale: "en-PH" },
  { code: "TH", name: "Thailand", currency: "THB", locale: "th-TH" },
  { code: "VN", name: "Vietnam", currency: "VND", locale: "vi-VN" },
  { code: "HK", name: "Hong Kong", currency: "HKD", locale: "zh-HK" },
  { code: "TW", name: "Taiwan", currency: "TWD", locale: "zh-TW" },

  { code: "AU", name: "Australia", currency: "AUD", locale: "en-AU" },
  { code: "NZ", name: "New Zealand", currency: "NZD", locale: "en-NZ" },
];

export const COUNTRIES: CountryInfo[] = [...RAW_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

const DEFAULT_COUNTRY = RAW_COUNTRIES.find((c) => c.code === "US")!;

export function getCountryByCode(code: string | null | undefined): CountryInfo {
  return COUNTRIES.find((c) => c.code === code) ?? DEFAULT_COUNTRY;
}

export function getCurrencyOptions(): string[] {
  return Array.from(new Set(COUNTRIES.map((c) => c.currency))).sort();
}
