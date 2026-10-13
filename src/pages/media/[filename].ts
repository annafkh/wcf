import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { uploadRoot } from "../../server/files.mjs";
export const GET: APIRoute = async ({ params }) => {
  if (!/^[a-f0-9-]{36}\.webp$/.test(params.filename || ""))
    return new Response("Tidak ditemukan", { status: 404 });
  try {
    const data = await readFile(join(uploadRoot, params.filename!));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }
};
