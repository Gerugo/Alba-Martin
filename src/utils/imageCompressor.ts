import { CompressedImageResult } from '../types/catalog';

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_MAX_HEIGHT = 2400;
const DEFAULT_QUALITY = 0.94;

/**
 * Compresses an image file from mobile camera or file input.
 * Resizes proportionally up to maxWidth x maxHeight (default 864x1296)
 * and encodes to image/jpeg at specified quality (default 0.85).
 */
export async function compressImage(
  file: File,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT,
  quality = DEFAULT_QUALITY
): Promise<CompressedImageResult> {
  const originalSizeBytes = file.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate proportional dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D del canvas.'));
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = 'image/jpeg';
      const dataUri = canvas.toDataURL(mimeType, quality);
      const base64Raw = dataUri.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');

      // Calculate base64 payload size in bytes
      const fileSizeBytes = Math.round((base64Raw.length * 3) / 4);

      resolve({
        dataUri,
        base64Raw,
        mimeType,
        fileSizeBytes,
        originalSizeBytes,
        width,
        height,
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Error al decodificar la imagen: ${err}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Convenience helper according to Rule 1: returns lightweight dataUri.
 */
export async function compressImageToDataUri(
  file: File,
  maxWidth = DEFAULT_MAX_WIDTH,
  maxHeight = DEFAULT_MAX_HEIGHT,
  quality = DEFAULT_QUALITY
): Promise<string> {
  const result = await compressImage(file, maxWidth, maxHeight, quality);
  return result.dataUri;
}

/**
 * Format bytes into human-readable string (KB, MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
