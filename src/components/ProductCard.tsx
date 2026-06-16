import { useState } from 'react';
import { Product } from '../types';
import { Plus, Minus, Edit2, Trash2, Copy, Eye, MoreVertical } from 'lucide-react';

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
  const [showMenu, setShowMenu] = useState(false);
  
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

  const isSizeCategory = categoria === 'Cascos' || categoria === 'Impermeables';
  const hasTallas = isSizeCategory && tallas;

  return (
    <>
      <div
        id={`product-card-${id}`}
        className={`bg-white border border-zinc-100/90 rounded-2xl p-4 flex flex-col gap-3 transition-all relative shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_18px_rgba(0,0,0,0.04)] ${
          isOutOfStock ? 'opacity-75' : ''
        }`}
      >
        {/* UPPER ROW: Image, Metadata, Description & Compact Right Stepper */}
        <div className="flex items-start gap-4 w-full relative">
          
          {/* LEFT: FIXED SQUARE IMAGE (80x80px) */}
          <div className="relative shrink-0 w-20 h-20 bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100 select-none">
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
                  className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
                    isOutOfStock ? 'grayscale opacity-60' : ''
                  }`}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 text-zinc-400 font-bold uppercase text-[8px] tracking-wider">
                  <span>Sin</span>
                  <span>Foto</span>
                </div>
              )}

              {isOutOfStock ? (
                <div className="absolute inset-x-0 bottom-0 bg-zinc-900/90 text-white text-[8px] font-bold text-center py-0.5 tracking-wider uppercase leading-none">
                  Agotado
                </div>
              ) : (
                <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-xs text-zinc-800 rounded p-1 shadow-xs" style={{ pointerEvents: 'none' }}>
                  <Eye className="w-2.5 h-2.5 text-zinc-600" />
                </div>
              )}
            </button>
          </div>

          {/* CENTER: DESCRIPTION & DETAILS */}
          <div className="flex-1 min-w-0 pr-6 pt-1 flex flex-col justify-between min-h-[80px]">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap leading-none mb-1">
                <span className="text-[10px] font-semibold text-zinc-400 font-mono tracking-wider">
                  {getCategoryEmoji(categoria)} {categoria.toUpperCase()}
                </span>
                {isOutOfStock && (
                  <span className="bg-zinc-100 text-zinc-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                    AGOTADO
                  </span>
                )}
                {isLowStock && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                    ÚLTIMAS {stock}
                  </span>
                )}
              </div>
              
              {/* Product Description - Multi-line enabled (no ellipsis truncation) */}
              <h3 className="text-[13px] font-bold text-zinc-900 leading-snug uppercase tracking-tight break-words pr-2">
                {(!descripcion || descripcion === 'undefined' || descripcion === 'null') ? 'Sin descripción' : descripcion}
              </h3>
            </div>

            {/* Price display if Llantas - Emerald green & minimalist */}
            {categoria === 'Llantas' && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-zinc-400 font-mono">PRECIO:</span>
                <span className="text-[13px] font-extrabold text-emerald-700 font-mono">
                  ${precio ? precio.toLocaleString('es-CO') : '0'}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: NATIVE iOS STOCK CONTROLLER (VERTICAL STACK) OR TOTAL BADGE */}
          {hasTallas ? (
            <div className="shrink-0 flex flex-col items-end justify-center h-20 self-center">
              <span className="text-[8px] font-bold text-zinc-400 font-mono tracking-wider uppercase">STOCK TOTAL</span>
              <span className={`font-mono font-black rounded-xl px-2.5 py-1 text-sm mt-1 transition-all ${
                isOutOfStock ? 'bg-zinc-100 text-zinc-600' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {isOutOfStock ? '0' : stock}
              </span>
            </div>
          ) : (
            <div className="shrink-0 flex flex-col items-center justify-between h-20 w-10 bg-zinc-50 hover:bg-zinc-100/50 border border-zinc-100 rounded-2xl py-1 select-none self-center">
              {/* Increase Stock Button */}
              <button
                onClick={() => onIncreaseStock(id)}
                className="w-full h-6 flex items-center justify-center text-zinc-800 hover:text-black active:scale-90 transition-transform cursor-pointer"
                title="Aumentar stock"
              >
                <Plus className="w-4 h-4 text-zinc-800" />
              </button>

              {/* Stock Value */}
              <span className={`text-[13px] font-black font-mono leading-none ${stock > 0 ? 'text-emerald-700' : 'text-zinc-400'}`}>
                {stock}
              </span>

              {/* Decrease Stock Button */}
              <button
                onClick={() => onDecreaseStock(id)}
                disabled={isOutOfStock}
                className={`w-full h-6 flex items-center justify-center transition-transform ${
                  isOutOfStock ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-800 hover:text-black active:scale-90'
                }`}
                title="Disminuir stock"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FLOATING ACTION MORE VERTICAL BUTTON */}
          <div className="absolute top-0.5 right-0 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer block"
              title="Más opciones de producto"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>

            {showMenu && (
              <>
                {/* Full screen invisible blanket for closing menu with click outside */}
                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-32 bg-white border border-zinc-100 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] py-1.5 z-30 animate-fade-in text-[12px] font-medium text-zinc-700">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(product);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDuplicate(product);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Duplicar</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm('¿Seguro que deseas eliminar este accesorio?')) {
                        onDelete(id);
                      }
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

        {/* LOWER ROW: HORIZONTAL SIZES STEPPER DISPLAY FOR SIZED CATEGORIES */}
        {hasTallas && (
          <div className="w-full pt-2.5 border-t border-zinc-100/60 flex flex-wrap gap-2 justify-start">
            {['S', 'M', 'L', 'XL', 'XXL']
              .filter((sz) => (tallas[sz] || 0) > 0)
              .map((sz) => {
                const szStock = tallas[sz] || 0;
                return (
                  <div key={sz} className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-100 rounded-lg p-0.5 text-xs">
                    <span className="font-extrabold text-[9px] px-1.5 py-0.5 bg-zinc-950 text-white rounded font-mono uppercase">{sz}</span>
                    <button
                      onClick={() => onUpdateSizeStock(id, sz, -1)}
                      disabled={szStock === 0}
                      className={`w-5 h-5 rounded flex items-center justify-center font-bold active:scale-95 transition-transform ${
                        szStock === 0
                          ? 'text-zinc-300 cursor-not-allowed'
                          : 'text-zinc-800 hover:bg-zinc-200 cursor-pointer'
                      }`}
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-xs px-0.5 min-w-[8px] text-center text-zinc-950">{szStock}</span>
                    <button
                      onClick={() => onUpdateSizeStock(id, sz, 1)}
                      className="w-5 h-5 rounded hover:bg-zinc-200 flex items-center justify-center text-zinc-800 font-bold active:scale-95 transition-transform cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* FULL-SCREEN IMAGE POPUP LIGHTBOX */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-[100] bg-zinc-200/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[28px] border border-zinc-200/60 shadow-xl max-w-sm w-full max-h-[85vh] flex flex-col p-5 relative"
          >
            {/* STICKY TOP HEADER INSIDE THE CARD */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
              <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-widest uppercase">
                ⚡ Vista de Producto
              </span>
              <button
                onClick={() => setIsZoomed(false)}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold text-zinc-500 cursor-pointer text-xs transition-colors"
                title="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE CONTENT BODY */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 no-scrollbar">
              
              {/* Category label */}
              <div className="text-center">
                <span className="bg-zinc-950 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase font-mono tracking-wider inline-block">
                  {getCategoryEmoji(categoria)} {categoria.toUpperCase()}
                </span>
              </div>

              {/* IMAGE WITH MAX-HEIGHT: 40VH CONTAINER AND OBJECT-CONTAIN */}
              <div className="w-full bg-zinc-50 rounded-2xl overflow-hidden flex items-center justify-center p-2.5 border border-zinc-100/60 max-h-[40vh] min-h-[160px]">
                <img
                  src={imagen}
                  alt={descripcion}
                  className="w-full max-h-[35vh] object-contain rounded-xl select-none"
                />
              </div>

              {/* PRODUCT DESCRIPTION - FULL TEXT, MULTIPLE LINES, NO ELLIPSIS TRUNCATION */}
              <div className="text-center px-1">
                <p className="text-sm font-extrabold text-zinc-950 uppercase leading-snug break-words whitespace-pre-line">
                  {(!descripcion || descripcion === 'undefined' || descripcion === 'null') ? 'Sin descripción' : descripcion}
                </p>
              </div>

              {/* STOCK STATUS BLOCK */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">STOCK ACTUAL</span>
                <span className={`text-[13px] font-black px-3 py-1 rounded-xl font-mono ${
                  isOutOfStock ? 'bg-zinc-200 text-zinc-600' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {stock} uds
                </span>
              </div>

              {/* TALLAS DISPLAY INNER SCROLL STATE (FOR SIZED CATEGORIES) */}
              {hasTallas && (
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3.5 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider block">DETALLE POR TALLAS</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['S', 'M', 'L', 'XL', 'XXL']
                      .filter((sz) => (tallas[sz] || 0) > 0)
                      .map((sz) => (
                        <div key={sz} className="flex items-center justify-between bg-white border border-zinc-100 rounded-xl px-2.5 py-1.5 text-xs font-mono">
                          <span className="font-extrabold text-zinc-950">{sz}</span>
                          <span className="font-bold text-emerald-700">{tallas[sz]} uds</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* PRICE ROW IN BODEGA */}
              {categoria === 'Llantas' && (
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">PRECIO DE VENTA</span>
                  <span className="text-[14px] font-black text-emerald-700 font-mono">
                    ${precio ? precio.toLocaleString('es-CO') : '0'}
                  </span>
                </div>
              )}

            </div>

            {/* FIXED BOTTOM ACTION BUTTONS */}
            <div className="border-t border-zinc-100 pt-3.5 flex gap-3 shrink-0">
              
              {/* EDIT ACTION */}
              <button
                onClick={() => {
                  setIsZoomed(false);
                  onEdit(product);
                }}
                className="flex-1 bg-white hover:bg-zinc-50 text-zinc-950 border-2 border-zinc-950 rounded-xl py-3 px-3 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              {/* DELETE ACTION */}
              <button
                onClick={() => {
                  setIsZoomed(false);
                  if (window.confirm('¿Seguro que deseas eliminar este accesorio?')) {
                    onDelete(id);
                  }
                }}
                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-250 rounded-xl py-3 px-3 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar</span>
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
