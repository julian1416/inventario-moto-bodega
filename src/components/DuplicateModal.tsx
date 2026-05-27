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
      setSelectedSize(size || 'M'); // default to 'M' or whatever
      setDescription(cleanDesc);
      setStock(1); // default arrival quantity is usually 1 or 2
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[393px] rounded-3xl border-3 border-black shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header styling */}
        <div className="bg-zinc-50 border-b-2 border-black p-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-black uppercase font-mono">
            📋 Clonar para Nueva Talla
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-black hover:bg-zinc-105 text-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          <div className="space-y-1 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
            <span className="text-[9px] font-black text-zinc-400 font-mono block uppercase">Diseño base:</span>
            <span className="text-xs font-black text-black block uppercase">{product.descripcion}</span>
          </div>

          {/* Description manual modifier */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-500 uppercase font-mono tracking-wider">
              Nombre de Diseño (Sin Talla)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border-2 border-black rounded-xl p-2.5 text-xs font-black text-black uppercase focus:outline-none"
            />
          </div>

          {/* SIZES SELECTOR (ONLY APPEARS FOR 'Cascos' or 'Impermeables') */}
          {isSizeCategory && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-zinc-500 uppercase font-mono tracking-wider">
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
                      className={`flex-1 py-1.5 rounded-lg text-center border-2 font-black text-[12px] active:scale-95 transition-all cursor-pointer ${
                        isCurrentSize
                          ? 'bg-black text-white border-black'
                          : 'bg-zinc-50 text-black border-zinc-200 hover:border-black'
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
            <label className="block text-[10px] font-black text-zinc-500 uppercase font-mono tracking-wider">
              Cantidad Recibida (Stock de esta Talla)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStock((prev) => Math.max(1, prev - 1))}
                className="w-12 h-12 bg-zinc-50 hover:bg-zinc-100 border-2 border-black rounded-xl text-black font-black text-lg flex items-center justify-center active:scale-95 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 bg-white border-2 border-black rounded-xl text-center text-[15px] font-black text-black font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setStock((prev) => prev + 1)}
                className="w-12 h-12 bg-zinc-50 hover:bg-zinc-100 border-2 border-black rounded-xl text-black font-black text-lg flex items-center justify-center active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Preview of output */}
          <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-55/40 text-center">
            <span className="text-[8px] font-mono font-bold text-zinc-400 block uppercase mb-1">Previsualización del Producto</span>
            <span className="text-[13px] font-black text-black tracking-tight block uppercase">
              {finalPreviewName}
            </span>
            <span className="text-[10px] font-black text-zinc-500 block mt-1">
              {stock} UNIDAD(ES) EN STOCK
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t-2 border-zinc-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-zinc-50 border-2 border-zinc-300 py-3 rounded-2xl text-[12px] font-black text-black uppercase active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-black hover:bg-zinc-900 border-2 border-black py-3 rounded-2xl text-[12px] font-black text-white uppercase active:scale-95 cursor-pointer disabled:opacity-45"
            >
              Duplicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
