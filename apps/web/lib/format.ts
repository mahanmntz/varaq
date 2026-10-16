const faDate = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" });

/** Formats a date in the Jalali calendar (fa-IR default). */
export const formatDate = (iso: string | Date | null | undefined) => (iso ? faDate.format(new Date(iso)) : "—");
export const toFaDigits = (n: number | string) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export function daysUntil(iso: string | null): number | null {
  return iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5) : null;
}

export const isoDateInput = (daysFromNow: number) => new Date(Date.now() + daysFromNow * 864e5).toISOString().slice(0, 10);

/** What other people see: first name (falls back to the handle). */
export const displayName = (u: { firstName?: string | null; username: string }) => u.firstName || u.username;
