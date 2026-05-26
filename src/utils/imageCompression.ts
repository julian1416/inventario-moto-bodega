/**
 * Compresses an image file or base64 data url using standard canvas rescaling.
 * This guarantees the PWA remains fast, offline-capable, and avoids memory clogging on the iPhone 15.
 */
export function compressImage(
  fileOrBase64: File | string,
  maxWidth = 480,
  maxHeight = 480,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while preserving aspect ratio
      let width = img.width;
      let height = img.height;
      
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
        // Fallback to original if canvas context failed
        resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
        return;
      }
      
      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress and convert to base64 jpeg
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = (err) => {
      reject(err);
    };

    if (fileOrBase64 instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error("No se pudo leer el archivo."));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    } else {
      img.src = fileOrBase64;
    }
  });
}

/**
 * Returns a high-quality illustrative Unsplash fallback picture for each category
 * so that every item looks premium even if the user hasn't uploaded a photo yet.
 */
export function getCategoryFallbackImage(categoria: string, indexStr?: string): string {
  const seed = indexStr ? parseInt(indexStr) || 1 : 1;
  // Use professional motorcycle accessories stock pictures
  switch (categoria) {
    case 'Cascos':
      return "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=350&auto=format&fit=crop&q=80";
    case 'Llantas':
      return "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=350&auto=format&fit=crop&q=80";
    case 'Impermeables':
      return "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=350&auto=format&fit=crop&q=80";
    case 'Defensas':
      return "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=350&auto=format&fit=crop&q=80";
    case 'Parrillas':
      return "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=350&auto=format&fit=crop&q=80";
    case 'Lujos':
      return "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=350&auto=format&fit=crop&q=80";
    default:
      return "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=350&auto=format&fit=crop&q=80";
  }
}
