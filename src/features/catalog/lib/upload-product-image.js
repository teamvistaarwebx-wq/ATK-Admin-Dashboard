import { MAX_IMAGE_BYTES, MAX_IMAGE_MB } from "@/constants/media";

/**
 * Uploads one product photo straight to Cloudflare R2 and returns its public
 * URL. Browser-only.
 *
 * The bytes never pass through our server: we ask an authenticated route for a
 * one-shot signed URL, then PUT the file to R2 from here. A server action would
 * cap the request body at 1MB, and raising that would still stream every photo
 * through the Next process.
 *
 * Shared by the product drawer's photo picker and the CSV import.
 */
export async function uploadProductImage(file) {
  // Checked here as well as on the server: a presigned PUT cannot enforce a
  // size, so stopping it before the upload starts is the only way the person
  // finds out before waiting for it.
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`"${file.name}" is over ${MAX_IMAGE_MB}MB.`);
  }

  const signed = await fetch("/api/uploads/product-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });

  const payload = await signed.json().catch(() => ({}));
  if (!signed.ok)
    throw new Error(payload.error ?? "Could not start the upload");

  if (payload.data?.demo) return shrinkToDataUrl(file);

  const { uploadUrl, publicUrl } = payload.data;

  // The Content-Type is part of the signature — send anything else and R2
  // rejects it. A failure here with no status is almost always the bucket's
  // CORS policy, not the credentials.
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!put.ok) throw new Error(`Upload failed (${put.status})`);

  return publicUrl;
}

/** Demo mode keeps photos in the database, so keep them small: 800px JPEG. */
const DEMO_MAX_SIDE = 800;

async function shrinkToDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    DEMO_MAX_SIDE / Math.max(bitmap.width, bitmap.height)
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
