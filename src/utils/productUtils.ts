export type SizesStock = Record<string, number>;

export interface ParsedProduct {
  descripcionLimpia: string;
  tallas?: SizesStock; // Key: size (S, M, L, XL, XXL) -> stock
}

// Allowed sizes list
export const ALLOWED_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;

/**
 * Parses the product description to check if size-specific stocks are encoded.
 * Supported format: "REAL DESCRIPTION || S:3,M:1,L:4"
 */
export function parseProductDescription(desc: string, category: string): ParsedProduct {
  const safeDesc = desc || '';
  
  if (category !== 'Cascos' && category !== 'Impermeables') {
    return { descripcionLimpia: safeDesc };
  }

  // If already formatted with the delimiter
  if (safeDesc.includes(' || ')) {
    const [descPart, sizePart] = safeDesc.split(' || ');
    const descripcionLimpia = descPart.trim();
    
    // Initialize with zeros
    const tallas: SizesStock = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    
    if (sizePart) {
      sizePart.split(',').forEach((token) => {
        const [sizeName, countStr] = token.split(':');
        const cleanSize = sizeName ? sizeName.toUpperCase().trim() : '';
        if (cleanSize && tallas[cleanSize] !== undefined) {
          tallas[cleanSize] = Math.max(0, parseInt(countStr) || 0);
        }
      });
    }

    return { descripcionLimpia, tallas };
  }

  // Retrocompatibility: check if name ends with old "- S/M/L/XL/XXL" format
  const sizeRegex = /\s*-\s*(S|M|L|XL|XXL)\s*$/i;
  const match = safeDesc.match(sizeRegex);
  if (match) {
    const detectedSize = match[1].toUpperCase();
    const cleanName = safeDesc.replace(sizeRegex, '').trim();
    
    const tallas: SizesStock = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    tallas[detectedSize] = 1; // Default to 1 for this size if found

    return {
      descripcionLimpia: cleanName,
      tallas
    };
  }

  // Default initial sizes
  return {
    descripcionLimpia: safeDesc.trim(),
    tallas: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
  };
}

/**
 * Formats description and sizes into a single backward-compatible description string.
 */
export function formatProductDescription(descripcionLimpia: string, category: string, tallas?: SizesStock): string {
  const cleanName = (descripcionLimpia || '').split(' || ')[0].trim();
  
  if (category !== 'Cascos' && category !== 'Impermeables' || !tallas) {
    return cleanName;
  }

  const sizesStr = Object.entries(tallas)
    .map(([size, stock]) => `${size}:${stock}`)
    .join(',');

  return `${cleanName} || ${sizesStr}`;
}
