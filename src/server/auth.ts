import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { APIContext } from "astro";
import { readRecord } from "./database.mjs";
export { hashPassword, verifyPassword } from "./password.mjs";
export const cookieName = "wcf_admin";
const lifetime = 8 * 60 * 60 * 1000;
interface Session {
  email: string;
  role: "admin";
  csrf: string;
  expires: number;
  credentialVersion: string;
}
const sessions = new Map<string, Session>();
const attempts = new Map<string, { count: number; expires: number }>();
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function credentials(): Promise<{
  email: string;
  passwordHash: string;
  version: string;
  role: "admin";
} | null> {
  return await readRecord("admin");
}
export function constantEqual(a: string, b: string) {
  const first = Buffer.from(a),
    second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}
export async function getSession(
  context: Pick<APIContext, "cookies">,
): Promise<Session | null> {
  const token = context.cookies.get(cookieName)?.value;
  if (!token || token.length !== 64) return null;
  const key = digest(token),
    session = sessions.get(key);
  if (!session) return null;
  if (
    session.expires <= Date.now() ||
    session.credentialVersion !== (await credentials())?.version
  ) {
    sessions.delete(key);
    return null;
  }
  return session;
}
export function createSession(
  context: APIContext,
  account: NonNullable<Awaited<ReturnType<typeof credentials>>>,
) {
  destroySession(context);
  for (const [key, value] of sessions)
    if (value.expires < Date.now()) sessions.delete(key);
  if (sessions.size >= 100) sessions.delete(sessions.keys().next().value!);
  const token = randomBytes(32).toString("hex");
  sessions.set(digest(token), {
    email: account.email,
    role: "admin",
    csrf: randomBytes(32).toString("hex"),
    expires: Date.now() + lifetime,
    credentialVersion: account.version,
  });
  context.cookies.set(cookieName, token, {
    path: "/admin",
    httpOnly: true,
    sameSite: "strict",
    secure: context.url.protocol === "https:",
    maxAge: lifetime / 1000,
  });
}
export function destroySession(context: Pick<APIContext, "cookies">) {
  const token = context.cookies.get(cookieName)?.value;
  if (token) sessions.delete(digest(token));
  context.cookies.delete(cookieName, { path: "/admin" });
}
// Shared account bucket prevents rotating-IP brute force; bounded storage avoids unbounded RAM.
export function loginAllowed() {
  const key = "admin",
    now = Date.now(),
    entry = attempts.get(key);
  if (!entry || entry.expires < now) {
    attempts.set(key, { count: 1, expires: now + 15 * 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}
export function clearLoginAttempts() {
  attempts.clear();
}
export function validOrigin(context: Pick<APIContext, "request" | "url">) {
  const origin = context.request.headers.get("origin");
  return origin === context.url.origin;
}
export async function boundedForm(
  request: Request,
  limit = 6 * 1024 * 1024,
): Promise<FormData> {
  const contentType = request.headers.get("content-type") || "";
  if (
    !/^(multipart\/form-data|application\/x-www-form-urlencoded)(;|$)/i.test(
      contentType,
    )
  )
    throw new Error("Format permintaan tidak didukung.");
  if (Number(request.headers.get("content-length")) > limit)
    throw new Error("Ukuran unggahan terlalu besar. Maksimal gambar 5 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Formulir kosong.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("Ukuran unggahan terlalu besar. Maksimal gambar 5 MB.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Response(new Uint8Array(Buffer.concat(chunks)), {
    headers: { "Content-Type": contentType },
  }).formData();
}
