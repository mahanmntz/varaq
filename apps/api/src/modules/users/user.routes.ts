import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { identityCompletionSchema, updateProfileSchema, uuidSchema } from "@varaq/shared";
import { userId } from "../../plugins/auth";
import type { UsersService } from "./user.service";

export function userRoutes(users: UsersService) {
  return async (app: FastifyInstance) => {
    const r = app.withTypeProvider<ZodTypeProvider>();
    const auth = { onRequest: [app.authenticate], schema: { tags: ["users"], security: [{ bearerAuth: [] }] } };

    r.get("/avatars", { schema: { tags: ["users"], summary: "List the 16 built-in avatar ids" } }, async () => ({
      avatarIds: users.avatarIds(),
    }));

    r.get(
      "/users/me",
      { ...auth, schema: { ...auth.schema, summary: "Current user profile, karma tokens and trust score" } },
      async (req) => users.getMe(userId(req)),
    );

    r.patch(
      "/users/me",
      { onRequest: auth.onRequest, schema: { ...auth.schema, summary: "Change username or avatar", body: updateProfileSchema } },
      async (req) => users.updateProfile(userId(req), req.body),
    );

    r.patch(
      "/users/me/identity",
      {
        onRequest: auth.onRequest,
        schema: {
          ...auth.schema,
          summary: "Add national code and birth date (private; required before borrowing)",
          body: identityCompletionSchema,
        },
      },
      async (req) => users.completeIdentity(userId(req), req.body),
    );

    r.get(
      "/users/:id",
      {
        onRequest: auth.onRequest,
        schema: { ...auth.schema, summary: "Public profile of another user", params: z.object({ id: uuidSchema }) },
      },
      async (req) => users.getPublic(req.params.id),
    );
  };
}
