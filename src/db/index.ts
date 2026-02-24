import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Use pooled connection for app queries (PgBouncer in transaction mode)
const client = postgres(process.env.DATABASE_URL, {
  prepare: false, // Avoid prepared statement errors with PgBouncer
})

export const db = drizzle(client)
