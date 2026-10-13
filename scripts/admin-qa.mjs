// Legacy JSON integration harness: disabled after MySQL migration.
throw new Error("This harness targets JSON storage. Use an isolated MySQL test database before adapting/running it.");
// Integration test against a separately started production server using an EMPTY,
// disposable WCF_DATA_DIR. Never point this test at a real site's storage.
import assert from "node:assert/strict";
import { readFile, mkdir, readdir } from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
import { resolve, join } from "node:path";
import { readJson, writeJson, dataRoot } from "../src/server/files.mjs";
import { hashPassword } from "../src/server/password.mjs";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4322";
assert.equal(new URL(base).hostname, "127.0.0.1", "Use a local test server.");
assert.ok(
  process.env.WCF_DATA_DIR && dataRoot.includes("qa-results"),
  "Use a disposable directory inside qa-results.",
);
assert.equal(
  readJson("admin.json"),
  null,
  "Test directory must not contain an existing admin.",
);
const password = randomBytes(24).toString("base64url");
const email = "qa-admin@example.test";
writeJson("admin.json", {
  email,
  role: "admin",
  passwordHash: await hashPassword(password),
  version: randomUUID(),
});
const jar = new Map();
async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    redirect: "manual",
    headers: {
      Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
      ...(options.method === "POST" ? { Origin: base } : {}),
      ...options.headers,
    },
  });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";")[0],
      eq = pair.indexOf("=");
    jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  return response;
}
function hidden(html, name) {
  const match = html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`));
  assert.ok(match, `Missing ${name}`);
  return match[1];
}
async function login(pass = password) {
  const page = await (await request("/admin/login")).text();
  return request("/admin/login", {
    method: "POST",
    body: new URLSearchParams({
      email,
      password: pass,
      csrf: hidden(page, "csrf"),
    }),
  });
}
async function fields(tab = "clients") {
  const response = await request(`/admin?tab=${tab}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.match(response.headers.get("x-robots-tag"), /noindex/);
  const html = await response.text();
  return {
    csrf: hidden(html, "csrf"),
    revision: hidden(html, "revision"),
    tab,
  };
}
async function action(values, image) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  if (image)
    form.set(
      "image",
      new File([image.bytes], image.name, { type: image.type }),
    );
  return request("/admin/action", { method: "POST", body: form });
}
function saved(response) {
  assert.equal(response.status, 303);
  assert.match(response.headers.get("location"), /saved=1/);
}
const results = [];
assert.equal((await request("/admin")).status, 302);
assert.equal((await action({ operation: "contacts" })).status, 303);
assert.equal(
  (await request("/admin/login")).headers.get("x-frame-options"),
  "DENY",
);
assert.equal((await request("/.data/admin.json")).status, 404);
results.push(
  "Protected dashboard, actions, credentials, and no-cache/noindex headers",
);
const bad = await login("incorrect-password");
assert.equal(bad.status, 200);
assert.match(await bad.text(), /tidak sesuai/);
const logged = await login();
assert.equal(logged.status, 303);
assert.ok(jar.get("wcf_admin"));
assert.match(logged.headers.getSetCookie().join(";"), /HttpOnly/i);
const first = await fields();
assert.equal(
  (await action({ ...first, operation: "housing", csrf: "tampered" })).status,
  403,
);
assert.equal(
  (
    await request("/admin/action", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
      body: new URLSearchParams({ ...first, operation: "housing" }),
    })
  ).status,
  403,
);
results.push(
  "Password login, HttpOnly session, CSRF and cross-origin rejection",
);
const photo = await readFile("public/images/gallery/perawatan-lantai.webp");
saved(
  await action(
    { ...first, operation: "save", alt: "QA Partner", visible: "on" },
    { bytes: photo, name: "logo.webp", type: "image/webp" },
  ),
);
let content = readJson("content.json");
const partner = content.clients.at(-1);
assert.equal(partner.alt, "QA Partner");
assert.match(partner.src, /^\/media\/[a-f0-9-]+\.webp$/);
assert.match(await (await request("/")).text(), /QA Partner/);
assert.equal(
  (await request(partner.src)).headers.get("content-type"),
  "image/webp",
);
const stale = await action({
  ...first,
  operation: "save",
  id: partner.id,
  alt: "Stale name",
  visible: "on",
});
assert.match(stale.headers.get("location"), /error=/);
assert.equal(readJson("content.json").clients.at(-1).alt, "QA Partner");
saved(
  await action({
    ...(await fields()),
    operation: "save",
    id: partner.id,
    alt: "Hidden QA Partner",
  }),
);
assert.doesNotMatch(await (await request("/")).text(), /Hidden QA Partner/);
saved(
  await action({
    ...(await fields()),
    operation: "save",
    id: partner.id,
    alt: "QA Partner",
    visible: "on",
  }),
);
saved(await action({ ...(await fields()), operation: "up", id: partner.id }));
assert.equal(readJson("content.json").clients.at(-2).id, partner.id);
const beforeInvalid = readJson("content.json").revision;
assert.match(
  (
    await action(
      { ...(await fields()), operation: "save", alt: "Invalid", visible: "on" },
      {
        bytes: Buffer.from('<svg onload="alert(1)"/>'),
        name: "fake.png",
        type: "image/png",
      },
    )
  ).headers.get("location"),
  /error=/,
);
assert.equal(readJson("content.json").revision, beforeInvalid);
results.push(
  "Upload, public rendering, hide/show, ordering, conflict detection, and invalid image rejection",
);
saved(
  await action(
    {
      ...(await fields("gallery")),
      operation: "save",
      alt: "QA Documentation",
      visible: "on",
    },
    { bytes: photo, name: "photo.webp", type: "image/webp" },
  ),
);
const galleryItem = readJson("content.json").gallery.at(-1);
assert.match(await (await request("/")).text(), /QA Documentation/);
saved(
  await action({
    ...(await fields("gallery")),
    operation: "save",
    id: galleryItem.id,
    alt: "Updated QA Documentation",
    visible: "on",
  }),
);
assert.match(await (await request("/")).text(), /Updated QA Documentation/);
saved(
  await action({
    ...(await fields("gallery")),
    operation: "delete",
    id: galleryItem.id,
  }),
);
assert.equal((await request(galleryItem.src)).status, 404);
saved(
  await action({ ...(await fields()), operation: "delete", id: partner.id }),
);
assert.equal((await request(partner.src)).status, 404);
assert.equal((await request("/images/clients/inez.webp")).status, 200);
results.push(
  "Gallery CRUD and uploaded-file cleanup without deleting original assets",
);
saved(
  await action({
    ...(await fields("contacts")),
    operation: "contacts",
    email: "contact@example.test",
    address: "Alamat QA Malang",
    phones: "081234567890\n085678901234",
    whatsapp: "081234567890",
  }),
);
const homepage = await (await request("/")).text();
assert.match(homepage, /contact@example.test/);
assert.match(homepage, /Alamat QA Malang/);
assert.match(homepage, /wa.me\/6281234567890/);
assert.match(homepage, /tel:\+6281234567890/);
const invalidContacts = await action({
  ...(await fields("contacts")),
  operation: "contacts",
  email: "not-email",
  address: "Address",
  phones: "nope",
  whatsapp: "javascript:alert(1)",
});
assert.match(invalidContacts.headers.get("location"), /error=/);
assert.equal(readJson("content.json").contacts.email, "contact@example.test");
results.push(
  "Contact updates reach page, footer, CTA links, and structured data; invalid fields rejected",
);
const sessionCookie = jar.get("wcf_admin");
saved(await action({ ...(await fields()), operation: "housing" }));
assert.doesNotMatch(await (await request("/")).text(), /Kos-kosan/);
const logout = await action({
  csrf: (await fields()).csrf,
  operation: "logout",
});
assert.equal(logout.status, 303);
jar.set("wcf_admin", sessionCookie);
assert.equal((await request("/admin")).status, 302);
await login();
const active = await fields();
const newPassword = randomBytes(20).toString("base64url");
const changed = await action({
  csrf: active.csrf,
  operation: "password",
  currentPassword: password,
  newPassword,
  confirmPassword: newPassword,
});
assert.equal(changed.status, 303);
assert.match(changed.headers.get("location"), /changed=1/);
assert.equal((await request("/admin")).status, 302);
assert.equal((await login(newPassword)).status, 303);
results.push(
  "Logout revokes session; password change invalidates sessions and accepts new password",
);
// Short-lived browser fixture for isolated UI QA, never printed or used in production.
writeJson("qa-fixture.json", { email, password: newPassword });
await mkdir("qa-results", { recursive: true });
await import("node:fs/promises").then((fs) =>
  fs.writeFile(
    "qa-results/admin-integration.json",
    JSON.stringify({ passed: true, results }, null, 2),
  ),
);
console.log(JSON.stringify({ passed: true, checks: results }, null, 2));
