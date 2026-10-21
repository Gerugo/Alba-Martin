export interface ProcessedImage {
  dataUri: string;
  base64Raw: string;
  blob: Blob;
  fileSizeBytes: number;
  width: number;
  height: number;
}

/**
 * Compresses and scales an uploaded image in-browser to optimal dimensions for VTON
 * Standard fashion ratio: 3:4 (e.g., 768x1024 or 864x1152)
 */
export async function processImageForTryOn(
  file: File,
  maxWidth = 864,
  maxHeight = 1152,
  quality = 0.88
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaling
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto de Canvas 2D'));
          return;
        }

        // Draw with high smoothing quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUri = canvas.toDataURL('image/jpeg', quality);
        const base64Raw = dataUri.split(',')[1] || '';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Fallo al generar Blob de la imagen'));
              return;
            }
            resolve({
              dataUri,
              base64Raw,
              blob,
              fileSizeBytes: blob.size,
              width,
              height,
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen en memoria'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo en el navegador'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a DataURI to a Blob for multipart/form-data or Gradio uploads
 */
export function dataUriToBlob(dataUri: string): Blob {
  const parts = dataUri.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}
