import { Product } from '../types';

interface HeaderProps {
  products: Product[];
}

export function Header({ products }: HeaderProps) {
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <header className="bg-white border-b border-zinc-200 px-5 py-3 shrink-0">
      <div className="max-w-sm mx-auto flex items-center justify-between">
        <div className="text-left">
          <h1 className="text-[20px] font-black tracking-tight text-black flex items-center gap-1 leading-none">
            <span>🏍️</span> Moto Bodega
          </h1>
          <p className="text-[11px] font-bold text-zinc-500 mt-1 uppercase tracking-wider">
            Inventario Rápido
          </p>
        </div>
        <div className="bg-black text-white px-3 py-1.5 rounded-full text-xs font-black select-none">
          {totalStock} Uds.
        </div>
      </div>
    </header>
  );
}
