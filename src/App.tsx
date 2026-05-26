import { useState, useEffect } from 'react';
import { Product, Category } from './types';
import { INITIAL_PRODUCTS } from './data';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { Search, Plus, Download, Mic } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'moto_bodega_products_v2';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todas'>('Todas');
  const [stockFilter, setStockFilter] = useState<'todos' | 'bajo_stock' | 'sin_stock'>('todos');
  const [isListening, setIsListening] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Initialize from localStorage or fallback
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsed inventory', e);
        setProducts(INITIAL_PRODUCTS);
      }
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    }
  }, []);

  // Save changes to keep offline compatibility
  const saveToStorage = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProducts));
  };

  // Fast Stock Addition [+]
  const handleIncreaseStock = (id: string) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, stock: p.stock + 1 };
      }
      return p;
    });
    saveToStorage(updated);
  };

  // Fast Stock Subtraction [-] with floor at 0
  const handleDecreaseStock = (id: string) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, stock: Math.max(0, p.stock - 1) };
      }
      return p;
    });
    saveToStorage(updated);
  };

  // Write/Edit Product completely
  const handleSaveProduct = (productData: Omit<Product, 'id'> & { id?: string; imagen?: string }) => {
    if (productData.id) {
      // Edit existing product
      const updated = products.map((p) => 
        p.id === productData.id ? ({ ...p, ...productData } as Product) : p
      );
      saveToStorage(updated);
    } else {
      // Create new item
      const newProduct: Product = {
        ...(productData as Omit<Product, 'id'>),
        id: String(Date.now()),
      };
      saveToStorage([newProduct, ...products]);
    }
  };

  // Delete product
  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    saveToStorage(updated);
  };

  // Export database as a simple CSV file
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

  // Native iOS and Android voice speech recognition
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Tu iPhone o navegador no tiene activado el dictado por voz. Intenta usar Safari o Google Chrome.');
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

  // Instant real-time filtering directly matching full-sentence description values
  const filteredProducts = products.filter((p) => {
    // 1. Filter by category
    if (selectedCategory !== 'Todas' && p.categoria !== selectedCategory) {
      return false;
    }

    // 2. Filter by stock alert levels (Por agotar <= 2, Agotados === 0)
    if (stockFilter === 'bajo_stock' && p.stock > 2) return false;
    if (stockFilter === 'sin_stock' && p.stock > 0) return false;

    // 3. Real-time smart search match
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

        {/* Instant Search Bar & Filter buttons with high visual contrast */}
        <div className="bg-white px-5 py-3 shrink-0 space-y-3.5 border-b border-zinc-200">
          
          {/* Search box with large reach */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isListening ? "Dictando... hable ahora" : "Escribe o dicta para buscar..."}
              className={`w-full h-[50px] bg-white border-2 border-black rounded-xl pl-11 pr-24 text-[16px] focus:outline-none placeholder-zinc-400 font-extrabold text-black transition-all ${
                isListening ? 'border-red-500 bg-red-50/20' : ''
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
                    : 'bg-zinc-100 hover:bg-zinc-205 border-black text-black'
                }`}
                title="Búsqueda por voz native iOS"
                style={{ minWidth: '36px', minHeight: '36px' }}
              >
                <Mic className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Compact Category Switcher */}
          <div className="space-y-1.5">
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
          <div className="flex gap-1 bg-zinc-150 p-1 rounded-xl border-2 border-black">
            <button
              onClick={() => setStockFilter('todos')}
              className={`flex-1 py-2 text-[12px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'todos' ? 'bg-black text-white' : 'bg-transparent text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Ver Todo
            </button>
            <button
              onClick={() => setStockFilter('bajo_stock')}
              className={`flex-1 py-1.5 text-[12px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'bajo_stock' ? 'bg-[#FEF3C7] text-[#92400E] border border-black' : 'bg-transparent text-zinc-750'
              }`}
            >
              ⚠️ Por Agotar
            </button>
            <button
              onClick={() => setStockFilter('sin_stock')}
              className={`flex-1 py-1.5 text-[12px] font-black rounded-lg transition-all cursor-pointer ${
                stockFilter === 'sin_stock' ? 'bg-[#FEE2E2] text-[#991B1B] border border-black' : 'bg-transparent text-red-750'
              }`}
            >
              🚫 Agotados
            </button>
          </div>
        </div>

        {/* Scrollable products screen */}
        <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white pb-32">
          
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
                  onDuplicate={(pToDuplicate) => {
                    if (!pToDuplicate) return;
                    const originalDesc = pToDuplicate.descripcion || '';
                    const cloned: Product = {
                      ...pToDuplicate,
                      id: String(Date.now() + Math.floor(Math.random() * 1000)),
                      descripcion: `${originalDesc} Copia`,
                    };
                    saveToStorage([cloned, ...products]);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-black rounded-2xl p-8 text-center my-6">
              <span className="text-4xl block mb-2 select-none">🔍</span>
              <h3 className="text-base font-black text-black mb-1">No hay accesorios</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-4">
                No se encontraron coincidencias para tu búsqueda actual. Modifica o limpia los filtros.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Todas');
                  setStockFilter('todos');
                }}
                className="bg-black text-white hover:bg-zinc-900 font-extrabold px-4 py-2.5 rounded-xl text-sm border-2 border-black active:scale-95 transition-transform"
              >
                Ver todo el stock
              </button>
            </div>
          )}
        </main>

        {/* Unified Bottom Right FAB (thumb reach, optimal for 55 yo on iPhone 15) */}
        <div className="absolute bottom-22 right-5 z-40">
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsModalOpen(true);
            }}
            className="w-[62px] h-[62px] bg-black hover:bg-zinc-900 text-white font-black rounded-full shadow-2xl border-2 border-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
            id="floating-new-product-btn"
            title="Agregar nuevo accesorio"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        {/* Footer Area with Reset tool */}
        <nav className="h-[74px] border-t border-zinc-200 bg-white flex justify-around items-center px-10 shrink-0 select-none pb-2 relative">
          <div className="flex flex-col items-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="black" stroke="black" className="shrink-0">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            <span className="text-[9px] font-black mt-1 uppercase text-black font-mono">BODEGA</span>
          </div>
          
          <button
            onClick={handleExportInventory}
            className="flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none text-black"
            title="Exportar base de datos a un archivo Excel/CSV"
          >
            <Download className="w-5.5 h-5.5 stroke-[2.5]" />
            <span className="text-[9px] font-black mt-1 uppercase font-mono">EXPORTAR INVENTARIO</span>
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
