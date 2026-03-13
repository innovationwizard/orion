import imageCompression from "browser-image-compression";
import { createReservasClient } from "@/lib/supabase/client";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

/**
 * Compress and upload an image to Supabase Storage.
 *
 * @param file - Raw File from camera/file input
 * @param bucket - Storage bucket: 'receipts' or 'dpi'
 * @param salespersonId - Used to namespace uploads: {bucket}/{salespersonId}/{timestamp}.jpg
 * @returns Public URL of the uploaded image
 * @throws Error if compression or upload fails
 */
export async function uploadImage(
  file: File,
  bucket: "receipts" | "dpi",
  salespersonId: string,
): Promise<string> {
  // 1. Compress
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

  // 2. Build path
  const timestamp = Date.now();
  const path = `${salespersonId}/${timestamp}.jpg`;

  // 3. Upload via authenticated client (user's session token)
  const supabase = createReservasClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new Error(`Error al subir imagen: ${error.message}`);
  }

  // 4. Verify file was actually persisted by requesting a signed URL
  const { error: verifyError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60);

  if (verifyError) {
    throw new Error(`Imagen subida pero no accesible. Reintente: ${verifyError.message}`);
  }

  // 5. Get public URL (used as the stored reference)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}
