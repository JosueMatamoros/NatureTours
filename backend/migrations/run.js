// node migrations/run.js <archivo.sql>
// Corre una migracion SQL contra la BD (DATABASE_URL del .env).
import { readFileSync } from "fs";
import { pool } from "../db.js";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node migrations/run.js <archivo.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");

try {
  await pool.query(sql);
  console.log(`OK: ${file} aplicado`);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
