import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Local filesystem storage for the prototype — doesn't survive a Vercel
// deploy (ephemeral filesystem). See ../../ROADMAP.md.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Saves image files to public/uploads, returning their public URLs. Rejects anything that isn't a recognized image type. */
export async function savePhotos(files: File[]): Promise<string[]> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) continue;
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    urls.push(`/uploads/${filename}`);
  }
  return urls;
}
