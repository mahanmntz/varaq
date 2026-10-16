import { z } from "zod";
import { AVATAR_COUNT, BOOK_CONDITIONS, COPY_STATUSES, LOAN_STATES, PASSPORT_NOTE_MAX, PIN_LENGTH } from "./constants";
import { isValidIsbn, isValidNationalId, normalizeIranMobile, normalizeIsbn, normalizeJalaliDate, toAsciiDigits } from "./normalize";

export const usernameSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@/, ""))
  .pipe(
    z
      .string()
      .min(3)
      .max(24)
      .regex(/^[\p{L}\p{N}_.]+$/u, "Only letters, digits, underscore and dot are allowed"),
  );
export const avatarIdSchema = z.number().int().min(1).max(AVATAR_COUNT);
/** Iranian mobile number, normalized to 09xxxxxxxxx. */
export const phoneSchema = z.string().transform((v, ctx) => {
  const n = normalizeIranMobile(v);
  if (!n) ctx.addIssue({ code: "custom", message: "Invalid Iranian mobile number" });
  return n ?? "";
});
export const nationalIdSchema = z
  .string()
  .transform((v) => toAsciiDigits(v).trim())
  .refine(isValidNationalId, "Invalid national code");
export const birthDateSchema = z.string().transform((v, ctx) => {
  const n = normalizeJalaliDate(v);
  if (!n) ctx.addIssue({ code: "custom", message: "Invalid birth date, use YYYY/MM/DD (Jalali)" });
  return n ?? "";
});
const personNameSchema = z.string().trim().min(2).max(40);
/** Private identity captured at onboarding. Never exposed to other users. */
export const registrationSchema = z.object({
  firstName: personNameSchema,
  lastName: personNameSchema,
  username: usernameSchema,
  avatarId: avatarIdSchema,
});
/** Completed later (required before the first borrow). */
export const identityCompletionSchema = z.object({ nationalId: nationalIdSchema, birthDate: birthDateSchema });
export const isbnSchema = z.string().transform(normalizeIsbn).refine(isValidIsbn, "Invalid ISBN");
export const pinSchema = z.string().regex(new RegExp(`^\\d{${PIN_LENGTH}}$`), "PIN must be 4 digits");
export const conditionSchema = z.enum(BOOK_CONDITIONS);
export const copyStatusSchema = z.enum(COPY_STATUSES);
export const loanStateSchema = z.enum(LOAN_STATES);
export const uuidSchema = z.string().uuid();

// --- auth ---
export const otpRequestSchema = z.object({ phone: phoneSchema });
export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/),
  registration: registrationSchema.optional(),
  inviteCode: z.string().trim().min(4).max(32).optional(),
});

// --- users ---
export const updateProfileSchema = z
  .object({ username: usernameSchema, avatarId: avatarIdSchema })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

// --- catalog ---
export const manualBookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  authors: z.array(z.string().trim().min(1).max(100)).min(1).max(6),
  publisher: z.string().trim().max(120).optional(),
  genres: z.array(z.string().trim().min(1).max(40)).max(6).optional(),
  coverUrl: z.string().url().optional(),
  isbn: isbnSchema.optional(),
});
export const createCopySchema = z
  .object({
    isbn: isbnSchema.optional(),
    manual: manualBookSchema.optional(),
    condition: conditionSchema.default("GOOD"),
    status: z.enum(["AVAILABLE", "UNAVAILABLE"]).default("AVAILABLE"),
    ownerNotes: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.isbn || v.manual, "Provide an ISBN or manual book details");
export const updateCopySchema = z
  .object({
    condition: conditionSchema,
    status: z.enum(["AVAILABLE", "UNAVAILABLE"]),
    ownerNotes: z.string().trim().max(500).nullable(),
  })
  .partial();
export const feedQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  /** Optional filter: only books from members of this circle. */
  circleId: uuidSchema.optional(),
  /** Optional filter: only books from people who share a circle with me. */
  nearby: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  genre: z.string().trim().max(40).optional(),
  condition: conditionSchema.optional(),
  sort: z.enum(["new", "relevance"]).default("new"),
  limit: z.coerce.number().int().min(1).max(60).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});

// --- circles ---
export const createCircleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60),
  geohash: z.string().trim().min(1).max(12).optional(),
  isPublic: z.boolean().default(false),
});
export const joinCircleSchema = z
  .object({ inviteCode: z.string().trim().min(4).max(32), circleId: uuidSchema })
  .partial()
  .refine((v) => v.inviteCode || v.circleId, "Provide inviteCode or circleId");

// --- circulation ---
export const requestLoanSchema = z.object({ copyId: uuidSchema, dueDate: z.coerce.date().optional() });
export const approveLoanSchema = z.object({ dueDate: z.coerce.date().optional() });
export const handshakeSchema = z.object({ pin: pinSchema, condition: conditionSchema });
export const listLoansQuerySchema = z.object({
  role: z.enum(["borrower", "lender"]).optional(),
  state: loanStateSchema.optional(),
});
export const externalLoanSchema = z.object({
  copyId: uuidSchema,
  borrowerName: z.string().trim().min(1).max(60),
  dueDate: z.coerce.date(),
});
export const externalReturnSchema = z.object({ condition: conditionSchema.optional() });

// --- passport ---
export const passportEntrySchema = z.object({
  loanId: uuidSchema,
  note: z.string().trim().min(1).max(PASSPORT_NOTE_MAX),
});
