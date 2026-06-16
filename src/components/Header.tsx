import { Product } from '../types';
import { Download } from 'lucide-react';

interface HeaderProps {
  products: Product[];
  onExport?: () => void;
}

export function Header({ products, onExport }: HeaderProps) {
  const totalStock = products.reduce((acc, curr) => acc + curr.stock, 0);

  return (
    <header className="px-5 py-3.5 border-b border-zinc-100 bg-white/90 backdrop-blur-md shrink-0 relative z-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-extrabold tracking-tight leading-none text-zinc-900 uppercase">
            MOTO BODEGA
          </h1>
          <p className="text-[9px] font-semibold text-zinc-400 tracking-wider mt-1 uppercase font-mono">
            Control de Inventario
          </p>
        </div>
        
        {/* Sleek, readable metrics container and Export Button */}
        <div className="flex items-center gap-2 font-mono">
          {onExport && (
            <button
              onClick={onExport}
              className="p-1 px-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60 hover:border-zinc-300 hover:bg-zinc-100 active:scale-95 transition-all text-zinc-800 flex items-center gap-1 cursor-pointer text-[10px]"
              title="Exportar planilla Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-bold text-[9px]">CSV</span>
            </button>
          )}

          <div className="bg-zinc-50 border border-zinc-200/60 rounded-lg px-2.5 py-1 text-center min-w-[50px] flex flex-col justify-center items-center">
            <span className="block text-[13px] font-extrabold leading-none text-zinc-900">{totalStock}</span>
            <span className="text-[7px] font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">STOCK</span>
          </div>
        </div>
      </div>
    </header>
  );
}
