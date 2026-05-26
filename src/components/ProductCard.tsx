import { useState } from 'react';
import { Product } from '../types';
import { Plus, Minus, Edit2, Trash2, Copy, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onIncreaseStock: (id: string) => Promise<void>;
  onDecreaseStock: (id: string) => Promise<void>;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (product: Product) => Promise<void>;
}

export function ProductCard({
  product,
  onIncreaseStock,
  onDecreaseStock,
  onEdit,
  onDelete,
  onDuplicate,
}: ProductCardProps) {
  const { id, categoria, descripcion, stock, imagen } = product;
  const [isZoomed, setIsZoomed] = useState(false);
  
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 2;

  // Render Category emojis nicely
  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'Cascos': return '🪖';
      case 'Llantas': return '🛞';
      case 'Impermeables': return '🧥';
      case 'Defensas': return '🛡️';
      case 'Parrillas': return '🎒';
      case 'Lujos': return '✨';
      default: return '📦';
    }
  };

  // Determine elegant, limited color alerts for low stock
  const borderClass = isOutOfStock
    ? 'border-zinc-300 bg-zinc-50'
    : isLowStock
    ? 'border-amber-500 bg-amber-50/30'
    : 'border-black bg-white';

  return (
    <>
      <div
        id={`product-card-${id}`}
        className={`border-2 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all relative overflow-hidden ${borderClass}`}
      >
        {/* LEFT: IMAGE PREVIEW */}
        <div className="relative shrink-0 w-20 h-20 bg-zinc-100 rounded-xl border border-zinc-200 overflow-hidden select-none">
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="w-full h-full block focus:outline-none"
            title="Ampliar foto"
          >
            {imagen ? (
              <img
                src={imagen}
                alt={descripcion}
                className={`w-full h-full object-cover transition-transform duration-300 hover:scale-110 ${
                  isOutOfStock ? 'grayscale opacity-60 contrast-75 brightness-75' : ''
                }`}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400 font-bold uppercase text-[10px]">
                Sin Foto
              </div>
            )}

            {/* Agotado / Zoom overlays */}
            {isOutOfStock ? (
              <div className="absolute inset-x-0 bottom-0 bg-black/85 text-white text-[9px] font-black text-center py-0.5 tracking-wider uppercase leading-none">
                Agotado
              </div>
            ) : (
              <div className="absolute bottom-1 right-1 bg-black/75 text-white rounded p-0.5 text-[8px] flex items-center justify-center" style={{ pointerEvents: 'none' }}>
                <Eye className="w-2.5 h-2.5" />
              </div>
            )}
          </button>
        </div>

        {/* MIDDLE: METADATA & TEXTS */}
        <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between h-20">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-zinc-500 font-mono tracking-wider">
                {getCategoryEmoji(categoria)} {categoria}
              </span>
              {isLowStock && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-sans text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none tracking-wide animate-pulse">
                  Por Agotar
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-red-100 text-red-900 border border-red-300 font-sans text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none tracking-wide">
                  Sin Stock
                </span>
              )}
            </div>
            
            <h3 className="text-[12.5px] font-black text-black leading-tight mt-1 line-clamp-2 uppercase">
              {(!descripcion || descripcion === 'undefined' || descripcion === 'null') ? 'Sin descripción' : descripcion}
            </h3>
          </div>

          {/* Quick interactive utility action bar */}
          <div className="flex items-center gap-3 text-zinc-450">
            <button
              onClick={() => onEdit(product)}
              className="text-zinc-500 hover:text-black flex items-center gap-0.5 font-bold font-mono text-[9px] uppercase hover:underline cursor-pointer"
              title="Editar"
            >
              <Edit2 className="w-3 h-3 stroke-[2.5]" />
              <span>EDITAR</span>
            </button>
            <button
              onClick={() => onDuplicate(product)}
              className="text-zinc-500 hover:text-black flex items-center gap-0.5 font-bold font-mono text-[9px] uppercase hover:underline cursor-pointer"
              title="Duplicar"
            >
              <Copy className="w-3 h-3 stroke-[2.5]" />
              <span>COPIAR</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Seguro que deseas eliminar este accesorio de la bodega?')) {
                  onDelete(id);
                }
              }}
              className="text-zinc-400 hover:text-red-600 flex items-center gap-0.5 font-bold font-mono text-[9px] uppercase hover:underline cursor-pointer ml-auto"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* RIGHT: COHESIVE STOCK STEPPER CONTROLLER */}
        <div className="shrink-0 flex flex-col items-center bg-zinc-100 border-2 border-black rounded-2xl p-1 w-[60px] justify-between h-20 shadow-sm relative z-10">
          <button
            onClick={() => onIncreaseStock(id)}
            className="w-12 h-7 rounded-lg bg-white border-2 border-black hover:bg-zinc-150 flex items-center justify-center text-black font-black active:scale-90 transition-transform cursor-pointer"
            title="Aumentar stock"
          >
            <Plus className="w-4.5 h-4.5 stroke-[4]" />
          </button>

          <span className="text-[17px] font-black text-black leading-none my-0.5 font-mono">
            {stock}
          </span>

          <button
            onClick={() => onDecreaseStock(id)}
            disabled={isOutOfStock}
            className={`w-12 h-7 rounded-lg flex items-center justify-center font-black active:scale-90 transition-transform cursor-pointer ${
              isOutOfStock
                ? 'bg-zinc-200 border border-zinc-350 text-zinc-400 cursor-not-allowed'
                : 'bg-white border-2 border-black hover:bg-zinc-150 text-black'
            }`}
            title="Disminuir stock"
          >
            <Minus className="w-4.5 h-4.5 stroke-[4]" />
          </button>
        </div>
      </div>

      {/* FULL-SCREEN IMAGE POPUP LIGHTBOX */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in"
        >
          <div className="max-w-md w-full relative">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute -top-12 right-0 text-white font-black text-xs uppercase flex items-center gap-1 cursor-pointer bg-zinc-900 border-2 border-white px-3 py-1.5 rounded-full"
            >
              ✕ Cerrar
            </button>
            <div className="bg-white border-4 border-black rounded-3xl overflow-hidden shadow-2xl p-2">
              <img
                src={imagen}
                alt={descripcion}
                className="w-full max-h-[400px] object-contain rounded-2xl mx-auto"
              />
              <div className="p-4 bg-zinc-50 border-t border-zinc-200 mt-2 rounded-xl text-center">
                <span className="bg-black text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase font-mono tracking-widest inline-block mb-1.5">
                  {categoria}
                </span>
                <p className="text-sm font-black text-black uppercase leading-tight">{descripcion}</p>
                <div className="mt-3 flex items-center justify-center gap-3 font-mono">
                  <span className="text-xs font-bold text-zinc-550">STOCK ACTUAL:</span>
                  <span className={`text-[15px] font-black px-3 py-0.5 rounded-full border-2 ${
                    isOutOfStock ? 'bg-red-100 text-red-900 border-red-400' : 'bg-black text-white border-black'
                  }`}>
                    {stock} uds
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
