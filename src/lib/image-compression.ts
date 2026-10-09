/**
 * Client-Side Image Compression & Auto-Cropping Utility
 * Converts high-resolution phone selfies / camera captures into optimized 400x400 WebP avatars (< 40 KB).
 */

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Compresses and center-crops an image file to a 400x400 square WebP
 */
export async function compressAndCropAvatar(
  fileOrBlob: File | Blob,
  targetSize = 400,
  quality = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(fileOrBlob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const { naturalWidth, naturalHeight } = img;
        if (!naturalWidth || !naturalHeight) {
          throw new Error("Unable to read image dimensions");
        }

        // Calculate center square crop
        const cropDimension = Math.min(naturalWidth, naturalHeight);
        const sourceX = (naturalWidth - cropDimension) / 2;
        // Bias slightly upwards (0.42 instead of 0.5) to capture head/face perfectly
        const sourceY = Math.max(0, (naturalHeight - cropDimension) * 0.42);

        // Off-screen canvas
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx) {
          throw new Error("Canvas 2D context not available");
        }

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw cropped & scaled square
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          cropDimension,
          cropDimension,
          0,
          0,
          targetSize,
          targetSize
        );

        // Export as WebP first, fallback to JPEG
        const tryExport = (mimeType: string) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const dataUrl = canvas.toDataURL(mimeType, quality);
                resolve({
                  blob,
                  dataUrl,
                  width: targetSize,
                  height: targetSize,
                  sizeBytes: blob.size,
                });
              } else if (mimeType === "image/webp") {
                // Fallback to JPEG
                tryExport("image/jpeg");
              } else {
                reject(new Error("Failed to generate image blob"));
              }
            },
            mimeType,
            quality
          );
        };

        tryExport("image/webp");
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = objectUrl;
  });
}

/**
 * Formats bytes to human-readable string (e.g. "32.4 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
