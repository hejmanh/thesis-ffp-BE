import type { PoolClient } from 'pg';
import { pool } from './index.js';

export type QueryClient = PoolClient | typeof pool;

// query helper
export const execQuery = async (
  client: QueryClient,
  text: string,
  params?: any[],
) => {
  const start = Date.now();

  try {
    return await client.query(text, params);
  } catch (err) {
    console.error('Database query failed', {
      durationMs: Date.now() - start,
      text,
    });

    throw err;
  }
};

export const query = async (text: string, params?: any[]) => {
  return execQuery(pool, text, params);
};
