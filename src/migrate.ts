/**
 * src/migrate.ts
 *
 * Standalone migration runner. Reads all *.sql files from db/migrations/,
 * compares them against the schema_migrations tracking table, and applies
 * any pending files in alphabetical order — each inside its own transaction.
 *
 * Usage (local):
 *   npm run migrate
 */

import 'dotenv/config';
import { Client } from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Works for both:
//   src/migrate.ts  → __dirname = <root>/src  → go up one level
//   dist/migrate.js → __dirname = <root>/dist → go up one level
const MIGRATIONS_DIR = join(__dirname, '..', 'db', 'migrations');

async function migrate(): Promise<void> {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_DATABASE ?? 'ffp',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await client.connect();
  console.log('[migrate] Connected to database');

  try {
    // ── 1. Ensure tracking table exists ─────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version     TEXT        PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── 2. Fetch already-applied versions ───────────────────────────────────
    const { rows } = await client.query<{ version: string }>(
      'SELECT version FROM schema_migrations ORDER BY version',
    );
    const applied = new Set(rows.map((r) => r.version));

    // ── 3. Resolve all migration files ──────────────────────────────────────
    const allFiles = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort(); // lexicographic sort keeps 001_, 002_, 003_ in order

    // ── 4. Baseline: if schema_migrations is empty but tables already exist,
    //       the DB was provisioned outside the runner (e.g. manual psql, a
    //       previous initdb mount, or a persisted Docker volume).
    //       Stamp every file as applied so we don't re-run them.
    if (applied.size === 0) {
      const { rows: tableRows } = await client.query<{ exists: boolean }>(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'user_account'
        ) AS exists;
      `);
      if (tableRows[0]?.exists) {
        console.log(
          '[migrate] Existing database detected — stamping all migrations as applied.',
        );
        for (const file of allFiles) {
          await client.query(
            'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING',
            [file],
          );
        }
        console.log('[migrate] Done — schema is up to date.');
        return;
      }
    }

    const pending = allFiles.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('[migrate] No pending migrations — schema is up to date.');
      return;
    }

    console.log(`[migrate] ${pending.length} pending migration(s):`);
    pending.forEach((f) => console.log(`  • ${f}`));

    // ── 4. Apply each pending migration in its own transaction ──────────────
    for (const file of pending) {
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');

      console.log(`[migrate] Applying ${file} …`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        console.log(`[migrate] ✓ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrate] ✗ ${file} failed — rolled back`);
        throw err;
      }
    }

    console.log(`[migrate] Done — ${pending.length} migration(s) applied.`);
  } finally {
    await client.end();
  }
}

migrate().catch((err: unknown) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
