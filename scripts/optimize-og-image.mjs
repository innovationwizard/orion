#!/usr/bin/env node
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const input = join(root, "public", "og-image.png");
const output = join(root, "public", "og-image.png");

if (!existsSync(input)) {
  console.error("og-image.png not found in public/");
  process.exit(1);
}

const targetBytes = 280 * 1024; // 280 KB to stay safely under 300 KB
const width = 1200;
const height = 630;

let buffer = await sharp(input)
  .resize(width, height, { fit: "cover" })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();

// If still over 300KB, try JPEG which is much smaller for typical OG graphics
if (buffer.length > targetBytes) {
  buffer = await sharp(input)
    .resize(width, height, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const jpegPath = join(root, "public", "og-image.jpg");
  await sharp(buffer).toFile(jpegPath);
  console.log(`Written ${(buffer.length / 1024).toFixed(1)} KB → public/og-image.jpg (use this for OG under 300KB)`);
  process.exit(0);
}

await sharp(buffer).toFile(output);
console.log(`Written ${(buffer.length / 1024).toFixed(1)} KB → public/og-image.png`);
