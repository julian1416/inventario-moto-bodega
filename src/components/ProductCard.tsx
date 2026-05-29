import { useState } from 'react';
import { Product } from '../types';
import { Plus, Minus, Edit2, Trash2, Copy, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onIncreaseStock: (id: string) => Promise<void>;
  onDecreaseStock: (id: string) => Promise<void>;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (product: Product) => void | Promise<void>;
  onUpdateSizeStock: (id: string, size: string, change: number) => Promise<void>;
}

export function ProductCard({
  product,
  onIncreaseStock,
  onDecreaseStock,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateSizeStock,
}: ProductCardProps) {
  const { id, categoria, descripcion, stock, imagen, tallas, precio } = product;
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

  // Ultra-minimalist borders
  const borderClass = isOutOfStock
    ? 'border-zinc-200 bg-zinc-50/50'
    : isLowStock
    ? 'border-amber-400 bg-white shadow-[0_2px_8px_rgba(245,158,11,0.05)]'
    : 'border-zinc-300 bg-white';

  const isSizeCategory = categoria === 'Cascos' || categoria === 'Impermeables';
  const hasTallas = isSizeCategory && tallas;

  return (
    <>
      <div
        id={`product-card-${id}`}
        className={`border-2 rounded-xl p-2.5 flex flex-col gap-2 transition-all relative ${borderClass}`}
      >
        {/* UPPER ROW: Image, Metadata and Primary Controls/Badge */}
        <div className="flex items-center justify-between gap-2.5 w-full">
          {/* LEFT: COMPACT IMAGE PREVIEW */}
          <div className="relative shrink-0 w-14 h-14 bg-zinc-50 rounded-lg border border-zinc-200 overflow-hidden select-none">
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
                    isOutOfStock ? 'grayscale opacity-60' : ''
                  }`}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400 font-bold uppercase text-[9px]">
                  Sin Foto
                </div>
              )}

              {/* Out of stock overlay */}
              {isOutOfStock ? (
                <div className="absolute inset-x-0 bottom-0 bg-black/80 text-white text-[8px] font-black text-center py-0.5 tracking-wide uppercase leading-none">
                  Vacío
                </div>
              ) : (
                <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white rounded p-0.5 text-[7px]" style={{ pointerEvents: 'none' }}>
                  <Eye className="w-2 h-2" />
                </div>
              )}
            </button>
          </div>

          {/* MIDDLE: METADATA & TEXTS WITH COMPACT SPACING */}
          <div className="flex-1 min-w-0 pr-1 flex flex-col justify-between h-14">
            <div>
              <div className="flex items-center gap-1 flex-wrap leading-none">
                <span className="text-[9px] font-extrabold uppercase text-zinc-400 font-mono">
                  {getCategoryEmoji(categoria)} {categoria}
                </span>
                {isLowStock && (
                  <span className="bg-amber-100 text-amber-900 text-[8px] font-black px-1 rounded uppercase">
                    Pocas
                  </span>
                )}
                {isOutOfStock && (
                  <span className="bg-red-100 text-red-900 text-[8px] font-black px-1 rounded uppercase">
                    Agotado
                  </span>
                )}
              </div>
              
              <h3 className="text-[12px] font-black text-zinc-900 leading-tight mt-0.5 line-clamp-1 uppercase tracking-tight">
                {(!descripcion || descripcion === 'undefined' || descripcion === 'null') ? 'Sin descripción' : descripcion}
              </h3>
            </div>

            {/* Quick interactive utility actions with subtle icons */}
            <div className="flex items-center gap-2.5 text-zinc-400 mt-1">
              <button
                onClick={() => onEdit(product)}
                className="text-zinc-500 hover:text-black flex items-center gap-0.5 font-bold font-mono text-[8.5px] uppercase cursor-pointer"
                title="Editar"
              >
                <Edit2 className="w-2.5 h-2.5 stroke-[3]" />
                <span>EDITAR</span>
              </button>
              <button
                onClick={() => onDuplicate(product)}
                className="text-zinc-500 hover:text-black flex items-center gap-0.5 font-bold font-mono text-[8.5px] uppercase cursor-pointer"
                title="Duplicar"
              >
                <Copy className="w-2.5 h-2.5 stroke-[3]" />
                <span>COPIAR</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas eliminar este accesorio de la bodega?')) {
                    onDelete(id);
                  }
                }}
                className="text-zinc-400 hover:text-red-600 flex items-center gap-0.5 font-bold font-mono text-[8.5px] uppercase cursor-pointer ml-auto"
                title="Eliminar"
              >
                <Trash2 className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* RIGHT: GIANT CONTROLLER OR TOTAL BADGE DEPENDING ON TALLAS */}
          {hasTallas ? (
            <div className="shrink-0 flex flex-col items-end gap-0.5 select-none text-right">
              <span className="text-[8px] font-bold text-zinc-400 font-mono uppercase">STOCK TOTAL</span>
              <span className={`font-black font-mono border-2 border-black rounded-xl px-2.5 py-0.5 ${
                isOutOfStock ? 'bg-red-50 text-red-600 border-red-500 text-[10px]' : 'bg-black text-white border-black text-[15px]'
              }`}>
                {isOutOfStock ? 'AGOTADO' : stock}
              </span>
            </div>
          ) : (
            <div className="shrink-0 flex items-center gap-1.5 bg-zinc-50 border-2 border-black rounded-xl p-1 relative z-10 shadow-xs">
              <button
                onClick={() => onDecreaseStock(id)}
                disabled={isOutOfStock}
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-black active:scale-90 transition-transform cursor-pointer ${
                  isOutOfStock
                    ? 'bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed'
                    : 'bg-white border-2 border-black hover:bg-zinc-100 text-black'
                }`}
                title="Disminuir stock"
                style={{ width: '36px', height: '36px' }}
              >
                <Minus className="w-4.5 h-4.5 stroke-[4]" />
              </button>

              <span className="w-6 text-center text-[16px] font-black text-black font-mono">
                {stock}
              </span>

              <button
                onClick={() => onIncreaseStock(id)}
                className="w-9 h-9 rounded-lg bg-white border-2 border-black hover:bg-zinc-100 flex items-center justify-center text-black font-black active:scale-90 transition-transform cursor-pointer font-sans"
                title="Aumentar stock"
                style={{ width: '36px', height: '36px' }}
              >
                <Plus className="w-4.5 h-4.5 stroke-[4]" />
              </button>
            </div>
          )}
        </div>

        {/* LOWER ROW: HORIZONTAL SIZES STEPPER DISPLAY */}
        {hasTallas && (
          <div className="w-full mt-1.5 pt-2 border-t border-zinc-200/60 flex flex-wrap gap-1.5 justify-start">
            {['S', 'M', 'L', 'XL', 'XXL']
              .filter((sz) => (tallas[sz] || 0) > 0)
              .map((sz) => {
                const szStock = tallas[sz] || 0;
                return (
                <div key={sz} className="flex items-center gap-1 bg-zinc-50 border border-zinc-250 rounded-lg p-0.5 text-[11px] font-bold">
                  <span className="font-extrabold text-[9px] px-1 bg-black text-white rounded font-mono uppercase leading-none py-1">{sz}</span>
                  <button
                    onClick={() => onUpdateSizeStock(id, sz, -1)}
                    disabled={szStock === 0}
                    className={`w-5 h-5 rounded flex items-center justify-center font-black active:scale-90 transition-transform ${
                      szStock === 0
                        ? 'text-zinc-350 bg-zinc-100 border border-zinc-150 cursor-not-allowed'
                        : 'text-black bg-white border border-black hover:bg-zinc-200 cursor-pointer'
                    }`}
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-[11px] px-0.5 min-w-[8px] text-center">{szStock}</span>
                  <button
                    onClick={() => onUpdateSizeStock(id, sz, 1)}
                    className="w-5 h-5 rounded bg-white border border-black hover:bg-zinc-200 flex items-center justify-center text-black font-black active:scale-90 transition-transform cursor-pointer"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* LOWER ROW: ELEGANT PRICE DISPLAY FOR LLANTAS */}
        {categoria === 'Llantas' && (
          <div className="w-full mt-1 pt-2 border-t border-zinc-200/60 flex items-center justify-between">
            <span className="text-[9px] font-black text-zinc-500 font-mono uppercase tracking-wider">🏷️ PRECIO DE VENTA</span>
            <span className="text-[13px] font-black font-mono text-emerald-700 bg-emerald-50 border-2 border-zinc-900 rounded-xl px-2.5 py-0.5 shadow-sm">
              ${precio ? precio.toLocaleString('es-CO') : '0'}
            </span>
          </div>
        )}
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
                  <span className="text-xs font-bold text-zinc-500">STOCK ACTUAL:</span>
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
