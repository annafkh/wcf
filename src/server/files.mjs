import "dotenv/config";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  openSync,
  fsyncSync,
  closeSync,
  unlinkSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { randomUUID } from "node:crypto";

export const dataRoot = resolve(process.env.WCF_DATA_DIR || ".data");
export const uploadRoot = join(dataRoot, "uploads");
export function readJson(name) {
  try {
    return JSON.parse(readFileSync(join(dataRoot, name), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
// Synchronous, atomic commits: no interleaved read/write transactions in one Node process.
export function writeJson(name, value) {
  mkdirSync(dataRoot, { recursive: true, mode: 0o700 });
  const temporary = join(dataRoot, `${name}.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, JSON.stringify(value, null, 2), { mode: 0o600 });
    const handle = openSync(temporary, "r+");
    try {
      fsyncSync(handle);
    } finally {
      closeSync(handle);
    }
    renameSync(temporary, join(dataRoot, name));
  } catch (error) {
    try {
      unlinkSync(temporary);
    } catch {}
    throw error;
  }
}
