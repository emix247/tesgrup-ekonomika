import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);

const globalForDb = globalThis as unknown as { _db: ReturnType<typeof drizzle> };

function createDb() {
  return drizzle(sql, { schema });
}

export const db = globalForDb._db || createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb._db = db;
}
