import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import config from './config.js';

export const pool = new Pool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    port: config.database.port,

    max: 10, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // return an error after 2 seconds if connection could not be established
    maxLifetimeSeconds: 300, // close client after 5 minutes of use
});

// pool error handling
pool.on("error", (err) => {
    console.error("Unexpected idle client error", err);
});

// query helper
export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};

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