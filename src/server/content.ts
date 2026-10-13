import { company, clients, gallery, navigation } from "../data/company";
import { database, readRecord, writeRecord } from "./database.mjs";
import { randomUUID } from "node:crypto";

export interface MediaItem {
  id: string;
  alt: string;
  src: string;
  width: number;
  height: number;
  visible: boolean;
}
export interface Content {
  version: 1;
  revision: string;
  updatedAt: string | null;
  clients: MediaItem[];
  gallery: MediaItem[];
  contacts: {
    address: string;
    email: string;
    phones: string[];
    whatsapp: string;
  };
  showHousing: boolean;
}
export const defaults: Content = {
  version: 1,
  revision: "initial",
  updatedAt: null,
  clients: clients.map((item, i) => ({
    ...item,
    id: `client-${i + 1}`,
    visible: true,
  })),
  gallery: gallery.map((item, i) => ({
    ...item,
    id: `photo-${i + 1}`,
    visible: true,
  })),
  contacts: {
    address: company.address,
    email: company.email,
    phones: company.phones.map((p) => p.label),
    whatsapp: company.whatsapp.split("/").pop()!,
  },
  showHousing: true,
};
export async function getContent(): Promise<Content> {
  const stored = await readRecord("content");
  if (!stored) return structuredClone(defaults);
  if (
    stored.version !== 1 ||
    !Array.isArray(stored.clients) ||
    !Array.isArray(stored.gallery) ||
    !stored.contacts
  )
    throw new Error("Berkas konten tidak valid. Pulihkan dari cadangan.");
  return stored as Content;
}
export async function commitContent(
  expectedRevision: string,
  change: (content: Content) => void,
) {
  const connection = await database().getConnection();
  try {
  await connection.beginTransaction();
  await connection.execute("INSERT IGNORE INTO wcf_records (name, payload) VALUES (?, ?)", ["content", JSON.stringify(defaults)]);
  await connection.execute("SELECT name FROM wcf_records WHERE name = ? FOR UPDATE", ["content"]);
  const content = await readRecord("content", connection) as Content;
  if (content.revision !== expectedRevision)
    throw new Error(
      "Konten telah berubah di tab lain. Muat ulang halaman sebelum menyimpan.",
    );
  change(content);
  content.revision = randomUUID();
  content.updatedAt = new Date().toISOString();
  await writeRecord("content", content, connection);
  await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
export function publicCompany(content: Content) {
  return {
    ...company,
    address: content.contacts.address,
    email: content.contacts.email,
    phones: content.contacts.phones.map((label) => ({
      label,
      href: `tel:+${normalizePhone(label)}`,
    })),
    whatsapp: `https://wa.me/${content.contacts.whatsapp}`,
  };
}
export function publicNavigation(content: Content) {
  return navigation
    .filter(
      (item) =>
        item.href !== "#klien" ||
        content.showHousing ||
        content.clients.some((i) => i.visible),
    )
    .filter(
      (item) =>
        item.href !== "#dokumentasi" || content.gallery.some((i) => i.visible),
    );
}
export function normalizePhone(value: string) {
  let digits = value.replace(/[\s()+-]/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (!/^\d{8,15}$/.test(digits))
    throw new Error("Nomor telepon harus berisi 8–15 digit.");
  return digits;
}
export function textField(form: FormData, name: string, max = 180) {
  const value = form.get(name);
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new Error(`Isian ${name} wajib diisi (maksimal ${max} karakter).`);
  return value.trim();
}
