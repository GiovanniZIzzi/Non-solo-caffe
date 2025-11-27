
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, InventoryItem, LocationType } from '../types';
import { Search, MapPin, Plus, Filter, FileText, ChevronRight, ScanLine, X, Store, Truck, AlertCircle, History, LayoutGrid, ListFilter, Eye, EyeOff } from 'lucide-react';

interface InventoryListProps {
  products: Product[];
  inventory: InventoryItem[];
  logoUrl?: string;
  onAddProduct: () => void;
  onEditProduct: (p: Product) => void;
  onOpenSupplierReport: () => void;
  onOpenHistory: (p: Product) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({ 
  products, 
  inventory, 
  logoUrl,
  onAddProduct, 
  onEditProduct,
  onOpenSupplierReport,
  onOpenHistory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLoc, setFilterLoc] = useState<LocationType | 'ALL'>('ALL');
  const [filterSupplier, setFilterSupplier] = useState<string>('ALL');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  const suppliers = useMemo(() => {
    return Array.from(new Set(products.map(p => p.supplier))).sort();
  }, [products]);

  useEffect(() => {
    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }
    };
  }, []);

  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
        const formats = (window as any).Html5QrcodeSupportedFormats ? [
            (window as any).Html5QrcodeSupportedFormats.EAN_13,
            (window as any).Html5QrcodeSupportedFormats.EAN_8,
            (window as any).Html5QrcodeSupportedFormats.CODE_128,
            (window as any).Html5QrcodeSupportedFormats.UPC_A,
            (window as any).Html5QrcodeSupportedFormats.UPC_E,
            (window as any).Html5QrcodeSupportedFormats.QR_CODE,
        ] : undefined;

        const html5QrcodeScanner = new (window as any).Html5QrcodeScanner(
          "inventory-reader",
          { 
              fps: 10, 
              qrbox: { width: 250, height: 100 },
              aspectRatio: 1.5,
              formatsToSupport: formats,
              experimentalFeatures: { useBarCodeDetectorIfSupported: true }
          },
          false
        );
        
        scannerRef.current = html5QrcodeScanner;

        html5QrcodeScanner.render((decodedText: string) => {
            setSearchTerm(decodedText);
            setIsScanning(false);
            html5QrcodeScanner.clear().catch(console.error);
        }, (errorMessage: string) => {});
    }, 100);
  };

  const stopScanner = () => {
      if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          setIsScanning(false);
      }
  };

  const getStock = (prodId: string, loc: LocationType) => {
    return inventory.find(i => i.productId === prodId && i.location === loc)?.quantity || 0;
  };

  const getTotalStock = (prodId: string) => {
    return inventory.filter(i => i.productId === prodId).reduce((acc, curr) => acc + curr.quantity, 0);
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    const matchesSupplier = filterSupplier === 'ALL' || p.supplier === filterSupplier;
    
    let matchesStock = true;
    if (showAvailableOnly) {
        if (filterLoc === 'ALL') {
            matchesStock = getTotalStock(p.id) > 0;
        } else {
            matchesStock = getStock(p.id, filterLoc) > 0;
        }
    }

    return matchesSearch && matchesSupplier && matchesStock;
  });

  return (
    <div className="pb-20 md:pb-6">
      {/* Scanner Overlay */}
      {isScanning && (
            <div className="fixed inset-0 z-[80] bg-black/90 flex flex-col justify-center items-center p-4 animate-in fade-in duration-200">
                <button 
                    onClick={stopScanner}
                    className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors"
                >
                    <X size={24} />
                </button>
                <div className="w-full max-w-sm bg-black rounded-3xl overflow-hidden shadow-2xl relative">
                    <div id="inventory-reader" className="w-full"></div>
                </div>
                <p className="text-white mt-8 font-medium text-center bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm">Inquadra il codice a barre</p>
            </div>
      )}

      {/* Glass Header */}
      <div className="sticky top-0 z-20 glass-panel border-b border-white/50 dark:border-white/10 px-4 pt-4 pb-2 shadow-sm md:rounded-b-3xl md:mb-6">
        <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-3">
                 {/* Logo Container - Fixed Size with Object Contain */}
                 <div className="h-14 w-14 flex-shrink-0 flex items-center justify-center md:hidden">
                     {logoUrl && (
                        <img 
                            src={logoUrl} 
                            alt="Logo" 
                            className="max-h-full max-w-full object-contain drop-shadow-sm" 
                        />
                     )}
                 </div>
                 <div className="md:hidden">
                    <h1 className="text-xl font-extrabold text-coffee-900 dark:text-white leading-none tracking-tight">Non Solo Caffè</h1>
                    <p className="text-[11px] text-coffee-500 dark:text-coffee-300 font-semibold tracking-wide uppercase mt-0.5">Gestione Magazzino</p>
                 </div>
                 <div className="hidden md:block">
                    <h2 className="text-2xl font-extrabold text-coffee-900 dark:text-white">Inventario</h2>
                    <p className="text-sm text-coffee-500 dark:text-coffee-400 font-medium">{filtered.length} Prodotti trovati</p>
                 </div>
             </div>
             
             <div className="flex gap-2">
                 <button 
                    onClick={onOpenSupplierReport}
                    className="h-9 w-9 md:h-10 md:w-auto md:px-4 flex items-center justify-center gap-2 text-coffee-700 dark:text-coffee-200 bg-white dark:bg-coffee-800 rounded-full shadow-sm border border-coffee-100 dark:border-coffee-700 active:scale-95 transition-transform hover:bg-coffee-50 dark:hover:bg-coffee-700"
                    title="Report Fornitori"
                 >
                    <FileText size={18} />
                    <span className="hidden md:inline font-bold text-xs">Report</span>
                 </button>
                 <button 
                    onClick={onAddProduct} 
                    className="h-9 md:h-10 px-3 md:px-5 flex items-center text-white font-bold text-xs bg-coffee-800 hover:bg-coffee-900 rounded-full shadow-lg shadow-coffee-800/20 active:scale-95 transition-transform"
                 >
                    <Plus size={16} className="mr-1" /> <span className="hidden md:inline">Nuovo Prodotto</span><span className="md:hidden">Nuovo</span>
                 </button>
             </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-3 pb-2">
            <div className="relative group flex-1">
              <Search className="absolute left-3.5 top-3 z-10 text-coffee-400 group-focus-within:text-coffee-600 dark:group-focus-within:text-coffee-300 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Cerca prodotto, codice..." 
                className="w-full pl-10 pr-12 py-2.5 rounded-2xl border-none bg-white dark:bg-dark-surface shadow-sm text-sm font-medium text-coffee-800 dark:text-white placeholder:text-coffee-300 dark:placeholder:text-coffee-500 focus:ring-2 focus:ring-coffee-500/20 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button 
                onClick={startScanner}
                className="absolute right-2 top-1.5 p-1.5 text-coffee-400 hover:text-coffee-700 dark:hover:text-white hover:bg-coffee-50 dark:hover:bg-coffee-800 rounded-xl transition-all active:scale-90 md:hidden"
                title="Scansiona codice a barre"
              >
                 <ScanLine size={18} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar md:flex-shrink-0">
                <div className="relative min-w-[140px]">
                    <select 
                        value={filterSupplier}
                        onChange={(e) => setFilterSupplier(e.target.value)}
                        className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-xl text-xs font-bold bg-coffee-50/50 dark:bg-coffee-800/50 border border-transparent text-coffee-700 dark:text-coffee-300 outline-none focus:bg-white dark:focus:bg-coffee-800 transition-all truncate cursor-pointer hover:bg-white dark:hover:bg-coffee-800"
                    >
                        <option value="ALL">Tutti i Fornitori</option>
                        {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Filter className="absolute left-3 top-2.5 text-coffee-400" size={14} />
                </div>

                <button 
                    onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                        showAvailableOnly 
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                        : 'bg-white border-gray-100 text-gray-500 dark:bg-coffee-800 dark:border-coffee-700 dark:text-coffee-300 hover:bg-gray-50'
                    }`}
                >
                    {showAvailableOnly ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>Solo Disp.</span>
                </button>
            </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
            <button 
                onClick={() => setFilterLoc('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${filterLoc === 'ALL' ? 'bg-coffee-800 text-white border-coffee-800 shadow-md' : 'bg-white dark:bg-coffee-800 text-coffee-500 dark:text-coffee-300 border-gray-100 dark:border-gray-700 hover:bg-gray-50'}`}
            >
                Tutti
            </button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
            
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 p-1 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <span className="text-[9px] font-extrabold text-amber-700 dark:text-amber-400 px-1 uppercase hidden sm:inline-block">Negozio</span>
                <button 
                    onClick={() => setFilterLoc(LocationType.VETRINA)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLoc === LocationType.VETRINA ? 'bg-amber-500 text-white shadow-sm' : 'hover:bg-amber-100 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-200'}`}
                >
                    Vetrina
                </button>
                <button 
                    onClick={() => setFilterLoc(LocationType.DEPOSITO)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterLoc === LocationType.DEPOSITO ? 'bg-amber-500 text-white shadow-sm' : 'hover:bg-amber-100 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-200'}`}
                >
                    Deposito
                </button>
            </div>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"></div>

            <button 
                onClick={() => setFilterLoc(LocationType.MAGAZZINO)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${filterLoc === LocationType.MAGAZZINO ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 border-blue-100 dark:border-blue-900/40 hover:bg-blue-100'}`}
            >
                <Truck size={12} /> Magazzino
            </button>
        </div>
      </div>

      {/* List / Grid */}
      <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(product => {
          // Get Stocks
          const vet = getStock(product.id, LocationType.VETRINA);
          const dep = getStock(product.id, LocationType.DEPOSITO);
          const mag = getStock(product.id, LocationType.MAGAZZINO);
          const total = vet + dep + mag;

          // Determine alerts
          const lowVet = vet < (product.idealStockVetrina || 5) / 2; // Visual warning if very low
          const lowDep = dep < product.alertThresholdDeposit;
          const lowMag = mag < product.alertThresholdWarehouse;
          
          return (
            <div 
                key={product.id} 
                onClick={() => onEditProduct(product)}
                className="bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-transparent hover:border-coffee-200 dark:hover:border-coffee-700 hover:shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between h-full"
            >
              {/* Header Part: Name & Supplier */}
              <div className="flex justify-between items-start mb-3">
                  <div className="pr-2">
                    <h3 className="text-sm font-bold text-coffee-900 dark:text-white leading-tight line-clamp-2 h-10" title={product.name}>{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-coffee-400 bg-gray-50 dark:bg-coffee-800/50 px-1 rounded">{product.code}</span>
                        <span className="text-[10px] text-coffee-400 truncate max-w-[120px]">{product.supplier}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenHistory(product); }}
                        className="p-1.5 text-coffee-400 hover:text-coffee-700 bg-gray-50 hover:bg-gray-100 dark:bg-coffee-800/30 dark:hover:bg-coffee-800 rounded-lg transition-colors"
                        title="Storico"
                      >
                        <History size={16} />
                      </button>
                  </div>
              </div>
              
              {/* Stock Grid Visualizer */}
              <div className="flex gap-2 items-stretch mt-2">
                  {/* Grid of Locations */}
                  <div className="flex-1 grid grid-cols-3 gap-1.5">
                      {/* Magazzino */}
                      <div className={`rounded-xl p-1.5 text-center border ${lowMag ? 'bg-blue-50 border-red-300 dark:bg-blue-900/10 dark:border-red-500/50' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30'} ${filterLoc === LocationType.MAGAZZINO ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-dark-bg' : ''}`}>
                          <span className="block text-[9px] font-extrabold text-blue-400 uppercase mb-0.5">Mag</span>
                          <span className={`block text-sm font-bold leading-none ${lowMag ? 'text-red-600 dark:text-red-400' : 'text-blue-900 dark:text-blue-100'}`}>
                              {mag}
                          </span>
                      </div>
                      
                      {/* Deposito */}
                      <div className={`rounded-xl p-1.5 text-center border ${lowDep ? 'bg-amber-50 border-red-300 dark:bg-amber-900/10 dark:border-red-500/50' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30'} ${filterLoc === LocationType.DEPOSITO ? 'ring-2 ring-amber-500 ring-offset-1 dark:ring-offset-dark-bg' : ''}`}>
                          <span className="block text-[9px] font-extrabold text-amber-600/60 dark:text-amber-500/60 uppercase mb-0.5">Dep</span>
                          <span className={`block text-sm font-bold leading-none ${lowDep ? 'text-red-600 dark:text-red-400' : 'text-amber-900 dark:text-amber-100'}`}>
                              {dep}
                          </span>
                      </div>

                      {/* Vetrina */}
                      <div className={`rounded-xl p-1.5 text-center border ${lowVet ? 'bg-purple-50 border-red-300 dark:bg-purple-900/10 dark:border-red-500/50' : 'bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-900/30'} ${filterLoc === LocationType.VETRINA ? 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-dark-bg' : ''}`}>
                          <span className="block text-[9px] font-extrabold text-purple-400 uppercase mb-0.5">Vet</span>
                          <span className={`block text-sm font-bold leading-none ${lowVet ? 'text-red-600 dark:text-red-400' : 'text-purple-900 dark:text-purple-100'}`}>
                              {vet}
                          </span>
                      </div>
                  </div>

                  {/* Total Separator */}
                  <div className="w-px bg-gray-100 dark:bg-gray-800 mx-1"></div>

                  {/* Total */}
                  <div className="min-w-[60px] flex flex-col justify-center items-center bg-gray-50 dark:bg-coffee-900/30 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase">Totale</span>
                      <span className="text-lg font-black text-coffee-900 dark:text-white leading-none mt-0.5">{total}</span>
                  </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-coffee-300">
                <Search size={64} className="mb-4 opacity-20" strokeWidth={1} />
                <p className="font-semibold text-coffee-400">Nessun prodotto trovato</p>
                <p className="text-sm">Prova a modificare i filtri o scansionare un codice</p>
            </div>
        )}
      </div>
    </div>
  );
};
