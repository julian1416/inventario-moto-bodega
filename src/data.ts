import { Product } from './types';

// Let's create beautiful inline SVGs as initial images so they look incredibly high fidelity and loads instantly
const createPlaceholderSVG = (category: string, title: string) => {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" fill="%23f4f4f5"/>
    <rect width="112" height="112" x="4" y="4" fill="none" stroke="%2318181b" stroke-width="2"/>
    <text x="50%" y="40%" font-family="monospace" font-size="11" font-weight="900" fill="%2371717a" dominant-baseline="middle" text-anchor="middle">${category.toUpperCase()}</text>
    <text x="50%" y="65%" font-family="sans-serif" font-size="9" font-weight="800" fill="%2318181b" dominant-baseline="middle" text-anchor="middle">${title}</text>
    <circle cx="60" cy="90" r="3" fill="%23d4d4d8"/>
  </svg>`;
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    categoria: 'Cascos',
    descripcion: 'Casco Certificado Abatible S-Line Mate Negro XL',
    stock: 5,
    imagen: createPlaceholderSVG('Cascos', 'S-Line Abatible')
  },
  {
    id: '2',
    categoria: 'Cascos',
    descripcion: 'Casco Deportor Integral Shaft Pro Series 120',
    stock: 0, // Out of stock to test grayscale out of stock feature
    imagen: createPlaceholderSVG('Cascos', 'Shaft Pro 120')
  },
  {
    id: '3',
    categoria: 'Llantas',
    descripcion: 'Llanta Sellomatic Michelin Pilot Street 130/70-17',
    stock: 8,
    imagen: createPlaceholderSVG('Llantas', 'Michelin 130/70-17'),
    precio: 245000
  },
  {
    id: '4',
    categoria: 'Llantas',
    descripcion: 'Llanta para Lluvia Pirelli Diablo Rosso 140/60-17',
    stock: 2, // Low stock to test yellow alert indicator
    imagen: createPlaceholderSVG('Llantas', 'Pirelli Diablo'),
    precio: 350000
  },
  {
    id: '5',
    categoria: 'Impermeables',
    descripcion: 'Impermeable Siliconado Antifricción Reforzado Negro',
    stock: 12,
    imagen: createPlaceholderSVG('Impermeables', 'Kit Siliconado')
  },
  {
    id: '6',
    categoria: 'Impermeables',
    descripcion: 'Impermeable de 2 Piezas Tipo Enterizo Camuflado',
    stock: 0, // Out of stock
    imagen: createPlaceholderSVG('Impermeables', 'Enterizo Camuflado')
  },
  {
    id: '7',
    categoria: 'Defensas',
    descripcion: 'Defensa Slider Premium de Alto Impacto para Yamaha FZ25',
    stock: 4,
    imagen: createPlaceholderSVG('Defensas', 'Slider FZ25')
  },
  {
    id: '8',
    categoria: 'Defensas',
    descripcion: 'Defensas Laterales Completas Suzuki Gixxer 250 FI',
    stock: 1, // Low stock
    imagen: createPlaceholderSVG('Defensas', 'Suzuki Gixxer 250')
  },
  {
    id: '9',
    categoria: 'Parrillas',
    descripcion: 'Parrilla de Carga Reforzada de Acero Bajaj Pulsar NS200',
    stock: 6,
    imagen: createPlaceholderSVG('Parrillas', 'Parrilla Pulsar 200')
  },
  {
    id: '10',
    categoria: 'Parrillas',
    descripcion: 'Parrilla Súper Resistente Premium para Honda CB190R',
    stock: 3,
    imagen: createPlaceholderSVG('Parrillas', 'Honda CB190R')
  },
  {
    id: '11',
    categoria: 'Lujos',
    descripcion: 'Exploradoras LED de Alta Potencia (Ojo de Ángel Multicolor)',
    stock: 15,
    imagen: createPlaceholderSVG('Lujos', 'Exploradoras LED x2')
  },
  {
    id: '12',
    categoria: 'Lujos',
    descripcion: 'Puños de Goma Deportivos de Aluminio Anonizado Dorado',
    stock: 2, // Low stock
    imagen: createPlaceholderSVG('Lujos', 'Puños Dorados')
  },
  {
    id: '13',
    categoria: 'Lujos',
    descripcion: 'Espejos Retrovisores Deportivos Minimalistas de Fibra de Carbono',
    stock: 10,
    imagen: createPlaceholderSVG('Lujos', 'Espejos Carbono')
  },
  {
    id: '14',
    categoria: 'Cascos',
    descripcion: 'Casco Certificado Cross MT Helmets Falcon Glossy',
    stock: 3,
    imagen: createPlaceholderSVG('Cascos', 'MT Falcon Cross')
  },
  {
    id: '15',
    categoria: 'Llantas',
    descripcion: 'Llanta para Scooter Maxxis Supermax 120/70-12',
    stock: 7,
    imagen: createPlaceholderSVG('Llantas', 'Maxxis 120/70-12'),
    precio: 180000
  }
];
