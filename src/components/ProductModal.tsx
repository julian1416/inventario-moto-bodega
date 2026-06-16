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

const formatPriceWithDots = (val: string): string => {
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

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
  const [precio, setPrecio] = useState<string>('');
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
      setPrecio(productToEdit.precio !== undefined && productToEdit.precio !== null ? String(productToEdit.precio) : '');

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
      setPrecio('');
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
    const svgStr = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23FAFAFA"/><rect width="112" height="112" x="4" y="4" fill="none" stroke="%23E4E4E7" stroke-width="1.5"/><text x="50%" y="40%" font-family="sans-serif" font-size="11" font-weight="750" fill="%2371717A" dominant-baseline="middle" text-anchor="middle">${categoria.toUpperCase()}</text><text x="50%" y="65%" font-family="sans-serif" font-size="9" font-weight="700" fill="%2318181B" dominant-baseline="middle" text-anchor="middle">${cleanTitle}</text></svg>`;
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
      finalImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23FAFAFA"/><rect width="112" height="112" x="4" y="4" fill="none" stroke="%23E4E4E7" stroke-width="1.5"/><text x="50%" y="40%" font-family="sans-serif" font-size="11" font-weight="750" fill="%2371717A" dominant-baseline="middle" text-anchor="middle">${categoria.toUpperCase()}</text><text x="50%" y="65%" font-family="sans-serif" font-size="9" font-weight="700" fill="%2318181B" dominant-baseline="middle" text-anchor="middle">${cleanTitle}</text></svg>`;
    }

    try {
      const pDigits = precio.replace(/\D/g, '');
      await onSave({
        categoria,
        descripcion: descripcion.trim(),
        stock: finalStock,
        imagen: finalImage,
        tallas: isSizeCategory ? tallasStock : undefined,
        precio: categoria === 'Llantas' ? (pDigits ? Number(pDigits) : 0) : undefined,
        ...(productToEdit ? { id: productToEdit.id } : {}),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(`Ocurrió un problema: ${err.message || err}`);
    }
  };

  const categories: Category[] = ['Cascos', 'Llantas', 'Impermeables', 'Defensas', 'Parrillas', 'Lujos'];

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-[370px] rounded-[28px] border border-zinc-100 shadow-xl overflow-hidden flex flex-col my-auto max-h-[85vh]">
        
        {/* Header Modal - Premium iOS style */}
        <div className="bg-white border-b border-zinc-100 p-4.5 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-zinc-950 uppercase tracking-wide">
            {productToEdit ? 'Modificar Artículo' : 'Nuevo Artículo'}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold text-zinc-500 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 text-red-950 text-xs font-semibold leading-tight">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
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
                    className={`py-2 px-1 rounded-xl text-center border font-semibold transition-all text-[11px] flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                        : 'bg-zinc-50 text-zinc-650 border-zinc-200/60 hover:border-zinc-300'
                    }`}
                  >
                    <span className="text-[13px]">{CATEGORY_ICONS[cat]}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
              Nombre o descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. CASCO SHAFT MATE ROJO"
              rows={2}
              className="w-full bg-zinc-50/60 hover:bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-[13px] font-semibold text-zinc-950 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-200 uppercase transition-all"
            />
          </div>

          {/* PRECIO DE VENTA (SOLO PARA LLANTAS) */}
          {categoria === 'Llantas' && (
            <div className="space-y-1.5 p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
                🏷️ Precio de Venta (COP)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-base font-bold text-zinc-500">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatPriceWithDots(precio)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    setPrecio(rawValue);
                  }}
                  placeholder="0"
                  className="w-full bg-white border border-zinc-200 rounded-xl py-2.5 pl-8 pr-4 text-base font-bold text-zinc-950 font-mono focus:outline-none focus:border-zinc-300 transition-all"
                />
              </div>
              <span className="block text-[8px] font-semibold text-zinc-400 font-mono text-right uppercase leading-none mt-1">
                Se formateará automáticamente con puntos
              </span>
            </div>
          )}

          {/* SIZES STOCK MULTI-INPUT (FOR CASCOS & IMPERMEABLES) */}
          {(categoria === 'Cascos' || categoria === 'Impermeables') ? (
            <div className="space-y-2 bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans mb-1.5">
                Cantidad por Tallas
              </label>
              <div className="space-y-1.5">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                  const currentSizeVal = tallasStock[size] || 0;
                  return (
                    <div key={size} className="flex items-center justify-between bg-white border border-zinc-100 rounded-xl px-3 py-1.5">
                      <span className="font-semibold text-[10px] text-zinc-800 bg-zinc-100 w-5 h-5 flex items-center justify-center rounded-md font-mono">
                        {size}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTallasStock(prev => ({ ...prev, [size]: Math.max(0, prev[size] - 1) }))}
                          className="w-7 h-7 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 rounded-lg text-zinc-800 font-bold text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono text-zinc-900">
                          {currentSizeVal}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTallasStock(prev => ({ ...prev, [size]: (prev[size] || 0) + 1 }))}
                          className="w-7 h-7 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 rounded-lg text-zinc-800 font-bold text-sm flex items-center justify-center active:scale-90 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-right text-[10px] font-bold text-zinc-400 font-mono tracking-wide uppercase mt-2">
                TOTAL: <span className="text-zinc-900 font-extrabold">{Object.values(tallasStock).reduce((acc, curr) => acc + curr, 0)} uds</span>
              </div>
            </div>
          ) : (
            /* General Single Quantity stepper for other categories */
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
                Cantidad en Stock
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStock((prev) => Math.max(0, prev - 1))}
                  className="w-10 h-10 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-800 font-bold text-lg flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
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
          )}

          {/* Live photo upload controls */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
              Fotografía (Opcional)
            </label>

            <div className="border border-dashed border-zinc-200 rounded-xl p-3 bg-zinc-50 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[110px]">
              {imagen ? (
                <div className="space-y-2 w-full">
                  <div className="relative w-20 h-20 mx-auto rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50 shadow-xs">
                    <img src={imagen} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setImagen('')}
                      className="absolute top-0 right-0 bg-zinc-900/90 text-white text-[8px] px-1.5 py-0.5 font-bold uppercase cursor-pointer rounded-bl"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center mx-auto text-zinc-750 shadow-xs">
                    {isCompacting ? (
                      <div className="w-4 h-4 border border-t-transparent border-zinc-900 rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompacting}
                      className="text-[11px] font-bold underline text-zinc-800 hover:text-zinc-650 uppercase cursor-pointer"
                    >
                      Tomar foto o subir
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
                className="w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 rounded-lg py-1.5 text-[9px] font-mono font-bold text-zinc-500 uppercase cursor-pointer"
              >
                Omitir: Usar Sello
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3.5 border-t border-zinc-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-50 hover:bg-zinc-100 rounded-xl py-2.5 text-[12px] font-bold text-zinc-700 uppercase active:scale-95 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCompacting}
              className="flex-1 bg-zinc-950 hover:bg-zinc-900 rounded-xl py-2.5 text-[12px] font-bold text-white uppercase active:scale-95 cursor-pointer disabled:opacity-45 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
