import { Product } from '../types';

interface HeaderProps {
  products: Product[];
}

export function Header({ products }: HeaderProps) {
  const totalStock = products.reduce((acc, curr) => acc + curr.stock, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 2).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <header className="p-5 border-b border-zinc-200 bg-white shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-black tracking-tight leading-none text-black">
            MOTO BODEGA
          </h1>
          <p className="text-[10px] font-bold text-zinc-400 tracking-wider mt-1 uppercase font-mono">
            Control de Inventario
          </p>
        </div>
        
        {/* Sleek, readable metrics container */}
        <div className="flex items-center gap-1.5 font-mono">
          <div className="bg-zinc-100 border-2 border-black rounded-lg px-2.5 py-1 text-center min-w-[50px] shadow-sm">
            <span className="block text-[15px] font-black leading-none text-black">{totalStock}</span>
            <span className="text-[7.5px] font-black text-zinc-500 uppercase">STOCK</span>
          </div>

          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <div className="flex flex-col gap-0.5 justify-center">
              {lowStockCount > 0 && (
                <div className="bg-amber-100 text-amber-900 border border-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none text-center">
                  ⚠️ {lowStockCount} por agotar
                </div>
              )}
              {outOfStockCount > 0 && (
                <div className="bg-red-100 text-red-900 border border-red-300 text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none text-center">
                  🚫 {outOfStockCount} sin stock
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
