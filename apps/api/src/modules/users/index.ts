import type { Db } from "../../lib/db";
import { createUserRepository } from "./user.repository";
import { createUserService } from "./user.service";

export { userRoutes } from "./user.routes";
export type { UsersService, PublicUser } from "./user.service";
export const createUsersModule = (db: Db) => createUserService(createUserRepository(db));
