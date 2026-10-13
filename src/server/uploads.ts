import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { uploadRoot } from "./files.mjs";
sharp.concurrency(1);
sharp.cache({ memory: 16, files: 0, items: 20 });
let processing = false;
export async function saveImage(file: File, kind: "clients" | "gallery") {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Ukuran gambar maksimal 5 MB.");
  if (processing)
    throw new Error("Gambar lain sedang diproses. Coba kembali sesaat lagi.");
  processing = true;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const jpeg = input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff;
    const png = input
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      input.toString("ascii", 0, 4) === "RIFF" &&
      input.toString("ascii", 8, 12) === "WEBP";
    if (!jpeg && !png && !webp)
      throw new Error("Gunakan gambar JPEG, PNG, atau WebP yang valid.");
    const pipeline = sharp(input, {
      limitInputPixels: 12_000_000,
      failOn: "error",
    });
    const metadata = await pipeline.metadata();
    if ((metadata.pages || 1) > 1)
      throw new Error("Gunakan gambar statis, bukan animasi.");
    const max = kind === "clients" ? 600 : 1600;
    const { data, info } = await pipeline
      .rotate()
      .resize(max, max, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const filename = `${randomUUID()}.webp`;
    await mkdir(uploadRoot, { recursive: true, mode: 0o700 });
    await writeFile(join(uploadRoot, filename), data, {
      flag: "wx",
      mode: 0o600,
    });
    return {
      src: `/media/${filename}`,
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    if (error instanceof Error && /maksimal|Gunakan/.test(error.message))
      throw error;
    throw new Error("Gambar tidak dapat dibaca atau melebihi 12 megapiksel.");
  } finally {
    processing = false;
  }
}
export async function removeUpload(src: string) {
  if (!/^\/media\/[a-f0-9-]{36}\.webp$/.test(src)) return;
  try {
    await unlink(join(uploadRoot, src.slice(7)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      console.error("Gagal membersihkan gambar lama.");
  }
}
