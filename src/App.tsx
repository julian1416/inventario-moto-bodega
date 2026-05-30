import { useState, useEffect } from 'react';
import { Product, Category } from './types';
import { INITIAL_PRODUCTS } from './data';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { DuplicateModal } from './components/DuplicateModal';
import { Search, Plus, Mic, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from './supabaseClient';
import { fetchProducts, saveProduct, deleteProduct, updateProductStock } from './supabaseService';
import { parseProductDescription, formatProductDescription } from './utils/productUtils';

const LOCAL_STORAGE_KEY = 'moto_bodega_products_v2';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todas'>('Todas');
  const [stockFilter, setStockFilter] = useState<'todos' | 'bajo_stock' | 'sin_stock'>('todos');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbMode, setDbMode] = useState<'cloud' | 'local'>('local');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Duplication Modal State
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [productToDuplicate, setProductToDuplicate] = useState<Product | null>(null);

  // Sync state helpers
  const getLocalBackup = (): Product[] => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const rawList = JSON.parse(saved) as Product[];
        return rawList.map((p) => {
          if ((p.categoria === 'Cascos' || p.categoria === 'Impermeables') && !p.tallas) {
            const parsed = parseProductDescription(p.descripcion, p.categoria);
            return {
              ...p,
              descripcion: parsed.descripcionLimpia,
              tallas: parsed.tallas,
            };
          }
          return p;
        });
      } catch (e) {
        console.error('Error parsed inventory backup', e);
      }
    }
    
    // Process default items
    return INITIAL_PRODUCTS.map((p) => {
      const parsed = parseProductDescription(p.descripcion, p.categoria);
      return {
        ...p,
        descripcion: parsed.descripcionLimpia,
        tallas: parsed.tallas,
      };
    });
  };

  const saveLocalBackup = (list: Product[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  };

  const loadInventory = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsLoading(true);
    }

    const initialLocalItems = getLocalBackup();
    if (products.length === 0) {
      setProducts(initialLocalItems);
    }

    if (!isSupabaseConfigured) {
      setDbMode('local');
      setIsLoading(false);
      return;
    }

    try {
      const cloudProducts = await fetchProducts();
      setProducts(cloudProducts);
      saveLocalBackup(cloudProducts);
      setDbMode('cloud');
    } catch (err: any) {
      console.warn('Supabase connect error, using local mode:', err);
      setDbMode('local');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSaveState = (updatedList: Product[]) => {
    setProducts(updatedList);
    saveLocalBackup(updatedList);
  };

  const handleIncreaseStock = async (id: string) => {
    const targetProduct = products.find((p) => p.id === id);
    if (!targetProduct) return;
    const nextStock = targetProduct.stock + 1;

    const updated = products.map((p) => (p.id === id ? { ...p, stock: nextStock } : p));
    setProducts(updated);

    if (dbMode === 'cloud') {
      try {
        await updateProductStock(id, nextStock);
      } catch (e: any) {
        console.error('Failed to sync stock increase in cloud', e);
        loadInventory();
      }
    } else {
      handleSaveState(updated);
    }
  };

  const handleDecreaseStock = async (id: string) => {
    const targetProduct = products.find((p) => p.id === id);
    if (!targetProduct) return;
    const nextStock = Math.max(0, targetProduct.stock - 1);

    const updated = products.map((p) => (p.id === id ? { ...p, stock: nextStock } : p));
    setProducts(updated);

    if (dbMode === 'cloud') {
      try {
        await updateProductStock(id, nextStock);
      } catch (e: any) {
        console.error('Failed to sync stock decrease in cloud', e);
        loadInventory();
      }
    } else {
      handleSaveState(updated);
    }
  };

  const handleUpdateSizeStock = async (id: string, size: string, change: number) => {
    const targetProduct = products.find((p) => p.id === id);
    if (!targetProduct) return;

    const currentTallas = targetProduct.tallas || { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
    const currentSzValue = currentTallas[size] || 0;
    const nextSzValue = Math.max(0, currentSzValue + change);

    const nextTallas = {
      ...currentTallas,
      [size]: nextSzValue,
    };

    const nextStock = Object.values(nextTallas).reduce((acc, curr) => acc + curr, 0);
    const dbDescription = formatProductDescription(targetProduct.descripcion, targetProduct.categoria, nextTallas);

    const updated = products.map((p) => (p.id === id ? { ...p, stock: nextStock, tallas: nextTallas } : p));
    setProducts(updated);

    if (dbMode === 'cloud') {
      try {
        await updateProductStock(id, nextStock, dbDescription);
      } catch (e: any) {
        console.error('Failed to sync size stock in cloud', e);
        loadInventory();
      }
    } else {
      handleSaveState(updated);
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'> & { id?: string; imagen?: string }) => {
    setIsLoading(true);
    if (dbMode === 'cloud') {
      try {
        const saved = await saveProduct(productData);
        if (productData.id) {
          const updated = products.map((p) => (p.id === productData.id ? saved : p));
          setProducts(updated);
          saveLocalBackup(updated);
        } else {
          const updated = [saved, ...products];
          setProducts(updated);
          saveLocalBackup(updated);
        }
      } catch (e: any) {
        console.error('Error saving product to Supabase', e);
        alert(`Error al guardar: ${e.message || e}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      if (productData.id) {
        const updated = products.map((p) => 
          p.id === productData.id ? ({ ...p, ...productData } as Product) : p
        );
        handleSaveState(updated);
      } else {
        const newProduct: Product = {
          ...(productData as Omit<Product, 'id'>),
          id: String(Date.now()),
        };
        handleSaveState([newProduct, ...products]);
      }
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);

    if (dbMode === 'cloud') {
      setIsLoading(true);
      try {
        await deleteProduct(id);
        saveLocalBackup(updated);
      } catch (e: any) {
        console.error('Failed to delete in Supabase', e);
        loadInventory();
      } finally {
        setIsLoading(false);
      }
    } else {
      handleSaveState(updated);
    }
  };

  const handleDuplicateProduct = (pToDuplicate: Product) => {
    setProductToDuplicate(pToDuplicate);
    setIsDuplicateModalOpen(true);
  };

  const handleConfirmDuplicate = async (baseProduct: Product, _newSize: string, newStock: number, newDesc: string) => {
    setIsLoading(true);
    const duplicatedPayload = {
      categoria: baseProduct.categoria,
      descripcion: newDesc,
      stock: newStock,
      imagen: baseProduct.imagen,
      precio: baseProduct.precio,
    };

    if (dbMode === 'cloud') {
      try {
        const saved = await saveProduct(duplicatedPayload);
        const updated = [saved, ...products];
        setProducts(updated);
        saveLocalBackup(updated);
      } catch (e: any) {
        console.error('Error duplicating in cloud', e);
        alert(`Fallo al duplicar en la nube: ${e.message}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      const cloned: Product = {
        ...duplicatedPayload,
        id: String(Date.now() + Math.floor(Math.random() * 1050)),
      };
      handleSaveState([cloned, ...products]);
      setIsLoading(false);
    }
  };

  const handleSeedCloudDatabase = async () => {
    if (!window.confirm('¿Quieres cargar la lista inicial de 15 productos en su base de datos Supabase?')) {
      return;
    }
    setIsLoading(true);
    try {
      for (const item of INITIAL_PRODUCTS) {
        await saveProduct({
          categoria: item.categoria,
          descripcion: item.descripcion,
          stock: item.stock,
          imagen: item.imagen,
          precio: item.precio,
        });
      }
      await loadInventory(true);
      alert('¡Base de datos Supabase inicializada con éxito!');
    } catch (e: any) {
      console.error('Failed to seed DB:', e);
      alert(`Error: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportInventory = () => {
    const headers = 'Categoría;Descripción;Cantidad en Stock\n';
    const rows = products
      .map((p) => `"${p.categoria}";"${(p.descripcion || '').replace(/"/g, '""')}";${p.stock}`)
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario_bodega_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta búsqueda por voz nativa. Se sugiere abrir en Google Chrome o Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CO';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript;
        if (text) {
          const cleanText = text.replace(/\.$/, '');
          setSearchQuery(cleanText);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'Todas' && p.categoria !== selectedCategory) {
      return false;
    }

    if (stockFilter === 'bajo_stock' && (p.stock > 2 || p.stock === 0)) return false;
    if (stockFilter === 'sin_stock' && p.stock > 0) return false;

    if (!searchQuery.trim()) return true;

    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const productText = `${p.descripcion} ${p.categoria}`.toLowerCase();

    return keywords.every((kw) => productText.includes(kw));
  });

  const categoriesList: (Category | 'Todas')[] = ['Todas', 'Cascos', 'Llantas', 'Impermeables', 'Defensas', 'Parrillas', 'Lujos'];

  return (
    <div className="bg-[#FFFFFF] min-h-screen text-black flex items-center justify-center p-0 sm:p-4 font-sans selection:bg-black selection:text-white pb-safe pt-safe">
      
      {/* Device wrapper simulating real iPhone 15 frame, elegant corners, safe area */}
      <div className="w-full sm:w-[393px] h-screen sm:h-[800px] bg-white sm:shadow-[0_0_50px_rgba(0,0,0,0.15)] sm:rounded-[55px] sm:border-[12px] sm:border-black relative overflow-hidden flex flex-col">
        
        {/* Safe Area Notch & iPhone Status Bar design */}
        <div className="w-full h-9 flex justify-between px-8 items-end pb-1 shrink-0 bg-white select-none border-b border-zinc-150 relative z-50">
          <span className="text-[13px] font-black text-black">9:41</span>
          {/* Dynamic Island spacer */}
          <div className="w-[110px] h-[25px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5 sm:block hidden"></div>
          <div className="flex gap-1.5 items-center">
            <span className="text-[10px] font-black tracking-tighter text-black mr-0.5">LTE</span>
            <div className="w-3.5 h-3 bg-black rounded-xs"></div>
          </div>
        </div>

        {/* Ultra-compact minimal header with integrated CSV Export link */}
        <Header products={products} onExport={handleExportInventory} />

        {/* Instant Search Bar & Filter buttons with high visual contrast */}
        <div className="bg-white px-5 py-3 shrink-0 space-y-2.5 border-b border-zinc-150 relative z-40 shadow-xs">
          
          {/* Search box with large target reach */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isListening ? "Dictando..." : "Buscar accesorio..."}
              className={`w-full h-[46px] bg-zinc-50 border-2 border-black rounded-xl pl-11 pr-24 text-[14px] focus:outline-none placeholder-zinc-400 font-extrabold text-black transition-all ${
                isListening ? 'border-red-500 bg-red-50/10 ring-2 ring-red-400' : ''
              }`}
              id="search-input-box"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black w-4.5 h-4.5 pointer-events-none stroke-[2.5]" />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-7 h-7 rounded-lg bg-zinc-200 text-black font-black flex items-center justify-center border border-black cursor-pointer active:scale-90 transition-transform text-[11px]"
                  title="Limpiar"
                >
                  ✕
                </button>
              )}
              
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-red-600 border-black text-white animate-pulse shadow-md'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-black text-black'
                }`}
                title="Dictar búsqueda por voz"
              >
                <Mic className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Compact Category Switcher with Horizontal Swipe */}
          <div className="space-y-1">
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar scrollbar-none snap-x touch-pan-x">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-[12px] font-black rounded-lg whitespace-nowrap border-2 snap-start cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-650 border-zinc-200 hover:border-black'
                    }`}
                  >
                    {cat === 'Todas' && '🌐 Todas'}
                    {cat === 'Cascos' && '🪖 Cascos'}
                    {cat === 'Llantas' && '🛞 Llantas'}
                    {cat === 'Impermeables' && '🧥 Impermeables'}
                    {cat === 'Defensas' && '🛡️ Defensas'}
                    {cat === 'Parrillas' && '🎒 Parrillas'}
                    {cat === 'Lujos' && '✨ Lujos'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick stock status switcher */}
          <div className="flex gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200">
            <button
              onClick={() => setStockFilter('todos')}
              className={`flex-1 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'todos' ? 'bg-black text-white' : 'bg-transparent text-zinc-500'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStockFilter('bajo_stock')}
              className={`flex-1 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'bajo_stock' ? 'bg-amber-100 text-amber-950 border border-transparent' : 'bg-transparent text-zinc-500'
              }`}
            >
              ⚠️ Por Agotar
            </button>
            <button
              onClick={() => setStockFilter('sin_stock')}
              className={`flex-1 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'sin_stock' ? 'bg-red-100 text-red-950 border border-transparent' : 'bg-transparent text-zinc-500'
              }`}
            >
              🚫 Agotados
            </button>
          </div>
        </div>

        {/* Scrollable products screen */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-white pb-32 relative">
          
          {/* Transparent inline loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center p-4">
              <RefreshCw className="w-8 h-8 text-black animate-spin mb-2" />
              <span className="text-xs font-black uppercase tracking-wider font-mono text-zinc-500">Sincronizando...</span>
            </div>
          )}

          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
              Accesorios: {filteredProducts.length}
            </span>
            {(searchQuery || selectedCategory !== 'Todas' || stockFilter !== 'todos') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Todas');
                  setStockFilter('todos');
                }}
                className="text-[10px] font-black text-black underline uppercase cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="space-y-2">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onIncreaseStock={handleIncreaseStock}
                  onDecreaseStock={handleDecreaseStock}
                  onEdit={(pToEdit) => {
                    setProductToEdit(pToEdit);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteProduct}
                  onDuplicate={handleDuplicateProduct}
                  onUpdateSizeStock={handleUpdateSizeStock}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border text-center my-4 p-8 rounded-2xl border-zinc-200">
              <span className="text-3xl block mb-2 select-none">📦</span>
              <h3 className="text-sm font-black text-black mb-1">Sin Coincidencias</h3>
              
              {products.length === 0 ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-zinc-450 max-w-xs mx-auto leading-relaxed">
                    No hay ningún accesorio cargado.
                  </p>
                  <button
                    onClick={handleSeedCloudDatabase}
                    className="w-full bg-black hover:bg-zinc-900 text-white font-black py-2.5 rounded-xl text-xs border-2 border-black active:scale-95 transition-transform uppercase cursor-pointer"
                  >
                    🚀 Cargar 15 Artículos
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-zinc-450 max-w-xs mx-auto mb-3">
                    Ningún accesorio coincide con los filtros aplicados.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Todas');
                      setStockFilter('todos');
                    }}
                    className="bg-black text-white hover:bg-zinc-900 font-extrabold px-3 py-1.5 rounded-lg text-[10px] border border-black active:scale-95 transition-transform uppercase"
                  >
                    Limpiar Búsqueda
                  </button>
                </>
              )}
            </div>
          )}
        </main>

        {/* SOLID STICKY BOTTOM MENU / FOOTER */}
        <div className="bg-white border-t-2 border-black px-5 py-3.5 flex items-center justify-between shrink-0 relative z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] pb-7">
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black uppercase text-zinc-400 font-mono tracking-wider">MOTO BODEGA</span>
            <span className="text-[12px] font-black text-black font-mono leading-none mt-1">
              {filteredProducts.length} DE {products.length} REGISTRADOS
            </span>
          </div>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-black hover:bg-zinc-950 border-2 border-black rounded-2xl flex items-center gap-1.5 px-4.5 py-2.5 text-[11px] font-black text-white active:scale-95 transition-all cursor-pointer shadow-md"
            title="Registrar nuevo accesorio"
            id="floating-new-product-btn"
          >
            <Plus className="w-4 h-4 stroke-[3.5]" />
            <span className="uppercase tracking-wide">NUEVO ARTÍCULO</span>
          </button>
        </div>

        {/* Physical Home Indicator representation */}
        <div className="absolute bottom-1 right-[130px] left-[130px] h-1 bg-black rounded-full select-none pointer-events-none sm:block hidden z-50"></div>
      </div>

      {/* PopUp iOS-style Dialog */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
      />

      {/* Duplicate / Clone by Size Dialog */}
      <DuplicateModal
        isOpen={isDuplicateModalOpen}
        onClose={() => {
          setIsDuplicateModalOpen(false);
          setProductToDuplicate(null);
        }}
        product={productToDuplicate}
        onDuplicateConfirm={handleConfirmDuplicate}
      />
    </div>
  );
}
