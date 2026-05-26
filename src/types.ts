export type Category = 'Cascos' | 'Llantas' | 'Impermeables' | 'Defensas' | 'Parrillas' | 'Lujos';

export interface Product {
  id: string;
  categoria: Category;
  descripcion: string;
  stock: number;
  imagen?: string; // Standard base64 data string, public Supabase Storage URL, or default SVG url
}
