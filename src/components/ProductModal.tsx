import React, { useState, useEffect, useRef } from 'react';
import { Product, Category } from '../types';
import { compressImage } from '../utils/imageCompression';
import { AlertCircle, Camera } from 'lucide-react';

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
    } else {
      setCategoria('Cascos');
      setDescripcion('');
      setStock(1);
      setImagen('');
    }
    setErrorMessage('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona una foto de tipo imagen válida.');
      return;
    }

    setIsCompacting(true);
    setErrorMessage('');
    try {
      // Compress to lightweight friendly format (max 480px width)
      const compressedBase64 = await compressImage(file, 480, 0.75);
      setImagen(compressedBase64);
    } catch (err) {
      console.error('Error compressing image:', err);
      setErrorMessage('Fallo al procesar o comprimir la imagen.');
    } finally {
      setIsCompacting(false);
    }
  };

  const handleSelectDefaultPlaceholder = () => {
    // Generate inline high-quality monochrome svg base64 based on current metadata
    const cleanTitle = descripcion.trim().substring(0, 18) || 'Accesorio';
    const svgStr = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f4f4f5"/><rect width="112" height="112" x="4" y="4" fill="none" stroke="%2318181b" stroke-width="2"/><text x="50%" y="40%" font-family="monospace" font-size="11" font-weight="900" fill="%2371717a" dominant-baseline="middle" text-anchor="middle">${categoria.toUpperCase()}</text><text x="50%" y="65%" font-family="sans-serif" font-size="9" font-weight="800" fill="%2318181b" dominant-baseline="middle" text-anchor="middle">${cleanTitle}</text><circle cx="60" cy="90" r="3" fill="%23d4d4d8"/></svg>`;
    setImagen(svgStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setErrorMessage('Escribe el nombre o descripción del accesorio.');
      return;
    }

    if (stock < 0) {
      setErrorMessage('La cantidad en stock no puede ser negativa.');
      return;
    }

    let finalImage = imagen;
    if (!finalImage) {
      // Auto-assign clean symbol if none provided
      const cleanTitle = descripcion.trim().substring(0, 18);
      finalImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f4f4f5"/><rect width="112" height="112" x="4" y="4" fill="none" stroke="%2318181b" stroke-width="2"/><text x="50%" y="40%" font-family="monospace" font-size="11" font-weight="900" fill="%2371717a" dominant-baseline="middle" text-anchor="middle">${categoria.toUpperCase()}</text><text x="50%" y="65%" font-family="sans-serif" font-size="9" font-weight="800" fill="%2318181b" dominant-baseline="middle" text-anchor="middle">${cleanTitle}</text><circle cx="60" cy="90" r="3" fill="%23d4d4d8"/></svg>`;
    }

    try {
      await onSave({
        categoria,
        descripcion: descripcion.trim(),
        stock,
        imagen: finalImage,
        ...(productToEdit ? { id: productToEdit.id } : {}),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(`Ocurrió un problema: ${err.message || err}`);
    }
  };

  const categories: Category[] = ['Cascos', 'Llantas', 'Impermeables', 'Defensas', 'Parrillas', 'Lujos'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-[393px] rounded-3xl border-3 border-black shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Header Modal, highly readable iOS style */}
        <div className="bg-zinc-100 border-b-2 border-black p-4 flex items-center justify-between">
          <h2 className="text-base font-black text-black uppercase font-mono">
            {productToEdit ? '📝 Modificar Accesorio' : '➕ Registrar Accesorio'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-black hover:bg-zinc-100 text-black cursor-pointer"
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
            <label className="block text-[11px] font-black text-zinc-550 uppercase font-mono tracking-wider">
              Categoría del accesorio
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((cat) => {
                const isSelected = categoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={`py-2 px-1 rounded-xl text-center border-2 font-black transition-all text-xs flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-50 text-black border-zinc-200 hover:border-black'
                    }`}
                  >
                    <span className="text-[15px]">{CATEGORY_ICONS[cat]}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-zinc-550 uppercase font-mono tracking-wider">
              Nombre o descripción del accesorio
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. CASCO SHAFT MATE XL ROJO"
              rows={2}
              className="w-full bg-white border-2 border-black rounded-xl p-3 text-[14px] font-black text-black placeholder-zinc-400 focus:outline-none uppercase"
            />
          </div>

          {/* Simple quantity numeric box with touch-friendly step helper */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-zinc-550 uppercase font-mono tracking-wider">
              Cantidad inicial en Stock
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStock((prev) => Math.max(0, prev - 1))}
                className="w-12 h-12 bg-zinc-100 hover:bg-zinc-200 border-2 border-black rounded-xl text-black font-black text-lg flex items-center justify-center active:scale-95 cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 h-12 bg-white border-2 border-black rounded-xl text-center text-[16px] font-black text-black font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setStock((prev) => prev + 1)}
                className="w-12 h-12 bg-zinc-100 hover:bg-zinc-200 border-2 border-black rounded-xl text-black font-black text-lg flex items-center justify-center active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
            <p className="text-[10px] text-zinc-450 font-medium">
              * El color del borde será <span className="ring-2 ring-amber-400 bg-amber-50 text-amber-900 font-bold px-1 rounded">Amarillo</span> si dejas 1 o 2 unidades en total.
            </p>
          </div>

          {/* Live photo upload controls */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black text-zinc-550 uppercase font-mono tracking-wider">
              Fotografía del accesorio
            </label>

            <div className="border-2 border-dashed border-black rounded-2xl p-4 bg-zinc-50 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[140px]">
              
              {imagen ? (
                <div className="space-y-3 w-full">
                  <div className="relative w-24 h-24 mx-auto rounded-xl border-2 border-black overflow-hidden bg-white shadow-sm">
                    <img src={imagen} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagen('')}
                      className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-1.5 py-0.5 font-bold uppercase transition-transform scale-95 hover:scale-100 cursor-pointer"
                    >
                      Quitar
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold block truncate max-w-[200px] mx-auto">
                    Foto cargada con éxito ✓
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto text-black shadow-xs">
                    {isCompacting ? (
                      <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompacting}
                      className="text-xs font-black underline text-black hover:text-zinc-750 uppercase cursor-pointer block mx-auto"
                    >
                      Tomar foto con Cámara o subir Archivo
                    </button>
                    <p className="text-[9px] text-zinc-450 mt-1">Soporta PNG, JPEG de cualquier tamaño.</p>
                  </div>
                </div>
              )}

              {/* Secret input trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment" // Forces native cellular phone camera dialog of iOS or Android
                className="hidden"
              />
            </div>

            {/* Quick Helper Default Button */}
            {!imagen && (
              <button
                type="button"
                onClick={handleSelectDefaultPlaceholder}
                className="w-full bg-zinc-100 hover:bg-zinc-200 border border-black rounded-lg py-1.5 text-[10px] font-mono font-black text-black uppercase cursor-pointer"
              >
                🛡️ Omitir: Usar Sello Predeterminado
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t-2 border-black flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-zinc-50 border-2 border-black py-3 rounded-2xl text-[13px] font-black text-black uppercase transition-transform active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCompacting}
              className="flex-1 bg-black hover:bg-zinc-900 border-2 border-black py-3 rounded-2xl text-[13px] font-black text-white uppercase transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
            >
              🛠️ Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
