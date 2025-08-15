import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// PostgreSQL configuration with Drizzle ORM
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

// Create PostgreSQL connection
const client = postgres(connectionString);

// Create Drizzle database instance
export const db = drizzle(client);

export default db;