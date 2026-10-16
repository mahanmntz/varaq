import type { Db } from "../../lib/db";
import type { CatalogService } from "../catalog";
import type { CirclesService } from "../circles";
import type { UsersService } from "../users";
import { createCirculationService } from "./circulation.service";
import { createLoanRepository } from "./loan.repository";

export { circulationRoutes } from "./circulation.routes";
export type { CirculationService, LoanDto } from "./circulation.service";
export const createCirculationModule = (db: Db, deps: { catalog: CatalogService; users: UsersService; circles: CirclesService }) =>
  createCirculationService({ repo: createLoanRepository(db), ...deps });
