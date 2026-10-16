import type { Db } from "../../lib/db";
import type { CatalogService } from "../catalog";
import type { CirclesService } from "../circles";
import type { CirculationService } from "../circulation";
import type { UsersService } from "../users";
import { createPassportRepository } from "./passport.repository";
import { createPassportService } from "./passport.service";

export { passportRoutes } from "./passport.routes";
export type { PassportService } from "./passport.service";
export const createPassportModule = (
  db: Db,
  deps: { catalog: CatalogService; circulation: CirculationService; circles: CirclesService; users: UsersService },
) => createPassportService({ repo: createPassportRepository(db), ...deps });
