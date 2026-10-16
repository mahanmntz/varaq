import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { HttpError } from "../lib/errors";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/** Registers JWT support and an `authenticate` hook for protected routes. */
export async function registerAuth(app: FastifyInstance, secret: string) {
  await app.register(fastifyJwt, { secret, sign: { expiresIn: "30d" } });
  app.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new HttpError(401, "UNAUTHENTICATED");
    }
  });
}

export const userId = (request: FastifyRequest): string => request.user.sub;
