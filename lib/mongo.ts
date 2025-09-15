// lib/mongo.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "quiet_hours_prod";

if (!MONGODB_URI) {
  throw new Error("No MONGODB_URI in found");
}

interface MongoCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongoCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectMongo() {
  if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
  }

  // At this point, cached is guaranteed to be defined
  const cache = cached!;

  if (cache.conn) {
    // Check if connection is still alive
    try {
      await cache.conn.connection.db.admin().ping();
      return cache.conn;
    } catch (error) {
      console.log("MongoDB connection lost, reconnecting...");
      cache.conn = null;
      cache.promise = null;
    }
  }

  if (!cache.promise) {
    // Determine if this is a local or remote MongoDB connection
    const isLocalMongoDB =
      MONGODB_URI.startsWith("mongodb://localhost") ||
      MONGODB_URI.startsWith("mongodb://127.0.0.1");

    const connectionOptions = {
      dbName: MONGODB_DB_NAME,
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    // Only add SSL options for remote connections (MongoDB Atlas)
    if (!isLocalMongoDB) {
      Object.assign(connectionOptions, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        retryWrites: true,
        w: "majority",
      });
    }

    cache.promise = mongoose
      .connect(MONGODB_URI, connectionOptions)
      .then((mongoose) => {
        cache.conn = mongoose;
        return mongoose;
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
