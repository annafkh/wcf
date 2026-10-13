# Dashboard admin — MySQL

Dashboard `/admin` mengelola mitra, dokumentasi, dan kontak. Aplikasi berjalan pada Node.js; phpMyAdmin mengelola database MySQL.

## Setup

1. Buat database dan pengguna pada panel hosting, atau gunakan MySQL lokal.
2. Isi `.env`: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD. Jangan kirim password melalui chat atau commit ke Git. Environment panel hosting lebih diutamakan.
3. Untuk lokal, jalankan `npm run db:create-local` dengan akun yang memiliki izin CREATE DATABASE. Lalu jalankan `npm run db:setup`. Tabel dibuat bila belum ada. Akun/konten dari `.data/admin.json` dan `.data/content.json` dimigrasikan tanpa menimpa data SQL yang sudah ada. File lama dan password akun tetap dipertahankan.
4. Alternatif: pilih database di phpMyAdmin lalu impor `database/schema.sql`. Jalankan db:setup juga jika perlu migrasi file lama.
5. Bila belum memiliki akun, jalankan `npm run admin:setup -- --email=alamat@email.com`. Password acak ditampilkan di terminal. Gunakan --reset hanya untuk reset yang disengaja.
6. Jalankan `npm run dev`, atau `npm run build` lalu `npm start`.

Gunakan DB_SSL=true jika server membutuhkan TLS dengan sertifikat tepercaya. Tanpa konfigurasi/tabel, halaman dinamis belum dapat digunakan; tidak ada fallback ke file JSON.

## Data dan backup

Tabel InnoDB `wcf_records` berisi record admin (email, role, hash scrypt, versi akun) dan content (mitra, dokumentasi, kontak, urutan, visibilitas, revisi). Payload berupa teks JSON di MySQL, bukan file JSON. Konten awal berasal dari src/data/company.ts hingga penyimpanan pertama. Edit melalui dashboard agar validasi berlaku.

Penyimpanan konten menggunakan transaksi, penguncian baris, dan pemeriksaan revisi. Pool maksimal tiga koneksi dengan parameter query terikat.

Foto tetap tersimpan dalam WCF_DATA_DIR/uploads (default .data/uploads), sementara database menyimpan lokasi dan keterangannya. Folder ini harus persisten di luar public/dist. Backup database melalui phpMyAdmin beserta folder unggahan. Hentikan penulisan saat backup/pemulihan agar data dan gambar konsisten. File JSON lama hanya cadangan migrasi.

## Produksi

Gunakan satu proses Node. Sesi berada di memori, maksimal delapan jam; restart memerlukan login ulang. Akun/konten bertahan dalam MySQL. Proteksi origin, CSRF, cookie HttpOnly/SameSite, pembatasan login, dan noindex tetap berlaku. Atur SITE_URL sebelum build dan gunakan HTTPS.

Deploy dist, dependensi produksi, dan environment. Untuk setup CLI, sertakan scripts, database, serta src/server/*.mjs. Jangan publikasikan .env atau cadangan akun.

## Verifikasi

Build/TypeScript berhasil. Pengujian koneksi dan CRUD MySQL menunggu konfigurasi akses. Harness admin-qa.mjs lama dinonaktifkan karena menargetkan JSON; hasil sebelumnya bukan verifikasi MySQL.
