import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import config from '@/config/config.js';

export const pool = new Pool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  port: config.database.port,

  max: config.database.max, // maximum number of clients in the pool
  idleTimeoutMillis: config.database.idleTimeoutMillis, // close idle clients after 30 seconds
  connectionTimeoutMillis: config.database.connectionTimeoutMillis, // return an error after 2 seconds if connection could not be established
  maxLifetimeSeconds: config.database.maxLifetimeSeconds, // close client after 5 minutes of use
});

// pool error handling
pool.on('error', (err) => {
  console.error('Unexpected idle client error', err);
});
