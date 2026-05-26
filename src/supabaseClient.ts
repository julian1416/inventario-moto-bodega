import { createClient } from '@supabase/supabase-js';

// Get Vite environment variables safely
const rawUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
const rawKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

// A URL is valid if it can be successfully parsed and has a valid HTTP/HTTPS protocol
const isValidUrl = (url: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

let clientInstance: any = null;
let isConfiguredSuccess = false;

if (rawUrl && rawKey && isValidUrl(rawUrl)) {
  try {
    clientInstance = createClient(rawUrl, rawKey);
    isConfiguredSuccess = true;
    console.log('Moto Bodega: Credenciales de Supabase detectadas y validadas correctamente.');
  } catch (error) {
    console.error('Error al inicializar el cliente de Supabase:', error);
    clientInstance = null;
    isConfiguredSuccess = false;
  }
} else {
  console.log('Moto Bodega: Supabase VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no especificadas o inválidas. Operando en Modo Local LocalStorage.');
}

export const isSupabaseConfigured = isConfiguredSuccess;
export const supabase = clientInstance;

// Helper to check and upload base64 images to 'fotos-productos' bucket
export async function uploadProductImage(base64Str: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase no está configurado de manera activa.');
  }

  // Extract base64 details
  const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) {
    // If it isn't a base64 string, keep it as is (could be a public URL or default)
    return base64Str;
  }

  const contentType = matches[1];
  const b64Data = matches[2];
  
  // Convert base64 to binary byte array
  const byteCharacters = atob(b64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: contentType });

  // Generate a clean filename: e.g. foto_17152600_abcd.jpg
  const extension = contentType.split('/')[1] || 'jpg';
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const fileName = `foto_${Date.now()}_${randomSuffix}.${extension}`;

  // Upload to bucket 'fotos-productos'
  const { error } = await supabase.storage
    .from('fotos-productos')
    .upload(fileName, blob, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image to bucket:', error);
    throw new Error(`Error de subida de imagen: ${error.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from('fotos-productos')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
