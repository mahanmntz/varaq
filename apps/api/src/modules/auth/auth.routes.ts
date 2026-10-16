import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { otpRequestSchema, otpVerifySchema } from "@varaq/shared";
import type { AuthService } from "./auth.service";

export function authRoutes(auth: AuthService) {
  return async (app: FastifyInstance) => {
    const r = app.withTypeProvider<ZodTypeProvider>();
    const tags = ["auth"];

    r.post(
      "/auth/otp/request",
      { schema: { tags, summary: "Send a one-time code to an Iranian mobile number (09xxxxxxxxx)", body: otpRequestSchema } },
      (req) => auth.requestOtp(req.body.phone),
    );

    r.post(
      "/auth/otp/verify",
      {
        schema: {
          tags,
          summary:
            "Verify the code. Returns a JWT, or registrationRequired=true for new phone numbers (resend with `registration` = private KYC details + public username/avatar, optional inviteCode)",
          body: otpVerifySchema,
        },
      },
      (req) => auth.verifyOtp(req.body),
    );
  };
}
