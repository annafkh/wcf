import { randomBytes, randomUUID } from "node:crypto";
import { readRecord, writeRecord, closeDatabase } from "../src/server/database.mjs";
import { hashPassword } from "../src/server/password.mjs";
const args = process.argv.slice(2);
const email = args
  .find((arg) => arg.startsWith("--email="))
  ?.slice(8)
  ?.trim()
  .toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  console.error(
    "Gunakan: npm run admin:setup -- --email=alamat@email.com [--reset]",
  );
  process.exit(1);
}
if ((await readRecord("admin")) && !args.includes("--reset")) {
  console.error(
    "Akun admin sudah tersedia. Gunakan --reset hanya untuk mengganti kata sandi dan mencabut semua sesi.",
  );
  process.exit(1);
}
const password = randomBytes(18).toString("base64url");
await writeRecord("admin", {
  email,
  role: "admin",
  passwordHash: await hashPassword(password),
  version: randomUUID(),
});
console.log(
  `Akun admin tersimpan di MySQL\nEmail: ${email}\nKata sandi awal: ${password}\nSimpan kata sandi ini di pengelola kata sandi. Login melalui /admin/login, lalu ganti kata sandi melalui dashboard.`,
);

await closeDatabase();
