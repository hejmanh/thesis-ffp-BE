import { pool } from '@/database/index.js';

export const checkDBConnection = async () => {
  await pool.query('SELECT 1');
  console.log('Database connected');
};
