import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_ACCESS_EXPIRATION = "15m";
process.env.JWT_REFRESH_EXPIRATION = "7d";

// Module-level singleton — shared across all test suites in the same worker
let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
