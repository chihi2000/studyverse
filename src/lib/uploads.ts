import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Runtime-only location; the turbopackIgnore hints keep Next from tracing the whole project into the build.
const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "./uploads");
const filePath = (key: string) => path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, key);
const MAX_BYTES = 8 * 1024 * 1024;

// Accepted types, identified by their leading bytes rather than the browser-provided MIME type.
const TYPES = [
  { ext: "jpg", mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  { ext: "png", mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { ext: "webp", mime: "image/webp", magic: [0x52, 0x49, 0x46, 0x46], offset8: [0x57, 0x45, 0x42, 0x50] },
  { ext: "pdf", mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] },
] as const;

const KEY_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/;

export class UploadError extends Error {}

function detect(bytes: Uint8Array) {
  const matches = (sig: readonly number[], at = 0) => sig.every((b, i) => bytes[at + i] === b);
  return TYPES.find((t) => matches(t.magic) && (!("offset8" in t) || matches(t.offset8, 8)));
}

/** Saves an uploaded file and returns its storage key. */
export async function saveUpload(file: File) {
  if (file.size === 0) throw new UploadError("Fichier vide.");
  if (file.size > MAX_BYTES) throw new UploadError("Fichier trop lourd (8 Mo maximum).");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detect(bytes);
  if (!type) throw new UploadError("Format non accepté : JPG, PNG, WebP ou PDF.");

  const key = `${randomUUID()}.${type.ext}`;
  await mkdir(/*turbopackIgnore: true*/ UPLOAD_DIR, { recursive: true });
  await writeFile(filePath(key), bytes);
  return key;
}

/** Reads a stored file, or returns null for unknown or malformed keys. */
export async function readUpload(key: string) {
  if (!KEY_PATTERN.test(key)) return null;
  const ext = key.split(".").pop();
  const type = TYPES.find((t) => t.ext === ext)!;
  try {
    return { bytes: await readFile(filePath(key)), mime: type.mime };
  } catch {
    return null;
  }
}
