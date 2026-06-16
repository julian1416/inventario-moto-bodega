import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface DuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onDuplicateConfirm: (baseProduct: Product, newSize: string, newStock: number, newDesc: string) => Promise<void>;
}

export function DuplicateModal({ isOpen, onClose, product, onDuplicateConfirm }: DuplicateModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [stock, setStock] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to extract clean base description and current size
  const getCleanDescAndSize = (desc: string) => {
    const sizeRegex = /\s*-\s*(S|M|L|XL|XXL)\s*$/i;
    const match = desc.match(sizeRegex);
    const size = match ? match[1].toUpperCase() : '';
    const cleanDesc = desc.replace(sizeRegex, '').trim();
    return { cleanDesc, size };
  };

  useEffect(() => {
    if (product) {
      const { cleanDesc, size } = getCleanDescAndSize(product.descripcion);
      setSelectedSize(size || 'M'); // default to 'M'
      setDescription(cleanDesc);
      setStock(1);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const isSizeCategory = product.categoria === 'Cascos' || product.categoria === 'Impermeables';
  
  // Calculate preview name
  const finalPreviewName = isSizeCategory && selectedSize
    ? `${description.trim().toUpperCase()} - ${selectedSize}`
    : description.trim().toUpperCase();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSaving(true);
    try {
      await onDuplicateConfirm(product, selectedSize, stock, finalPreviewName);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[370px] rounded-[28px] border border-zinc-100 shadow-xl overflow-hidden flex flex-col my-auto">
        
        {/* Header styling */}
        <div className="bg-white border-b border-zinc-100 p-4.5 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-zinc-950 uppercase tracking-wide">
            Clonar para Nueva Talla
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold text-zinc-500 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          <div className="space-y-1 bg-zinc-50 border border-zinc-100 rounded-xl p-3">
            <span className="text-[9px] font-bold text-zinc-400 font-mono block uppercase tracking-wider">Diseño base:</span>
            <span className="text-xs font-bold text-zinc-800 block uppercase leading-snug">{product.descripcion}</span>
          </div>

          {/* Description manual modifier */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
              Nombre de Diseño (Sin Talla)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-50 hover:bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-semibold text-zinc-950 uppercase focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* SIZES SELECTOR (ONLY APPEARS FOR 'Cascos' or 'Impermeables') */}
          {isSizeCategory && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
                Selecciona la Talla que llegará
              </label>
              <div className="flex gap-1 justify-between">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                  const isCurrentSize = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 py-1.5 rounded-lg text-center border font-semibold text-[12px] active:scale-95 transition-all cursor-pointer ${
                        isCurrentSize
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-zinc-50 text-zinc-650 border-zinc-200/60 hover:border-zinc-350'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity numeric selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
              Cantidad Recibida (Stock de esta Talla)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStock((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-800 font-bold text-lg flex items-center justify-center active:scale-95 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-10 bg-white border border-zinc-200 rounded-xl text-center text-[14px] font-bold text-zinc-950 font-mono focus:outline-none focus:border-zinc-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setStock((prev) => prev + 1)}
                className="w-10 h-10 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-800 font-bold text-lg flex items-center justify-center active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Preview of output */}
          <div className="border border-zinc-100 bg-zinc-50/50 rounded-2xl p-3 text-center">
            <span className="text-[8px] font-mono font-bold text-zinc-400 block uppercase tracking-wider mb-1">Previsualización del Producto</span>
            <span className="text-[12px] font-bold text-zinc-900 tracking-tight block uppercase">
              {finalPreviewName}
            </span>
            <span className="text-[9px] font-bold text-zinc-500 block mt-1 uppercase tracking-wide">
              {stock} UNIDAD(ES) EN STOCK
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3.5 border-t border-zinc-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-50 hover:bg-zinc-100 rounded-xl py-2.5 text-[12px] font-bold text-zinc-750 uppercase active:scale-95 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-zinc-950 hover:bg-zinc-900 rounded-xl py-2.5 text-[12px] font-bold text-white uppercase active:scale-95 cursor-pointer disabled:opacity-45 transition-colors"
            >
              Duplicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
