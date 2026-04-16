import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in .env.local");
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose_cache__:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const globalCache = global.__mongoose_cache__ || {
  conn: null,
  promise: null,
};

global.__mongoose_cache__ = globalCache;

export async function connectDB() {
  if (globalCache.conn) return globalCache.conn;

  if (!globalCache.promise) {
    mongoose.set("strictQuery", true);

    globalCache.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}