import { Attachment } from '../types/discord';

/**
 * Compresses an image Data URL to fit comfortably within Firestore's 1MB document limit.
 * Resizes max dimension to 1200px and encodes with JPEG at 0.75 quality.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxDimension = 1200,
  quality = 0.75
): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  // If already small (< 400KB), return as is
  if (dataUrl.length < 400 * 1024) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);

      // Return whichever is smaller
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

/**
 * In-memory / session cache for oversized local attachments (videos, PDFs, large media).
 * This allows the uploading user to immediately preview/play their uploaded 18MB video or large PDF
 * without exceeding Firestore's 1MB single-document write limit.
 */
const LOCAL_MEDIA_CACHE = new Map<string, string>();

export function cacheLocalMedia(id: string, url: string) {
  if (id && url) {
    LOCAL_MEDIA_CACHE.set(id, url);
  }
}

export function getLocalMedia(id: string): string | undefined {
  return LOCAL_MEDIA_CACHE.get(id);
}

/**
 * Sanitizes attachments before writing to Firestore so document size never exceeds 1MB limit.
 */
export async function sanitizeAttachmentsForFirestore(
  attachments?: Attachment[]
): Promise<Attachment[]> {
  if (!attachments || attachments.length === 0) return [];

  const sanitized: Attachment[] = [];

  for (const att of attachments) {
    // Cache local media for fast local viewing
    if (att.id && att.url) {
      cacheLocalMedia(att.id, att.url);
    }

    // External URLs (e.g. https://...) are very lightweight
    if (!att.url || !att.url.startsWith('data:')) {
      sanitized.push(att);
      continue;
    }

    if (att.type === 'image') {
      try {
        const compressed = await compressImageDataUrl(att.url);
        if (compressed.length < 750 * 1024) {
          sanitized.push({
            ...att,
            url: compressed
          });
          continue;
        }
      } catch (e) {
        console.warn('Image compression fallback:', e);
      }
    }

    // If attachment is a video, PDF, or file exceeding Firestore document size (> 700 KB)
    if (att.url.length > 700 * 1024) {
      sanitized.push({
        id: att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        url: '', // omit oversized base64 from Firestore document payload
        isSpoiler: att.isSpoiler,
        isOversized: true
      });
    } else {
      sanitized.push(att);
    }
  }

  return sanitized;
}
