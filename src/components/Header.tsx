import { Product } from '../types';
import { Download } from 'lucide-react';

interface HeaderProps {
  products: Product[];
  onExport?: () => void;
}

export function Header({ products, onExport }: HeaderProps) {
  const totalStock = products.reduce((acc, curr) => acc + curr.stock, 0);

  return (
    <header className="px-5 py-4 border-b border-zinc-150 bg-white shrink-0 relative z-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-black tracking-tight leading-none text-black">
            MOTO BODEGA
          </h1>
          <p className="text-[9px] font-extrabold text-zinc-400 tracking-wider mt-1 uppercase font-mono">
            Control de Inventario
          </p>
        </div>
        
        {/* Sleek, readable metrics container and Export Button */}
        <div className="flex items-center gap-2 font-mono">
          {onExport && (
            <button
              onClick={onExport}
              className="p-1 px-2 rounded-lg bg-zinc-50 border border-zinc-200 hover:border-black active:scale-95 transition-all text-black hover:bg-zinc-100 flex items-center gap-1 cursor-pointer"
              title="Exportar planilla Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[9px] font-bold">CSV</span>
            </button>
          )}

          <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-center min-w-[50px] flex flex-col justify-center items-center">
            <span className="block text-[14px] font-black leading-none text-black">{totalStock}</span>
            <span className="text-[7px] font-bold text-zinc-400">STOCK</span>
          </div>
        </div>
      </div>
    </header>
  );
}
