import { useState } from 'react';
import { Product } from '../types';
import { ZoomIn, X, Trash2, Edit2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCategoryFallbackImage } from '../utils/imageCompression';

interface ProductCardProps {
  key?: string;
  product: Product;
  onIncreaseStock: (id: string) => void;
  onDecreaseStock: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onDuplicate: (product: Product) => void;
}

const getCategoryColorBar = (cat: string) => {
  switch (cat) {
    case 'Cascos': return 'bg-red-500';          // Red
    case 'Llantas': return 'bg-blue-600';         // Blue
    case 'Impermeables': return 'bg-yellow-400';   // Yellow
    case 'Defensas': return 'bg-orange-500';      // Orange
    case 'Parrillas': return 'bg-purple-600';     // Purple
    case 'Lujos': return 'bg-emerald-500';       // Green
    default: return 'bg-zinc-400';
  }
};

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
  const activeImage = imagen || getCategoryFallbackImage(categoria, id);

  return (
    <>
      <div
        id={`product-card-${id}`}
        className={`bg-white border-2 border-black rounded-2xl p-3 flex items-center justify-between gap-3.5 transition-all relative overflow-hidden ${
          isOutOfStock ? 'bg-red-50/20 border-red-500' : 'border-black'
        }`}
      >
        {/* FOTO GRANDE A LA IZQUIERDA (Prioridad Visual) */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsZoomed(true)}
            className="relative block w-[84px] h-[84px] rounded-xl bg-zinc-100 overflow-hidden border-2 border-black transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-black"
            title="Presiona para ampliar imagen"
            style={{ minWidth: '84px', minHeight: '84px' }}
          >
            <img
              src={activeImage}
              alt="Accesorio"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-all ${isOutOfStock ? 'grayscale opacity-60 contrast-75 brightness-75' : ''}`}
            />
            {/* Lente o indicador de Zoom mínimo o Agotado */}
            {!isOutOfStock ? (
              <div className="absolute bottom-1 right-1 bg-black text-white rounded px-1 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5" style={{ pointerEvents: 'none' }}>
                <ZoomIn className="w-2.5 h-2.5" />
                <span>VER</span>
              </div>
            ) : (
              <div className="absolute inset-x-0 bottom-0 bg-black/80 text-white text-[9px] font-bold text-center py-0.5 tracking-wider uppercase" style={{ pointerEvents: 'none' }}>
                Agotado
              </div>
            )}
          </button>
        </div>

        {/* CONTENIDO DESCRIPTIVO EN EL CENTRO (Texto Única Línea / Multi-línea completo sin cortar) */}
        <div className="flex-1 min-w-0 text-left">
          {/* Categoría o Tipo + Indicación de color relacionada */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="inline-block px-2 py-0.5 rounded bg-zinc-100 border border-zinc-350 text-[10px] font-black uppercase text-zinc-700 tracking-wider">
              {categoria}
            </span>

            {/* Advertencia Stock */}
            {isOutOfStock && (
              <span className="inline-block text-[10px] font-black bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Agotado
              </span>
            )}
          </div>

          {/* Único Campo de Descripción Libre (Grande, Negrita y forzado a Multi-línea completo) */}
          <p className="text-[15px] font-extrabold text-black leading-snug break-words whitespace-normal select-all">
            {descripcion}
          </p>

          {/* Botones secundarios discretos de Editar, Duplicar, Borrar con hitbox grande (al menos 44px de click indirecto) */}
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-2">
            <button
              onClick={() => onEdit(product)}
              className="text-[12px] font-black text-blue-800 hover:text-black hover:underline flex items-center gap-0.5 py-1.5 cursor-pointer active:scale-95 transition-transform"
              style={{ minHeight: '36px' }}
              title="Modificar los datos"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={() => onDuplicate(product)}
              className="text-[12px] font-black text-purple-700 hover:text-black hover:underline flex items-center gap-0.5 py-1.5 cursor-pointer active:scale-95 transition-transform"
              style={{ minHeight: '36px' }}
              title="Duplicar este accesorio para registrar una variación rápidamente"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicar</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('¿Deseas eliminar este accesorio de la lista?')) {
                  onDelete(id);
                }
              }}
              className="text-[12px] font-black text-red-650 hover:text-red-900 hover:underline flex items-center gap-0.5 py-1.5 cursor-pointer active:scale-95 transition-transform"
              style={{ minHeight: '36px' }}
              title="Borrar accesorio"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar</span>
            </button>
          </div>
        </div>

        {/* CONTROLES DE STOCK GIGANTES A LA DERECHA (One-Touch para pulgar de 55 años) */}
        <div className="flex flex-col items-center gap-1 shrink-0 pl-1">
          {/* Número de Stock visible destacado */}
          <div className="flex items-baseline justify-center select-none">
            <span className={`text-[28px] font-black tracking-tight leading-none ${isOutOfStock ? 'text-red-600' : 'text-black'}`}>
              {stock}
            </span>
            <span className="text-[10px] font-black text-zinc-500 uppercase ml-0.5">Uds</span>
          </div>

          {/* Botones de control físico [- / +] gigantes, separados e independientes */}
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDecreaseStock(id);
              }}
              disabled={isOutOfStock}
              className={`w-[44px] h-[44px] border-2 border-black rounded-lg flex items-center justify-center transition-all select-none font-black text-2xl active:scale-90 ${
                isOutOfStock
                  ? 'bg-zinc-100 text-zinc-350 border-zinc-200 cursor-not-allowed'
                  : 'bg-zinc-100 text-black hover:bg-zinc-200 active:bg-zinc-300'
              }`}
              title="Restar una unidad"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              −
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onIncreaseStock(id);
              }}
              className="w-[44px] h-[44px] bg-black text-white hover:bg-zinc-900 rounded-lg flex items-center justify-center transition-all select-none font-black text-2xl active:scale-90 border-2 border-black"
              title="Sumar una unidad"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE ZOOM DE FOTO EXCLUSIVO CON DATOS CLAROS */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6"
            onClick={() => setIsZoomed(false)}
          >
            {/* Botón de cerrar Gigante para el pulgar de 55 años */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-12 right-6 w-12 h-12 bg-white text-black active:scale-95 rounded-full flex items-center justify-center border-2 border-black focus:outline-none cursor-pointer"
              title="Cerrar vista grande"
              style={{ minWidth: '48px', minHeight: '48px' }}
            >
              <X className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Contenido Ampliado */}
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-md bg-white rounded-2xl overflow-hidden border-2 border-black p-4 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-50 border-2 border-black">
                <img
                  src={activeImage}
                  alt="Accesorio ampliado"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Detalles legibles */}
              <div className="text-left space-y-2">
                <span className="inline-block px-2.5 py-1 rounded bg-zinc-100 border border-black text-xs font-black uppercase text-zinc-800 tracking-wider">
                  Categoría: {categoria}
                </span>
                
                <h2 className="text-xl font-black text-black leading-snug">
                  {descripcion}
                </h2>
                
                <div className="bg-zinc-100 p-3.5 rounded-xl border-2 border-black text-center">
                  <span className="text-xs font-bold text-zinc-500 block uppercase">CANTIDAD DISPONIBLE EN BODEGA</span>
                  <span className={`text-3xl font-black ${stock === 0 ? 'text-red-650' : 'text-black'}`}>
                    {stock} {stock === 1 ? 'Unidad' : 'Unidades'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsZoomed(false)}
                className="w-full bg-black text-white hover:bg-zinc-800 font-black py-4 rounded-xl cursor-pointer active:scale-95 transition-transform"
                style={{ minHeight: '44px' }}
              >
                Cerrar Detalle
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
