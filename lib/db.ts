import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Connection pool tuned for high concurrency (1000s of orders)
      maxPoolSize: 20,          // max 20 simultaneous connections
      minPoolSize: 5,           // keep 5 warm connections ready
      serverSelectionTimeoutMS: 10000, // fail fast if server is unreachable
      socketTimeoutMS: 45000,   // close sockets idle for 45s
      connectTimeoutMS: 10000,  // initial connection timeout
      heartbeatFrequencyMS: 10000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next call
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
