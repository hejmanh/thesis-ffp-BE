import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import config from '@/config/config.js';

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