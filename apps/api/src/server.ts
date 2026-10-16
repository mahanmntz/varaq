import { buildApp } from "./app";
import { loadConfig } from "./config";
import { createDb } from "./lib/db";
import { createRedisStore } from "./lib/redis";

const config = loadConfig();
const db = createDb();
const store = createRedisStore(config.REDIS_URL);
const { app, circulation } = await buildApp({ config, db, store });

// Flag overdue loans on boot and hourly.
const sweep = () => circulation.markOverdue().catch((err) => app.log.error(err, "overdue sweep failed"));
void sweep();
const timer = setInterval(sweep, 60 * 60 * 1000);

const shutdown = async () => {
  clearInterval(timer);
  await app.close();
  await db.$disconnect();
  await store.quit();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ port: config.API_PORT, host: "0.0.0.0" });
