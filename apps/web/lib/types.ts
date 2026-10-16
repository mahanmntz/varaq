import type { BookCondition, CopyStatus, LoanState } from "@varaq/shared";

/** The only identity other users ever see. */
export type PublicUser = {
  id: string;
  firstName: string | null;
  username: string;
  avatarId: number;
  trustScore: number;
  karmaTokens: number;
};
/** Private KYC details; returned only to the signed-in user about themselves. */
export type Identity = {
  firstName: string | null;
  lastName: string | null;
  nationalId: string | null;
  phoneNumber: string | null;
  birthDate: string | null;
};
export type Me = PublicUser & { status: "ACTIVE" | "RESTRICTED"; createdAt: string; identityVerified: boolean; identity: Identity };

export type Overview = {
  stats: { availableBooks: number; activeLoans: number; completedLoans: number; members: number };
  topLenders: (PublicUser & { lentCount: number })[];
  activity: { type: "added" | "returned"; username: string; title: string; at: string | null }[];
};
export type WishlistEntry = { edition: Copy["edition"]; availableCopy: Copy | null };

export type Copy = {
  id: string;
  status: CopyStatus;
  condition: BookCondition;
  ownerNotes: string | null;
  createdAt: string;
  sharedCircles: string[];
  owner: PublicUser;
  edition: {
    id: string;
    isbn: string | null;
    title: string;
    authors: string[];
    publisher: string | null;
    genres: string[];
    coverUrl: string | null;
  };
};

export type Loan = {
  id: string;
  state: LoanState;
  isExternal: boolean;
  myRole: "lender" | "borrower" | null;
  copy: { id: string; title: string; authors: string[]; coverUrl: string | null; isbn: string | null };
  lender: PublicUser;
  borrower: PublicUser | null;
  externalBorrowerName: string | null;
  dueDate: string | null;
  handoverCondition: BookCondition | null;
  returnCondition: BookCondition | null;
  createdAt: string;
  handoverAt: string | null;
  returnedAt: string | null;
  pin: string | null;
  pinLocked: boolean;
};

export type Circle = {
  id: string;
  name: string;
  slug: string;
  city: string;
  geohash: string | null;
  isPublic: boolean;
  memberCount: number;
  isMember: boolean;
  inviteCode?: string;
};

export type PassportTimeline = {
  copy: { id: string; title: string; owner: PublicUser; addedAt: string };
  entries: { id: string; loanId: string; note: string; cityOrCircle: string | null; createdAt: string; reader: PublicUser | null }[];
};

export type BookLookup = {
  source: "local" | "external";
  isbn: string;
  title: string;
  authors: string[];
  publisher?: string | null;
  genres?: string[];
  coverUrl?: string | null;
};
