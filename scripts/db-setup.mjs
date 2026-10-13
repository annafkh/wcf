import { readFile } from 'node:fs/promises';
import { database, closeDatabase, readRecord, writeRecord } from '../src/server/database.mjs';
import { readJson } from '../src/server/files.mjs';

try {
  await database().query(await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'));
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    // Existing SQL data always wins; legacy files remain untouched for recovery.
    for (const name of ['admin', 'content']) {
      const legacy = readJson(`${name}.json`);
      if (legacy && !(await readRecord(name, connection))) {
        await connection.execute('INSERT IGNORE INTO wcf_records (name, payload) VALUES (?, ?)', [name, JSON.stringify(legacy)]);
        console.log(`Migrasi ${name} selesai; berkas lama dipertahankan.`);
      }
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  console.log('Tabel MySQL siap. Data yang sudah ada tidak ditimpa.');
} catch (error) {
  console.error('Setup MySQL gagal:', error.code || 'Periksa konfigurasi .env dan akses database.');
  process.exitCode = 1;
} finally { await closeDatabase(); }
