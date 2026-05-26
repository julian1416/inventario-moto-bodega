import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import { X, Save, Camera, Upload } from 'lucide-react';
import { compressImage } from '../utils/imageCompression';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> & { id?: string; imagen?: string }) => void;
  productToEdit?: Product | null;
}

const CATEGORIES: Category[] = ['Cascos', 'Llantas', 'Impermeables', 'Defensas', 'Parrillas', 'Lujos'];

export function ProductModal({ isOpen, onClose, onSave, productToEdit }: ProductModalProps) {
  const [categoria, setCategoria] = useState<Category>('Cascos');
  const [descripcion, setDescripcion] = useState('');
  const [stock, setStock] = useState<number>(1);
  const [imagen, setImagen] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Sync edits
  useEffect(() => {
    if (productToEdit) {
      setCategoria(productToEdit.categoria);
      setDescripcion(productToEdit.descripcion);
      setStock(productToEdit.stock);
      setImagen(productToEdit.imagen);
    } else {
      setCategoria('Cascos');
      setDescripcion('');
      setStock(1);
      setImagen(undefined);
    }
    setErrorMsg('');
    setIsCompressing(false);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setErrorMsg('');
      // Downscale to ~440px to ensure extremely fast SQLite/localStorage flow under 20KB space
      const base64 = await compressImage(file, 440, 440, 0.7);
      setImagen(base64);
    } catch (err) {
      console.error(err);
      setErrorMsg('No pudimos procesar la foto seleccionada. Intenta capturar una de menor resolución.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!descripcion.trim()) {
      setErrorMsg('Por favor escribe la descripción del accesorio.');
      return;
    }

    onSave({
      id: productToEdit?.id,
      categoria,
      descripcion: descripcion.trim(),
      stock: Math.max(0, stock),
      imagen,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      {/* Click outside to turn off */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>

      {/* Slide-Up container inspired by native iOS sheets */}
      <div className="bg-white text-black w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border-2 border-black overflow-y-auto max-h-[92vh] flex flex-col p-6 animate-slide-up">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-zinc-200 mb-4">
          <h2 className="text-[20px] font-black text-black flex items-center gap-1.5">
            {productToEdit ? '📝 Modificar Accesorio' : '➕ Nuevo Accesorio'}
          </h2>
          <button
            onClick={onClose}
            className="w-[44px] h-[44px] bg-zinc-100 hover:bg-zinc-200 rounded-full text-black flex items-center justify-center border-2 border-black"
            title="Cerrar"
            id="close-modal-btn"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-2 border-red-500 text-red-900 px-4 py-3 rounded-xl font-bold text-sm mb-4">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 pb-4 text-left">
          
          {/* Categoría simple */}
          <div>
            <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 font-mono">
              PARTE / CATEGORÍA
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  className={`py-2 px-1 rounded-xl text-xs font-black border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    categoria === cat
                      ? 'bg-black text-white border-black scale-[1.02]'
                      : 'bg-white text-zinc-800 border-zinc-300 hover:border-black'
                  }`}
                  style={{ minHeight: '58px' }}
                >
                  <span className="text-base">
                    {cat === 'Cascos' && '🪖'}
                    {cat === 'Llantas' && '🛞'}
                    {cat === 'Impermeables' && '🧥'}
                    {cat === 'Defensas' && '🛡️'}
                    {cat === 'Parrillas' && '🎒'}
                    {cat === 'Lujos' && '✨'}
                  </span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Único Campo de Descripción Completo */}
          <div>
            <label htmlFor="description-input" className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 font-mono">
              Escribe el producto, talla, marca y modelo de moto
            </label>
            <textarea
              id="description-input"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Llanta 130/70-17 Kenda doble propósito para Pulsar NS200"
              rows={3}
              className="w-full bg-white border-2 border-black rounded-xl p-3.5 text-[16px] font-black text-black focus:outline-none focus:ring-2 focus:ring-black placeholder:text-zinc-450 placeholder:font-normal"
            />
          </div>

          {/* iPhone 15 Camera action */}
          <div>
            <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 font-mono">
              TOMAR FOTO CON EL CELULAR
            </label>
            <div className="bg-zinc-50 border-2 border-black rounded-xl p-3 flex gap-4 items-center">
              {/* Image Preview */}
              <div className="w-[78px] h-[78px] bg-zinc-200 border-2 border-black rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                {imagen ? (
                  <img
                    src={imagen}
                    alt="Vista previa"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-1 font-mono text-[9px] font-bold text-zinc-450 leading-tight">
                    SIN FOTO
                  </div>
                )}
                {isCompressing && (
                  <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                    <span className="text-[10px] font-black animate-spin">⏳</span>
                  </div>
                )}
              </div>

              {/* Botones de cámara (con hitbox de 44x44px) */}
              <div className="flex-1 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <label
                    className="bg-black hover:bg-zinc-900 text-white font-black text-xs px-2 py-3 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer border-2 border-black select-none text-center"
                    style={{ minHeight: '44px' }}
                    title="Usar cámara del iPhone"
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>Tomar Foto</span>
                    <input
                      type="file"
                      id="camera-capture-trigger"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>

                  <label
                    className="bg-white hover:bg-zinc-150 text-black font-black text-xs px-2 py-3 rounded-lg active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer border-2 border-black select-none text-center"
                    style={{ minHeight: '44px' }}
                    title="Elegir foto existente"
                  >
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>Elegir Foto</span>
                    <input
                      type="file"
                      id="gallery-select-trigger"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {imagen && (
                  <button
                    type="button"
                    onClick={() => setImagen(undefined)}
                    className="text-[10px] font-black text-red-650 hover:text-red-900 underline block"
                  >
                    Quitar foto cargada
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Ajustar Stock */}
          <div>
            <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2 font-mono">
              STOCK INICIAL EN BODEGA
            </label>
            <div className="flex items-center gap-4 bg-zinc-50 p-2.5 rounded-xl border-2 border-black">
              <button
                type="button"
                onClick={() => setStock(s => Math.max(0, s - 1))}
                className="w-12 h-12 rounded-lg bg-white border-2 border-black hover:bg-zinc-200 text-black font-extrabold text-2xl flex items-center justify-center cursor-pointer active:scale-90 select-none"
                style={{ minWidth: '48px', minHeight: '48px' }}
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-black text-black">{stock}</span>
                <span className="text-[10px] block font-black text-zinc-500 uppercase">Unidades</span>
              </div>
              <button
                type="button"
                onClick={() => setStock(s => s + 1)}
                className="w-12 h-12 rounded-lg bg-black border-2 border-black text-white font-extrabold text-2xl flex items-center justify-center cursor-pointer active:scale-90 select-none active:bg-zinc-800"
                style={{ minWidth: '48px', minHeight: '48px' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Botones de acción del formulario */}
          <div className="pt-4 border-t-2 border-zinc-200 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-zinc-50 text-black font-black py-3 rounded-lg text-center active:scale-95 transition-transform border-2 border-black"
              style={{ minHeight: '44px' }}
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isCompressing}
              className={`flex-1 bg-black hover:bg-zinc-900 text-white font-black py-3 rounded-lg text-center active:scale-95 transition-transform flex items-center justify-center gap-1.5 border-2 border-black ${
                isCompressing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ minHeight: '44px' }}
            >
              <Save className="w-4.5 h-4.5" />
              <span>{isCompressing ? 'Procesando...' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
