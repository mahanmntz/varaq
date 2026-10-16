import { Redis } from "ioredis";

export type KeyValueStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Increments a counter, setting its TTL on first use; returns the new value. */
  incr(key: string, ttlSeconds: number): Promise<number>;
};

export function createRedisStore(url: string): KeyValueStore & { quit(): Promise<unknown> } {
  const redis = new Redis(url, { maxRetriesPerRequest: 3 });
  return {
    get: (key) => redis.get(key),
    async set(key, value, ttl) {
      await redis.set(key, value, "EX", ttl);
    },
    async del(key) {
      await redis.del(key);
    },
    async incr(key, ttl) {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, ttl);
      return n;
    },
    quit: () => redis.quit(),
  };
}
