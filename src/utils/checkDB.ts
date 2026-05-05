import { pool } from "@/database/index.js";

export const checkDBConnection = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed", err);
    throw err;
  }
};