import { supabase, isSupabaseConfigured, uploadProductImage } from './supabaseClient';
import { Product } from './types';

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado de manera persistente.');
  }

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    // We can order by updated_at or id and category
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching from Supabase table:', error);
    throw error;
  }

  // Ensure fields are correctly mapped to our local TypeScript application schema and sanitized
  return (data || []).map((row: any) => {
    const rawDesc = row.descripcion || row.desc || row.name || '';
    const cleanDesc = (rawDesc === 'undefined' || rawDesc === 'null') ? '' : String(rawDesc);
    return {
      id: String(row.id),
      categoria: row.categoria || 'Lujos',
      descripcion: cleanDesc,
      stock: Number(row.stock !== undefined && row.stock !== null ? row.stock : 0),
      imagen: row.imagen || '',
    };
  });
}

export async function saveProduct(
  productData: Omit<Product, 'id'> & { id?: string; imagen?: string }
): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no se encuentra activo o configurado.');
  }

  let finalImageUrl = productData.imagen;

  // If we have a new base64 image, upload it to the storage bucket first
  if (productData.imagen && productData.imagen.startsWith('data:image/')) {
    try {
      finalImageUrl = await uploadProductImage(productData.imagen);
    } catch (e) {
      console.error('No se pudo subir la imagen al bucket, persistiendo base64 local en la base de datos:', e);
    }
  }

  const payload = {
    categoria: productData.categoria,
    descripcion: productData.descripcion,
    stock: productData.stock,
    imagen: finalImageUrl,
  };

  if (productData.id && !isNaN(Number(productData.id))) {
    // Update existing row
    const { data, error } = await supabase
      .from('productos')
      .update(payload)
      .eq('id', Number(productData.id))
      .select();

    if (error) {
      throw error;
    }

    const updatedRow = data && data[0];
    if (!updatedRow) {
      throw new Error('No se pudo encontrar el producto en la nube para actualizar.');
    }

    return {
      id: String(updatedRow.id),
      categoria: updatedRow.categoria,
      descripcion: updatedRow.descripcion,
      stock: Number(updatedRow.stock),
      imagen: updatedRow.imagen,
    };
  } else {
    // Insert new row
    const { data, error } = await supabase
      .from('productos')
      .insert([payload])
      .select();

    if (error) {
      throw error;
    }

    const insertedRow = data && data[0];
    if (!insertedRow) {
      throw new Error('No se pudo registrar el nuevo producto en la tabla Supabase.');
    }

    return {
      id: String(insertedRow.id),
      categoria: insertedRow.categoria,
      descripcion: insertedRow.descripcion,
      stock: Number(insertedRow.stock),
      imagen: insertedRow.imagen,
    };
  }
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado.');
  }

  // Ensure high robustness on ID parsing
  const numericId = Number(id);
  if (isNaN(numericId)) {
    // If it is a temporary local state ID, do nothing in the cloud table
    return;
  }

  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', numericId);

  if (error) {
    throw error;
  }
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado.');
  }

  const numericId = Number(id);
  if (isNaN(numericId)) {
    return;
  }

  const { error } = await supabase
    .from('productos')
    .update({ stock: Math.max(0, newStock) })
    .eq('id', numericId);

  if (error) {
    throw error;
  }
}
