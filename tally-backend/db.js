import pkg from "pg";
const { Pool } = pkg;

let pool;

if (process.env.DATABASE_URL) {
  // ✅ Render / Production
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log("✅ Using DATABASE_URL (Render / Production)");
} else {
  // ✅ Local development fallback
  pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
  });

  console.log("✅ Using DB_* variables (Local)");
}

export default pool;
