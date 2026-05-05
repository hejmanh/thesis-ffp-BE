import { pool } from './index.js';
import type { PoolClient } from 'pg';

// transaction helper
export const withTransaction = async <T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const result = await callback(client);

        await client.query("COMMIT");
        return result;
    } catch (err) {
        // rollback might fail if connection already dead
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            console.error("ROLLBACK failed:", rollbackError);
        }

        throw err;
    } finally {
        client.release();
  }
};