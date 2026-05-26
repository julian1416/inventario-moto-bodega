export interface Product {
  id: string;
  categoria: 'Cascos' | 'Llantas' | 'Impermeables' | 'Defensas' | 'Parrillas' | 'Lujos';
  descripcion: string; // Unificado: Toda la descripción técnica, color, talla, compatibilidad, etc.
  stock: number;
  imagen?: string; // Base64 compressed image or placeholder URL
}

export type Category = 'Cascos' | 'Llantas' | 'Impermeables' | 'Defensas' | 'Parrillas' | 'Lujos';
