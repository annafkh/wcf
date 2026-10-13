import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import {
  boundedForm,
  constantEqual,
  credentials,
  destroySession,
  getSession,
  hashPassword,
  validOrigin,
  verifyPassword,
} from "../../server/auth";
import {
  commitContent,
  getContent,
  normalizePhone,
  textField,
} from "../../server/content";
import { removeUpload, saveImage } from "../../server/uploads";
import { writeRecord } from "../../server/database.mjs";

export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session || session.role !== "admin")
    return context.redirect("/admin/login", 303);
  if (!validOrigin(context))
    return new Response("Permintaan ditolak.", { status: 403 });
  let tab = "clients";
  let uploaded: Awaited<ReturnType<typeof saveImage>> | undefined;
  try {
    const form = await boundedForm(context.request);
    if (!constantEqual(String(form.get("csrf") || ""), session.csrf))
      return new Response("Sesi formulir tidak valid. Muat ulang halaman.", {
        status: 403,
      });
    const operation = textField(form, "operation", 30);
    tab = ["clients", "gallery", "contacts", "account"].includes(
      String(form.get("tab")),
    )
      ? String(form.get("tab"))
      : "clients";
    if (operation === "logout") {
      destroySession(context);
      return context.redirect("/admin/login", 303);
    }
    if (operation === "password") {
      tab = "account";
      const current = String(form.get("currentPassword") || ""),
        next = String(form.get("newPassword") || "");
      if (current.length > 256 || next.length > 256)
        throw new Error("Kata sandi maksimal 256 karakter.");
      const account = await credentials();
      if (!account || !(await verifyPassword(current, account.passwordHash)))
        throw new Error("Kata sandi saat ini tidak sesuai.");
      if (next.length < 12)
        throw new Error("Kata sandi baru minimal 12 karakter.");
      if (next !== String(form.get("confirmPassword")))
        throw new Error("Konfirmasi kata sandi tidak sama.");
      await writeRecord("admin", {
        ...account,
        passwordHash: await hashPassword(next),
        version: randomUUID(),
      });
      destroySession(context);
      return context.redirect("/admin/login?changed=1", 303);
    }
    const revision = textField(form, "revision", 80);
    if (operation === "contacts") {
      tab = "contacts";
      const email = textField(form, "email", 254),
        address = textField(form, "address", 500);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Alamat email tidak valid.");
      const phones = textField(form, "phones", 250)
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (phones.length > 6) throw new Error("Maksimal 6 nomor telepon.");
      phones.forEach(normalizePhone);
      const whatsapp = normalizePhone(textField(form, "whatsapp", 30));
      await commitContent(revision, (content) => {
        content.contacts = { address, email, phones, whatsapp };
      });
    } else if (operation === "housing") {
      await commitContent(revision, (content) => {
        content.showHousing = form.get("visible") === "on";
      });
    } else {
      if (tab !== "clients" && tab !== "gallery")
        throw new Error("Bagian konten tidak valid.");
      const kind = tab;
      const id =
        typeof form.get("id") === "string" ? String(form.get("id")) : "";
      let oldSrc: string | undefined;
      if (operation === "save") {
        const alt = textField(form, "alt");
        const file = form.get("image");
        if (file instanceof File && file.size > 0)
          uploaded = await saveImage(file, kind);
        await commitContent(revision, (content) => {
          const list = content[kind],
            existing = list.find((item) => item.id === id);
          if (id && !existing) throw new Error("Konten tidak ditemukan.");
          if (existing) {
            existing.alt = alt;
            existing.visible = form.get("visible") === "on";
            if (uploaded) {
              oldSrc = existing.src;
              Object.assign(existing, uploaded);
            }
          } else {
            if (!uploaded) throw new Error("Pilih gambar untuk konten baru.");
            if (list.length >= 100)
              throw new Error(
                "Maksimal 100 entri per bagian. Hapus konten lama sebelum menambah.",
              );
            list.push({
              id: randomUUID(),
              alt,
              ...uploaded,
              visible: form.get("visible") === "on",
            });
          }
        });
        uploaded = undefined;
      } else if (
        operation === "delete" ||
        operation === "up" ||
        operation === "down"
      ) {
        await commitContent(revision, (content) => {
          const list = content[kind],
            index = list.findIndex((item) => item.id === id);
          if (index < 0) throw new Error("Konten tidak ditemukan.");
          if (operation === "delete") {
            oldSrc = list[index].src;
            list.splice(index, 1);
          } else {
            const target = index + (operation === "up" ? -1 : 1);
            if (target >= 0 && target < list.length)
              [list[index], list[target]] = [list[target], list[index]];
          }
        });
      } else throw new Error("Tindakan tidak valid.");
      if (
        oldSrc &&
        ![...(await getContent()).clients, ...(await getContent()).gallery].some(
          (item) => item.src === oldSrc,
        )
      )
        await removeUpload(oldSrc);
    }
    return context.redirect(`/admin?tab=${tab}&saved=1`, 303);
  } catch (error) {
    if (uploaded) await removeUpload(uploaded.src);
    const message =
      error instanceof Error && !("code" in error)
        ? error.message
        : "Perubahan belum tersimpan. Periksa izin penyimpanan server lalu coba lagi.";
    return context.redirect(
      `/admin?tab=${tab}&error=${encodeURIComponent(message.slice(0, 220))}`,
      303,
    );
  }
};
