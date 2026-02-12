import imageCompression from 'browser-image-compression';

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  const options = {
    maxSizeMB: 3.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const compressedSize = compressedFile.size;

    if (compressedSize > originalSize) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 0,
      };
    }

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio: (1 - compressedSize / originalSize) * 100,
    };
  } catch {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 0,
    };
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File phải là ảnh (JPG, PNG, WebP).' };
  }

  const MAX_RAW_SIZE = 30 * 1024 * 1024;
  if (file.size > MAX_RAW_SIZE) {
    return {
      valid: false,
      error: `File quá lớn. Tối đa 30MB. File này: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  return { valid: true };
}
