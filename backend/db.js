// src/db.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definido");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon suele necesitar SSL
});

// Neon cierra conexiones idle; sin este handler, el error de un cliente idle
// se vuelve una excepción no capturada y tumba TODO el backend. Lo logueamos y
// dejamos que el pool reponga la conexión en la próxima query.
pool.on("error", (err) => {
  console.error("pg pool idle client error (recuperable):", err.message);
});
