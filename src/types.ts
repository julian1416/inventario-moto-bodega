export type Category = 'Cascos' | 'Llantas' | 'Impermeables' | 'Defensas' | 'Parrillas' | 'Lujos';

export interface Product {
  id: string;
  categoria: Category;
  descripcion: string;
  stock: number;
  imagen?: string; // Standard base64 data string, public Supabase Storage URL, or default SVG url
  tallas?: Record<string, number>; // Local breakdown of stock per size (S, M, L, XL, XXL)
  precio?: number; // Price of sale (used mainly for Llantas category)
}

