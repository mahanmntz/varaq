const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/** Converts Persian/Arabic-Indic digits to ASCII digits. */
export function toAsciiDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => {
    const a = ARABIC_INDIC.indexOf(ch);
    return String(a >= 0 ? a : PERSIAN_INDIC.indexOf(ch));
  });
}

/**
 * Normalizes Persian text for search and comparison:
 * Arabic ye/kaf -> Persian, strips diacritics, tatweel and ZWNJ, folds digits and case.
 */
export function normalizePersian(input: string): string {
  return toAsciiDigits(input)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/‌/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeIsbn(input: string): string {
  return toAsciiDigits(input).replace(/[\s-]/g, "").toUpperCase();
}

export function isValidIsbn(input: string): boolean {
  const isbn = normalizeIsbn(input);
  if (/^\d{13}$/.test(isbn)) {
    const sum = [...isbn].reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = [...isbn].reduce((acc, d, i) => acc + (d === "X" ? 10 : Number(d)) * (10 - i), 0);
    return sum % 11 === 0;
  }
  return false;
}

/** Normalizes an email or phone number so equal contacts always hash equally. */
export function normalizeContact(input: string): string {
  const value = toAsciiDigits(input).trim();
  if (value.includes("@")) return value.toLowerCase();
  let digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("09") && digits.length === 11) digits = "98" + digits.slice(1);
  return "+" + digits;
}

/** Truncates a geohash to neighborhood precision so we never store an exact location. */
export function fuzzGeohash(geohash: string, precision: number): string {
  return geohash
    .toLowerCase()
    .replace(/[^0-9b-hjkmnp-z]/g, "")
    .slice(0, precision);
}

/** Builds the normalized text blob indexed by pg_trgm / FTS for an edition. */
export function buildSearchText(parts: { title: string; authors: string[]; publisher?: string | null; isbn?: string | null }): string {
  return normalizePersian([parts.title, ...parts.authors, parts.publisher ?? "", parts.isbn ?? ""].join(" "));
}

/** Normalizes an Iranian mobile number to the local `09xxxxxxxxx` form, or returns null. */
export function normalizeIranMobile(input: string): string | null {
  let v = toAsciiDigits(input).replace(/[\s\-()]/g, "");
  if (v.startsWith("+98")) v = "0" + v.slice(3);
  else if (v.startsWith("0098")) v = "0" + v.slice(4);
  else if (/^98\d{10}$/.test(v)) v = "0" + v.slice(2);
  else if (/^9\d{9}$/.test(v)) v = "0" + v;
  return /^09\d{9}$/.test(v) ? v : null;
}

/** Check digit for the first nine digits of an Iranian national code (کد ملی). */
export function nationalIdCheckDigit(first9: string): number {
  const sum = [...first9].reduce((acc, d, i) => acc + Number(d) * (10 - i), 0);
  const r = sum % 11;
  return r < 2 ? r : 11 - r;
}

export function isValidNationalId(input: string): boolean {
  const id = toAsciiDigits(input).trim();
  if (!/^\d{10}$/.test(id) || /^(\d)\1{9}$/.test(id)) return false;
  return nationalIdCheckDigit(id.slice(0, 9)) === Number(id[9]);
}

/** Validates a Jalali date written as YYYY/MM/DD and returns it normalized, or null. */
export function normalizeJalaliDate(input: string): string | null {
  const m = toAsciiDigits(input)
    .trim()
    .match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const maxDay = mo <= 6 ? 31 : 30; // Esfand's leap day is not verified; good enough for a birth date
  if (y < 1280 || y > 1420 || mo < 1 || mo > 12 || d < 1 || d > maxDay) return null;
  return `${y}/${String(mo).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
}
