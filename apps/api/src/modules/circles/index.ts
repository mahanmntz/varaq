import type { Db } from "../../lib/db";
import { createCircleRepository } from "./circle.repository";
import { createCircleService } from "./circle.service";

export { circleRoutes } from "./circle.routes";
export type { CirclesService } from "./circle.service";
export const createCirclesModule = (db: Db) => createCircleService(createCircleRepository(db));
