import type { Db } from "../../lib/db";
import type { CirclesService } from "../circles";
import type { UsersService } from "../users";
import { createCatalogRepository } from "./catalog.repository";
import { createCatalogService } from "./catalog.service";
import { defaultMetadataProvider, type MetadataProvider } from "./metadata.provider";

export { catalogRoutes } from "./catalog.routes";
export type { CatalogService, CopyDto } from "./catalog.service";
export type { MetadataProvider } from "./metadata.provider";
export const createCatalogModule = (
  db: Db,
  users: UsersService,
  circles: CirclesService,
  metadata: MetadataProvider = defaultMetadataProvider,
) => createCatalogService({ repo: createCatalogRepository(db), metadata, users, circles });
