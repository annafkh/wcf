import 'dotenv/config';
import mysql from 'mysql2/promise';

let pool;
export function database() {
  if (!pool) {
    for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER']) {
      if (!process.env[key]) throw new Error(`Konfigurasi ${key} belum diisi di .env.`);
    }
    pool = mysql.createPool({
      host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER, password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME, charset: 'utf8mb4',
      connectionLimit: 3, queueLimit: 30, connectTimeout: 10000,
      ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
    });
  }
  return pool;
}
export async function closeDatabase() { if (pool) { await pool.end(); pool = undefined; } }
export async function readRecord(name, connection = database()) {
  const [rows] = await connection.execute('SELECT payload FROM wcf_records WHERE name = ?', [name]);
  return rows.length ? JSON.parse(rows[0].payload) : null;
}
export async function writeRecord(name, value, connection = database()) {
  await connection.execute('INSERT INTO wcf_records (name, payload) VALUES (?, ?) ON DUPLICATE KEY UPDATE payload = VALUES(payload)', [name, JSON.stringify(value)]);
}
