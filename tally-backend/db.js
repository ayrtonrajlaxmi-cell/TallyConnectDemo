import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

// Resolve __dirname (ESM safe)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env explicitly
dotenv.config({
  path: path.join(__dirname, ".env")
});

// 🔍 TEMP LOG (remove later)
console.log("DB CONFIG:", {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  passwordExists: !!process.env.DB_PASS
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASS), // ✅ FORCE STRING
  port: Number(process.env.DB_PORT)
});

export default pool;
