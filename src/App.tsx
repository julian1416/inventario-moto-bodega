import { useState, useEffect } from 'react';
import { Product, Category } from './types';
import { INITIAL_PRODUCTS } from './data';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { Search, Plus, Download, Mic, RefreshCw, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from './supabaseClient';
import { fetchProducts, saveProduct, deleteProduct, updateProductStock } from './supabaseService';

const LOCAL_STORAGE_KEY = 'moto_bodega_products_v2';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todas'>('Todas');
  const [stockFilter, setStockFilter] = useState<'todos' | 'bajo_stock' | 'sin_stock'>('todos');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbMode, setDbMode] = useState<'cloud' | 'local'>('local');
  const [networkError, setNetworkError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Sync state helpers
  const getLocalBackup = (): Product[] => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsed inventory backup', e);
      }
    }
    return INITIAL_PRODUCTS;
  };

  const saveLocalBackup = (list: Product[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  };

  /**
   * Optimized Load Inventory:
   * Render local backup cache immediately for zero block latency,
   * then attempt Supabase cloud lookup in the background.
   */
  const loadInventory = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsLoading(true);
    }
    setNetworkError(null);

    // Bootstrap with fallback items first so user never sees a blank locked screen
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
      saveLocalBackup(cloudProducts); // Cache local copy
      setDbMode('cloud');
    } catch (err: any) {
      console.warn('Supabase connect error, falling back to local mode:', err);
      setDbMode('local');
      
      const friendlyMessage = err.message?.includes('relation "productos" does not exist')
        ? 'La tabla "productos" no existe en Supabase.'
        : 'Error de red o conexión a la nube bloqueada.';
      setNetworkError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on start without blocking render
  useEffect(() => {
    loadInventory();
  }, []);

  // Save changes wrapper
  const handleSaveState = (updatedList: Product[]) => {
    setProducts(updatedList);
    saveLocalBackup(updatedList);
  };

  // Increase stock [+ 1]
  const handleIncreaseStock = async (id: string) => {
    const targetProduct = products.find((p) => p.id === id);
    if (!targetProduct) return;
    const nextStock = targetProduct.stock + 1;

    // Optimistic UI update for immediate response on tap
    const updated = products.map((p) => (p.id === id ? { ...p, stock: nextStock } : p));
    setProducts(updated);

    if (dbMode === 'cloud') {
      try {
        await updateProductStock(id, nextStock);
      } catch (e: any) {
        console.error('Failed to sync stock increase in cloud', e);
        alert('Fallo de red en la nube. Reintentando de manera local.');
        loadInventory();
      }
    } else {
      handleSaveState(updated);
    }
  };

  // Decrease stock [- 1]
  const handleDecreaseStock = async (id: string) => {
    const targetProduct = products.find((p) => p.id === id);
    if (!targetProduct) return;
    const nextStock = Math.max(0, targetProduct.stock - 1);

    // Optimistic UI update
    const updated = products.map((p) => (p.id === id ? { ...p, stock: nextStock } : p));
    setProducts(updated);

    if (dbMode === 'cloud') {
      try {
        await updateProductStock(id, nextStock);
      } catch (e: any) {
        console.error('Failed to sync stock decrease in cloud', e);
        alert('Fallo de red en la nube. Reintentando de manera local.');
        loadInventory();
      }
    } else {
      handleSaveState(updated);
    }
  };

  // Write/Edit Product completely
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
        alert(`Error al guardar en base de datos: ${e.message || e}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local flow
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

  // Delete product
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
        alert(`Error de sincronización: ${e.message || e}`);
        loadInventory();
      } finally {
        setIsLoading(false);
      }
    } else {
      handleSaveState(updated);
    }
  };

  // Duplicate accessories avoiding undefined name error
  const handleDuplicateProduct = async (pToDuplicate: Product) => {
    if (!pToDuplicate) return;
    setIsLoading(true);

    const originalDesc = pToDuplicate.descripcion || '';
    const duplicatedPayload = {
      categoria: pToDuplicate.categoria,
      descripcion: `${originalDesc} Copia`,
      stock: pToDuplicate.stock,
      imagen: pToDuplicate.imagen,
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
        id: String(Date.now() + Math.floor(Math.random() * 1000)),
      };
      handleSaveState([cloned, ...products]);
      setIsLoading(false);
    }
  };

  // Bulk Seed initial inventory into empty cloud database
  const handleSeedCloudDatabase = async () => {
    if (!window.confirm('¿Quieres cargar la lista inicial de 15 productos de Moto Bodega en tu Base de Datos de Supabase?')) {
      return;
    }
    setIsLoading(true);
    try {
      // Direct insertion sequential loop for stability
      for (const item of INITIAL_PRODUCTS) {
        await saveProduct({
          categoria: item.categoria,
          descripcion: item.descripcion,
          stock: item.stock,
          imagen: item.imagen // keeps beautiful default SVGs
        });
      }
      await loadInventory(true);
      alert('¡Base de Datos de Supabase inicializada con éxito con los 15 accesorios!');
    } catch (e: any) {
      console.error('Failed to seed DB:', e);
      alert(`Error al inicializar la base de datos: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Export database as a simple CSV file
  const handleExportInventory = () => {
    const headers = 'Categoría;Descripción;Cantidad en Stock\n';
    const rows = products
      .map((p) => `"${p.categoria}";"${(p.descripcion || '').replace(/"/g, '""')}";${p.stock}`)
      .join('\n');
    
    // Add UTF-8 byte order mark to ensure Excel decodes accents correctly (important for a 55yo native speaker!)
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario_bodega_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Native iOS and Android voice speech recognition
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta búsqueda por voz nativa. Te sugerimos abrir la app en Safari para iOS o Google Chrome.');
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

      recognition.onerror = (event: any) => {
        console.error('Error de voz:', event);
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
      console.error('Error al iniciar buscador por voz', e);
      setIsListening(false);
    }
  };

  // Instant real-time filtering directly matching words in any order
  const filteredProducts = products.filter((p) => {
    // 1. Filter by category
    if (selectedCategory !== 'Todas' && p.categoria !== selectedCategory) {
      return false;
    }

    // 2. Filter by stock alert levels (Por agotar <= 2, Agotados === 0)
    if (stockFilter === 'bajo_stock' && (p.stock > 2 || p.stock === 0)) return false;
    if (stockFilter === 'sin_stock' && p.stock > 0) return false;

    // 3. Real-time keyword filter (Matches words in any order)
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
        <div className="w-full h-9 flex justify-between px-8 items-end pb-1 shrink-0 bg-white select-none border-b border-zinc-100">
          <span className="text-[14px] font-black text-black">9:41</span>
          {/* Dynamic Island spacer */}
          <div className="w-[110px] h-[25px] bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5 sm:block hidden"></div>
          <div className="flex gap-1.5 items-center">
            <span className="text-[10px] font-black tracking-tighter text-black mr-0.5">LTE</span>
            <div className="w-3.5 h-3 bg-black rounded-xs"></div>
          </div>
        </div>

        {/* Ultra-compact minimal header */}
        <Header products={products} />

        {/* Database Connection Status Banner */}
        {isSupabaseConfigured ? (
          dbMode === 'cloud' ? (
            <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-1.5 flex items-center justify-between text-emerald-800 text-[10px] font-black uppercase tracking-wider font-mono shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                <span>Nube: Conexión Activa</span>
              </span>
              <button onClick={() => loadInventory(true)} className="hover:underline flex items-center gap-1 cursor-pointer">
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refrescar</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex flex-col gap-1 text-amber-950 text-[10px] font-bold font-mono shrink-0 leading-tight">
              <div className="flex items-center justify-between font-black uppercase text-[9px] tracking-wider text-amber-800">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Modo Local (Fallo de Nube)</span>
                </span>
                <button onClick={() => loadInventory(true)} className="underline uppercase flex items-center gap-0.5 cursor-pointer">
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Reintentar</span>
                </button>
              </div>
              {networkError && <span className="opacity-90">{networkError}</span>}
            </div>
          )
        ) : (
          <div className="bg-zinc-100 border-b border-zinc-200 px-5 py-1.5 flex items-center justify-between text-zinc-650 text-[10px] font-black uppercase tracking-wider font-mono shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block"></span>
              <span>Modo Local (LocalStorage)</span>
            </span>
            <span className="text-[9px]">Offline</span>
          </div>
        )}

        {/* Instant Search Bar & Filter buttons with high visual contrast */}
        <div className="bg-white px-5 py-3 shrink-0 space-y-3 border-b border-zinc-200">
          
          {/* Search box with large target reach */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isListening ? "Dictando... hable ahora" : "Buscar accesorio..."}
              className={`w-full h-[50px] bg-white border-2 border-black rounded-xl pl-11 pr-24 text-[15px] focus:outline-none placeholder-zinc-400 font-extrabold text-black transition-all ${
                isListening ? 'border-red-500 bg-red-50/20 ring-2 ring-red-400' : ''
              }`}
              id="search-input-box"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black w-5 h-5 pointer-events-none stroke-[2.5]" />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-black font-black flex items-center justify-center border-2 border-black cursor-pointer active:scale-90 transition-transform"
                  title="Limpiar"
                >
                  ✕
                </button>
              )}
              
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 transition-all active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-red-600 border-black text-white animate-pulse shadow-md'
                    : 'bg-zinc-100 hover:bg-zinc-250 border-black text-black'
                }`}
                title="Dictar búsqueda por voz"
                style={{ minWidth: '36px', minHeight: '36px' }}
              >
                <Mic className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Compact Category Switcher with Horizontal Swipe */}
          <div className="space-y-1">
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scrollbar-none snap-x touch-pan-x">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-[13px] font-black rounded-full whitespace-nowrap border-2 snap-start cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-zinc-200 hover:border-black'
                    }`}
                    style={{ minHeight: '38px' }}
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
          <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl border-2 border-black">
            <button
              onClick={() => setStockFilter('todos')}
              className={`flex-1 py-1.5 text-[12px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'todos' ? 'bg-black text-white' : 'bg-transparent text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Ver Todo
            </button>
            <button
              onClick={() => setStockFilter('bajo_stock')}
              className={`flex-1 py-1.5 text-[12px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'bajo_stock' ? 'bg-[#FEF3C7] text-[#92400E] border border-transparent' : 'bg-transparent text-zinc-700'
              }`}
            >
              ⚠️ Por Agotar
            </button>
            <button
              onClick={() => setStockFilter('sin_stock')}
              className={`flex-1 py-1.5 text-[12px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'sin_stock' ? 'bg-[#FEE2E2] text-[#991B1B] border border-transparent' : 'bg-transparent text-red-750'
              }`}
            >
              🚫 Agotados
            </button>
          </div>
        </div>

        {/* Scrollable products screen */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white pb-32 relative">
          
          {/* Transparent inline loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-30 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center p-4">
              <RefreshCw className="w-8 h-8 text-black animate-spin mb-2" />
              <span className="text-xs font-black uppercase tracking-wider font-mono text-zinc-650">Sincronizando...</span>
            </div>
          )}

          <div className="flex justify-between items-center px-1 mb-1">
            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest font-mono">
              Accesorios: {filteredProducts.length}
            </span>
            {(searchQuery || selectedCategory !== 'Todas' || stockFilter !== 'todos') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Todas');
                  setStockFilter('todos');
                }}
                className="text-[11px] font-black text-black underline uppercase cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="space-y-3">
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
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-black rounded-2xl p-6 text-center my-4">
              <span className="text-4xl block mb-2 select-none">📦</span>
              <h3 className="text-base font-black text-black mb-1">Bodega Vacía o Sin Coincidencias</h3>
              
              {products.length === 0 ? (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    No hay ningún accesorio cargado en el sistema. Puedes inicializar la base de datos con los 15 accesorios sugeridos de Moto Bodega.
                  </p>
                  <button
                    onClick={handleSeedCloudDatabase}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs border-2 border-black active:scale-95 transition-transform uppercase tracking-wider cursor-pointer"
                  >
                    🚀 Cargar Inventario Inicial (15 Artículos)
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-4">
                    Ningún accesorio de la categoría cumple con los términos buscados.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Todas');
                      setStockFilter('todos');
                    }}
                    className="bg-black text-white hover:bg-zinc-900 font-extrabold px-4 py-2.5 rounded-xl text-xs border-2 border-black active:scale-95 transition-transform uppercase tracking-wider"
                  >
                    Limpiar Búsqueda
                  </button>
                </>
              )}
            </div>
          )}
        </main>

        {/* Floating Add FAB Button with generous touch size for a 55 year old */}
        <div className="absolute bottom-22 right-5 z-40">
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsModalOpen(true);
            }}
            className="w-[62px] h-[62px] bg-black hover:bg-zinc-950 text-white font-black rounded-full shadow-2xl border-2 border-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
            id="floating-new-product-btn"
            title="Registrar nuevo accesorio"
          >
            <Plus className="w-8 h-8 stroke-[3.5]" />
          </button>
        </div>

        {/* Footer Navigation Bar */}
        <nav className="h-[74px] border-t border-zinc-200 bg-white flex justify-around items-center px-10 shrink-0 select-none pb-2 relative font-mono">
          <div className="flex flex-col items-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="black" stroke="black" className="shrink-0">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            <span className="text-[9px] font-black mt-1 uppercase text-black">BODEGA</span>
          </div>
          
          <button
            onClick={handleExportInventory}
            className="flex flex-col items-center opacity-85 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none text-black"
            title="Sustituido: Exportar reporte a un archivo planilla Excel/CSV"
          >
            <Download className="w-5.5 h-5.5 stroke-[2.5]" />
            <span className="text-[9px] font-black mt-1 uppercase">EXPORTAR INVENTARIO</span>
          </button>
        </nav>

        {/* Physical Home Indicator representation */}
        <div className="absolute bottom-1 right-[130px] left-[130px] h-1 bg-black rounded-full select-none pointer-events-none sm:block hidden"></div>
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
    </div>
  );
}
