// src/supabaseService.ts
import { supabase, isSupabaseConfigured, uploadProductImage } from './supabaseClient';
import { Product } from './types';

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado de manera persistente.');
  }

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error al traer productos de Supabase:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    id: String(row.id),
    categoria: row.categoria || 'Lujos',
    descripcion: row.descripcion || '',
    stock: Number(row.stock || 0),
    imagen: row.imagen || '', // Usamos 'imagen' exactamente
  }));
}

export async function saveProduct(
  productData: Omit<Product, 'id'> & { id?: string; imagen?: string }
): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está conectado.');
  }

  let finalImageUrl = productData.imagen || '';

  // Si es una foto nueva tomada con el iPhone (base64), la subimos al Storage
  if (finalImageUrl.startsWith('data:image/')) {
    try {
      finalImageUrl = await uploadProductImage(finalImageUrl);
    } catch (e) {
      console.error('Error subiendo imagen, se guardará sin foto:', e);
      finalImageUrl = ''; 
    }
  }

  // Preparamos los datos EXACTOS que espera la tabla en Supabase
  const payload = {
    categoria: productData.categoria,
    descripcion: productData.descripcion,
    stock: Number(productData.stock),
    imagen: finalImageUrl, // EL NOMBRE DEBE SER 'imagen'
  };

  if (productData.id && !isNaN(Number(productData.id))) {
    // ACTUALIZAR PRODUCTO EXISTENTE
    const { data, error } = await supabase
      .from('productos')
      .update(payload)
      .eq('id', Number(productData.id))
      .select();

    if (error) throw error;
    const row = data?.[0];
    if (!row) throw new Error('No se encontró el producto para actualizar.');
    
    return {
      id: String(row.id),
      categoria: row.categoria,
      descripcion: row.descripcion,
      stock: Number(row.stock),
      imagen: row.imagen,
    };
  } else {
    // CREAR PRODUCTO NUEVO
    const { data, error } = await supabase
      .from('productos')
      .insert([payload])
      .select();

    if (error) throw error;
    const row = data?.[0];
    if (!row) throw new Error('Error al registrar en la base de datos.');

    return {
      id: String(row.id),
      categoria: row.categoria,
      descripcion: row.descripcion,
      stock: Number(row.stock),
      imagen: row.imagen,
    };
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const numericId = Number(id);
  if (isNaN(numericId)) return;

  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', numericId);

  if (error) throw error;
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const numericId = Number(id);
  if (isNaN(numericId)) return;

  const { error } = await supabase
    .from('productos')
    .update({ stock: Math.max(0, newStock) })
    .eq('id', numericId);

  if (error) throw error;
}