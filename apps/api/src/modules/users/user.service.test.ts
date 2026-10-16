import { describe, expect, it } from "vitest";
import type { User } from "@prisma/client";
import { toPrivateUser, toPublicUser } from "./user.service";

const user = {
  id: "u1",
  username: "sara_reads",
  contactHash: "h",
  avatarId: 3,
  karmaTokens: 2,
  trustScore: 100,
  status: "ACTIVE",
  listingBonusGranted: false,
  createdAt: new Date(),
  firstName: "سارا",
  lastName: "محمدی",
  nationalId: "0013542419",
  phoneNumber: "09121110001",
  birthDate: "1378/04/15",
} as User;

describe("user DTO privacy", () => {
  it("public DTO exposes only first name, handle, avatar, trust and karma", () => {
    const dto = toPublicUser(user);
    expect(Object.keys(dto).sort()).toEqual(["avatarId", "firstName", "id", "karmaTokens", "trustScore", "username"]);
    expect(JSON.stringify(dto)).not.toMatch(/0013542419|09121110001|1378|محمدی|contactHash/);
  });
  it("public DTO built from a full row (extra fields) still never leaks KYC", () => {
    expect(JSON.stringify(toPublicUser(user))).not.toContain("0013542419");
  });
  it("private DTO is the owner's view and includes identity", () => {
    expect(toPrivateUser(user).identity.nationalId).toBe("0013542419");
    expect(JSON.stringify(toPrivateUser(user))).not.toContain("contactHash");
  });
});
