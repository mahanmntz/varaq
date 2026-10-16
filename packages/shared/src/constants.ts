export const AVATAR_COUNT = 16;
export const PIN_LENGTH = 4;
export const DEFAULT_LOAN_DAYS = 21;
export const MAX_PIN_ATTEMPTS = 5;
export const PASSPORT_NOTE_MAX = 200;
export const GEOHASH_MAX_PRECISION = 5; // ~5km cells: neighborhood level, never a home address

export const BOOK_CONDITIONS = ["MINT", "GOOD", "FAIR", "WORN"] as const;
export type BookCondition = (typeof BOOK_CONDITIONS)[number];

export const COPY_STATUSES = ["AVAILABLE", "LOANED_INTERNAL", "LOANED_EXTERNAL", "UNAVAILABLE"] as const;
export type CopyStatus = (typeof COPY_STATUSES)[number];

export const LOAN_STATES = ["REQUESTED", "APPROVED", "ACTIVE", "RETURNED", "OVERDUE", "CANCELLED"] as const;
export type LoanState = (typeof LOAN_STATES)[number];

export const USER_STATUSES = ["ACTIVE", "RESTRICTED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
