import 'dotenv/config';
import mysql from 'mysql2/promise';

let connection;
try {
  const host = process.env.DB_HOST || '127.0.0.1';
  const name = process.env.DB_NAME || 'wcf';
  if (!['127.0.0.1', 'localhost', '::1'].includes(host))
    throw new Error('Perintah ini hanya untuk MySQL lokal. Buat database hosting melalui panel hosting.');
  if (!process.env.DB_USER)
    throw new Error('Isi DB_USER dan DB_PASSWORD MySQL lokal di .env terlebih dahulu.');
  if (!/^[a-zA-Z0-9_]{1,64}$/.test(name))
    throw new Error('Nama database harus berisi huruf, angka, atau underscore (maksimal 64 karakter).');
  connection = await mysql.createConnection({
    host, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD || '',
    connectTimeout: 10000,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`Database lokal ${name} siap. Jalankan npm run db:setup untuk tabel dan migrasi.`);
} catch (error) {
  console.error('Pembuatan database gagal:', error.code || error.message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
