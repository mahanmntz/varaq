import { describe, expect, it } from "vitest";
import {
  fuzzGeohash,
  isValidIsbn,
  isValidNationalId,
  nationalIdCheckDigit,
  normalizeContact,
  normalizeIranMobile,
  normalizeJalaliDate,
  normalizePersian,
} from "./normalize";

describe("normalizePersian", () => {
  it("unifies Arabic and Persian letter variants and digits", () => {
    expect(normalizePersian("كتاب يك ۱۲۳")).toBe("کتاب یک 123");
  });
  it("treats ZWNJ as a space", () => {
    expect(normalizePersian("می‌خواهم")).toBe("می خواهم");
  });
});

describe("isValidIsbn", () => {
  it("accepts valid ISBN-13 and ISBN-10", () => {
    expect(isValidIsbn("978-0-306-40615-7")).toBe(true);
    expect(isValidIsbn("0306406152")).toBe(true);
  });
  it("rejects bad checksums", () => {
    expect(isValidIsbn("9780306406158")).toBe(false);
  });
});

describe("normalizeContact", () => {
  it("normalizes Iranian mobile numbers and emails", () => {
    expect(normalizeContact("۰۹۱۲ ۳۴۵ ۶۷۸۹")).toBe("+989123456789");
    expect(normalizeContact(" Foo@Example.COM ")).toBe("foo@example.com");
  });
});

describe("fuzzGeohash", () => {
  it("truncates to neighborhood precision", () => {
    expect(fuzzGeohash("sv9jk3x7q2", 5)).toBe("sv9jk");
  });
});

describe("Iranian identity validators", () => {
  it("validates national codes by checksum", () => {
    expect(isValidNationalId("0013542419")).toBe(true);
    expect(isValidNationalId("0013542418")).toBe(false);
    expect(isValidNationalId("1111111111")).toBe(false);
    expect(isValidNationalId("123")).toBe(false);
    expect(nationalIdCheckDigit("001354241")).toBe(9);
  });
  it("normalizes mobile numbers", () => {
    expect(normalizeIranMobile("+98 912 345 6789")).toBe("09123456789");
    expect(normalizeIranMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
    expect(normalizeIranMobile("12345")).toBeNull();
  });
  it("normalizes Jalali birth dates", () => {
    expect(normalizeJalaliDate("۱۳۷۸/۴/۱۵")).toBe("1378/04/15");
    expect(normalizeJalaliDate("1378/13/01")).toBeNull();
    expect(normalizeJalaliDate("1378/07/31")).toBeNull();
  });
});
