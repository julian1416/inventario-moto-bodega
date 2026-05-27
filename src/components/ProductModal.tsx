import React, { useState, useEffect, useRef } from 'react';
import { Product, Category } from '../types';
import { compressImage } from '../utils/imageCompression';
import { AlertCircle, Camera } from 'lucide-react';
import { parseProductDescription } from '../utils/productUtils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'> & { id?: string; imagen?: string }) => Promise<void>;
  productToEdit: Product | null;
}

const CATEGORY_ICONS: Record<Category, string> = {
  Cascos: '🪖',
  Llantas: '🛞',
  Impermeables: '🧥',
  Defensas: '🛡️',
  Parrillas: '🎒',
  Lujos: '✨',
};

export function ProductModal({ isOpen, onClose, onSave, productToEdit }: ProductModalProps) {
  const [categoria, setCategoria] = useState<Category>('Cascos');
  const [descripcion, setDescripcion] = useState('');
  const [stock, setStock] = useState<number>(1);
  const [tallasStock, setTallasStock] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
  const [imagen, setImagen] = useState<string>('');
  const [isCompacting, setIsCompacting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productToEdit) {
      setCategoria(productToEdit.categoria);
      setDescripcion(productToEdit.descripcion);
      setStock(productToEdit.stock);
      setImagen(productToEdit.imagen || '');

      const parsed = parseProductDescription(productToEdit.descripcion, productToEdit.categoria);
      if (parsed.tallas) {
        setTallasStock(parsed.tallas);
      } else {
        setTallasStock({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
      }
    } else {
      setCategoria('Cascos');
      setDescripcion('');
      setStock(1);
      setTallasStock({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
      setImagen('');
    }
    setErrorMessage('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Formato de imagen inválido.');
      return;
    }

    setIsCompacting(true);
    setErrorMessage('');
    try {
      const compressedBase64 = await compressImage(file, 480, 0.75);
      setImagen(compressedBase64);
    } catch (err) {
      console.error('Error compressing image:', err);
      setErrorMessage('Fallo al procesar imagen.');
    } finally {
      setIsCompacting(false);
    }
  };

  const handleSelectDefaultPlaceholder = () => {
    const cleanTitle = descripcion.trim().substring(0, 18) || 'Accesorio';
    const svgStr = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f4f4f5"/><rect width="112" height="112" x="4" y="4" fill="none" stroke="%2318181b" stroke-width="2"/><text x="50%" y="40%" font-family="monospace" font-size="11" font-weight="900" fill="%2371717a" dominant-baseline="middle" text-anchor="middle">${categoria.toUpperCase()}</text><text x="50%" y="65%" font-family="sans-serif" font-size="9" font-weight="800" fill="%2318181b" dominant-baseline="middle" text-anchor="middle">${cleanTitle}</text><circle cx="60" cy="90" r="3" fill="%23d4d4d8"/></svg>`;
    setImagen(svgStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setErrorMessage('Escribe el nombre del accesorio.');
      return;
    }

    const isSizeCategory = categoria === 'Cascos' || categoria === 'Impermeables';
    const finalStock = isSizeCategory
      ? Object.values(tallasStock).reduce((acc, curr) => acc + curr, 0)
      : stock;

    if (finalStock < 0) {
      setErrorMessage('La cantidad no puede ser negativa.');
      return;
    }

    let finalImage = imagen;
    if (!finalImage) {
      const cleanTitle = descripcion.trim().substring(0, 18);
      finalImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f4f4f5"/><rect width="112" height="112" x="4" y="4" fill="none" stroke="%2318181b" stroke-width="2"/><text x="50%" y="40%" font-family="monospace" font-size="11" font-weight="900" fill="%2371717a" dominant-baseline="middle" text-anchor="middle">${categoria.toUpperCase()}</text><text x="50%" y="65%" font-family="sans-serif" font-size="9" font-weight="800" fill="%2318181b" dominant-baseline="middle" text-anchor="middle">${cleanTitle}</text><circle cx="60" cy="90" r="3" fill="%23d4d4d8"/></svg>`;
    }

    try {
      await onSave({
        categoria,
        descripcion: descripcion.trim(),
        stock: finalStock,
        imagen: finalImage,
        tallas: isSizeCategory ? tallasStock : undefined,
        ...(productToEdit ? { id: productToEdit.id } : {}),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(`Ocurrió un problema: ${err.message || err}`);
    }
  };

  const categories: Category[] = ['Cascos', 'Llantas', 'Impermeables', 'Defensas', 'Parrillas', 'Lujos'];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-[393px] rounded-3xl border-3 border-black shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header Modal, highly readable iOS style */}
        <div className="bg-zinc-50 border-b-2 border-black p-4 flex items-center justify-between">
          <h2 className="text-sm font-black text-black uppercase font-mono">
            {productToEdit ? '📝 Modificar Accesorio' : '➕ Registrar Accesorio'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-black hover:bg-zinc-105 text-black cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {errorMessage && (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-3 flex gap-2 text-red-950 text-xs font-bold leading-tight">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-500 uppercase font-mono tracking-wider">
              Categoría
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((cat) => {
                const isSelected = categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={`py-2 px-1 rounded-xl text-center border-2 font-black transition-all text-[11px] flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-50 text-black border-zinc-200 hover:border-black'
                    }`}
                  >
                    <span className="text-[14px]">{CATEGORY_ICONS[cat]}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-500 uppercase font-mono tracking-wider">
              Nombre o descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. CASCO SHAFT MATE ROJO"
              rows={2}
              className="w-full bg-white border-2 border-black rounded-xl p-3 text-[13px] font-black text-black placeholder-zinc-400 focus:outline-none uppercase"
            />
          </div>

          {/* SIZES STOCK MULTI-INPUT (FOR CASCOS & IMPERMEABLES) */}
          {(categoria === 'Cascos' || categoria === 'Impermeables') ? (
            <div className="space-y-2 bg-zinc-50 border-2 border-black rounded-2xl p-4">
              <label className="block text-[10px] font-black text-zinc-500 uppercase font-mono tracking-wider mb-2">
                Cantidad por Tallas
              </label>
              <div className="space-y-1.5">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                  const currentSizeVal = tallasStock[size] || 0;
                  return (
                    <div key={size} className="flex items-center justify-between bg-white border border-zinc-250 rounded-xl px-3 py-2">
                      <span className="font-extrabold text-xs text-white bg-black w-6 h-6 flex items-center justify-center rounded-lg font-mono">
                        {size}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setTallasStock(prev => ({ ...prev, [size]: Math.max(0, prev[size] - 1) }))}
                          className="w-8 h-8 bg-zinc-50 hover:bg-zinc-150 border border-black rounded-lg text-black font-extrabold text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-black font-mono">
                          {currentSizeVal}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTallasStock(prev => ({ ...prev, [size]: (prev[size] || 0) + 1 }))}
                          className="w-8 h-8 bg-zinc-50 hover:bg-zinc-150 border border-black rounded-lg text-black font-extrabold text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-right text-[10px] font-black text-zinc-400 font-mono uppercase mt-2">
                UNIDADES TOTALES: {Object.values(tallasStock).reduce((acc, curr) => acc + curr, 0)}
              </div>
            </div>
          ) : (
            /* General Single Quantity stepper for other categories */
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-zinc-500 uppercase font-mono tracking-wider">
                Cantidad en Stock
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStock((prev) => Math.max(0, prev - 1))}
                  className="w-12 h-12 bg-zinc-50 hover:bg-zinc-100 border-2 border-black rounded-xl text-black font-black text-lg flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
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
          )}

          {/* Live photo upload controls */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-zinc-500 uppercase font-mono tracking-wider">
              Fotografía (Opcional)
            </label>

            <div className="border-2 border-dashed border-zinc-300 rounded-xl p-3 bg-zinc-50 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[110px]">
              {imagen ? (
                <div className="space-y-2 w-full">
                  <div className="relative w-20 h-20 mx-auto rounded-lg border-2 border-black overflow-hidden bg-white shadow-xs">
                    <img src={imagen} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagen('')}
                      className="absolute top-0 right-0 bg-red-600 text-white text-[8px] px-1.5 py-0.5 font-bold uppercase cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto text-black">
                    {isCompacting ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-black rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompacting}
                      className="text-[11px] font-black underline text-black hover:text-zinc-700 uppercase cursor-pointer"
                    >
                      Tomar foto o subir archivo
                    </button>
                  </div>
                </div>
              )}

              {/* Secret input trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
            </div>

            {/* Quick Helper Default Button */}
            {!imagen && (
              <button
                type="button"
                onClick={handleSelectDefaultPlaceholder}
                className="w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-lg py-1.5 text-[9px] font-mono font-black text-zinc-500 uppercase cursor-pointer"
              >
                Omitir: Usar Sello
              </button>
            )}
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
              disabled={isCompacting}
              className="flex-1 bg-black hover:bg-zinc-900 border-2 border-black py-3 rounded-2xl text-[12px] font-black text-white uppercase active:scale-95 cursor-pointer disabled:opacity-45"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
