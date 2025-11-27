
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowRight, Save, Truck, ShoppingBag, ArrowDownLeft, ScanLine, Camera, ArrowLeft, FileText, Boxes, Euro, AlertTriangle, ShoppingCart } from 'lucide-react';
import { Product, LocationType, InventoryItem } from '../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventory: InventoryItem[]; // Current stock for validation
  onSubmit: (type: 'IN' | 'OUT' | 'MOVE', productId: string, qty: number, from?: LocationType, to?: LocationType, unitCost?: number) => void;
  onOpenInvoiceScanner: () => void;
  onOpenRestock: () => void;
  onOpenPurchaseOrder: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, products, inventory, onSubmit, onOpenInvoiceScanner, onOpenRestock, onOpenPurchaseOrder }) => {
  const [actionType, setActionType] = useState<'IN' | 'OUT' | 'MOVE' | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitCost, setUnitCost] = useState<string>(''); 
  const [fromLoc, setFromLoc] = useState<LocationType>(LocationType.MAGAZZINO);
  const [toLoc, setToLoc] = useState<LocationType>(LocationType.DEPOSITO);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setActionType(null);
      setSelectedProductId('');
      setQuantity('');
      setUnitCost('');
      setSearchTerm('');
      setIsScanning(false);
    }
    return () => {
       if (scannerRef.current) {
           scannerRef.current.clear().catch(console.error);
       }
    };
  }, [isOpen]);

  useEffect(() => {
      if (selectedProductId && actionType === 'IN') {
          const prod = products.find(p => p.id === selectedProductId);
          if (prod) setUnitCost(prod.costPrice.toString());
      }
  }, [selectedProductId, actionType, products]);

  // Calculate available stock for OUT/MOVE based on fromLoc
  const maxQty = useMemo(() => {
      if (!selectedProductId || !actionType || actionType === 'IN') return Infinity;
      const item = inventory.find(i => i.productId === selectedProductId && i.location === fromLoc);
      return item ? item.quantity : 0;
  }, [selectedProductId, fromLoc, actionType, inventory]);

  const isQtyValid = useMemo(() => {
      if (!quantity) return false;
      const q = parseInt(quantity);
      if (isNaN(q) || q <= 0) return false;
      if (actionType !== 'IN' && q > maxQty) return false;
      return true;
  }, [quantity, maxQty, actionType]);

  useEffect(() => {
      if (isScanning && actionType) {
          const timer = setTimeout(() => {
              const formats = (window as any).Html5QrcodeSupportedFormats ? [
                (window as any).Html5QrcodeSupportedFormats.EAN_13,
                (window as any).Html5QrcodeSupportedFormats.EAN_8,
                (window as any).Html5QrcodeSupportedFormats.CODE_128,
                (window as any).Html5QrcodeSupportedFormats.UPC_A,
                (window as any).Html5QrcodeSupportedFormats.QR_CODE,
              ] : undefined;

              const html5QrcodeScanner = new (window as any).Html5QrcodeScanner(
                "reader",
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
                  const found = products.find(p => p.code === decodedText || p.id === decodedText);
                  if (found) {
                      setSelectedProductId(found.id);
                      setSearchTerm(found.name);
                      setIsScanning(false);
                      html5QrcodeScanner.clear();
                  } else {
                      alert(`Prodotto non trovato: ${decodedText}`);
                      setIsScanning(false);
                      html5QrcodeScanner.clear();
                  }
              }, (errorMessage: string) => {});
          }, 300);

          return () => clearTimeout(timer);
      }
  }, [isScanning, actionType, products]);

  const stopScanning = () => {
      if (scannerRef.current) {
          scannerRef.current.clear().then(() => setIsScanning(false)).catch(() => setIsScanning(false));
      } else {
          setIsScanning(false);
      }
  };

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.includes(searchTerm)
  );

  const handleSubmit = () => {
    if (!isQtyValid) return;
    const qty = parseInt(quantity);
    const cost = parseFloat(unitCost);
    
    onSubmit(
      actionType!, 
      selectedProductId, 
      qty, 
      actionType === 'MOVE' ? fromLoc : (actionType === 'OUT' ? fromLoc : undefined), 
      actionType === 'MOVE' ? toLoc : (actionType === 'IN' ? toLoc : undefined),
      (actionType === 'IN' && !isNaN(cost)) ? cost : undefined
    );
    onClose();
  };

  const LocationSelect = ({ value, onChange }: { value: LocationType, onChange: (v: LocationType) => void }) => (
    <div className="relative">
        <select 
            value={value} 
            onChange={(e) => onChange(e.target.value as LocationType)}
            className="bg-white dark:bg-coffee-800 border-none shadow-sm rounded-lg px-3 py-1.5 text-sm font-bold text-coffee-900 dark:text-white outline-none appearance-none pr-8 w-full min-w-[140px]"
        >
            <optgroup label="📍 Punto Vendita (Via Papini)">
                <option value={LocationType.VETRINA}>{LocationType.VETRINA}</option>
                <option value={LocationType.DEPOSITO}>{LocationType.DEPOSITO}</option>
            </optgroup>
            <optgroup label="🏭 Magazzino Esterno">
                <option value={LocationType.MAGAZZINO}>{LocationType.MAGAZZINO}</option>
            </optgroup>
        </select>
        <ArrowDownLeft size={12} className="absolute right-2 top-2.5 text-coffee-400 pointer-events-none" />
    </div>
  );

  const renderStep1_ActionSelect = () => (
    <div className="grid grid-cols-1 gap-6 mt-6 px-4 pb-6 overflow-y-auto max-h-[60vh]">
      
      {/* SECTION 1: IN & PURCHASES */}
      <div>
        <h3 className="text-xs font-bold text-coffee-400 dark:text-coffee-500 uppercase tracking-widest mb-3 pl-1">Carico & Acquisti</h3>
        <div className="grid grid-cols-3 gap-2">
            <button 
                onClick={() => { setActionType('IN'); setToLoc(LocationType.MAGAZZINO); }}
                className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 rounded-3xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors active:scale-[0.98]"
            >
                <div className="bg-white dark:bg-green-800 p-2 rounded-2xl mb-2 text-green-600 dark:text-white shadow-sm"><Truck size={20} /></div>
                <h3 className="text-xs font-extrabold text-green-900 dark:text-green-100 text-center">Singolo</h3>
            </button>

            <button 
                onClick={() => { onClose(); onOpenInvoiceScanner(); }}
                className="flex flex-col items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 rounded-3xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors active:scale-[0.98]"
            >
                <div className="bg-white dark:bg-emerald-800 p-2 rounded-2xl mb-2 text-emerald-600 dark:text-white shadow-sm"><FileText size={20} /></div>
                <h3 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-100 text-center">Fattura</h3>
            </button>

            <button 
                onClick={() => { onClose(); onOpenPurchaseOrder(); }}
                className="flex flex-col items-center justify-center p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900 rounded-3xl hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors active:scale-[0.98]"
            >
                <div className="bg-white dark:bg-orange-800 p-2 rounded-2xl mb-2 text-orange-600 dark:text-white shadow-sm"><ShoppingCart size={20} /></div>
                <h3 className="text-xs font-extrabold text-orange-900 dark:text-orange-100 text-center leading-tight">Genera<br/>Ordini</h3>
            </button>
        </div>
      </div>

      {/* SECTION 2: MOVE */}
      <div>
        <h3 className="text-xs font-bold text-coffee-400 dark:text-coffee-500 uppercase tracking-widest mb-3 pl-1">Logistica & Spostamenti</h3>
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => { setActionType('MOVE'); setFromLoc(LocationType.MAGAZZINO); setToLoc(LocationType.DEPOSITO); }}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-3xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors active:scale-[0.98]"
            >
                <div className="bg-white dark:bg-blue-800 p-2.5 rounded-2xl mb-2 text-blue-600 dark:text-white shadow-sm"><ArrowRight size={22} /></div>
                <h3 className="text-sm font-extrabold text-blue-900 dark:text-blue-100">Manuale</h3>
                <p className="text-[10px] font-medium text-blue-700/70 dark:text-blue-300">Sposta 1 prodotto</p>
            </button>

            <button 
                onClick={() => { onClose(); onOpenRestock(); }}
                className="flex flex-col items-center justify-center p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900 rounded-3xl hover:bg-indigo-100 transition-colors active:scale-[0.98]"
            >
                <div className="bg-white dark:bg-indigo-800 p-2.5 rounded-2xl mb-2 text-indigo-600 dark:text-white shadow-sm"><Boxes size={22} /></div>
                <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-100">Smart</h3>
                <p className="text-[10px] font-medium text-indigo-700/70 dark:text-indigo-300">Rifornimento Auto</p>
            </button>
        </div>
      </div>

      {/* SECTION 3: OUT */}
      <div>
        <h3 className="text-xs font-bold text-coffee-400 dark:text-coffee-500 uppercase tracking-widest mb-3 pl-1">Vendita</h3>
        <button 
            onClick={() => { setActionType('OUT'); setFromLoc(LocationType.VETRINA); }}
            className="w-full flex items-center p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900 rounded-3xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors active:scale-[0.98]"
        >
            <div className="bg-white dark:bg-amber-800 p-3 rounded-2xl mr-4 text-amber-600 dark:text-white shadow-sm"><ShoppingBag size={24} /></div>
            <div className="text-left">
            <h3 className="text-lg font-extrabold text-amber-900 dark:text-amber-100">Vendita / Scarico</h3>
            <p className="text-sm font-medium text-amber-700/70 dark:text-amber-300">Uscita prodotti</p>
            </div>
        </button>
      </div>

    </div>
  );

  const renderStep2_ProductAndDetails = () => (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 pb-4 pt-2">
            <div className="bg-coffee-50/50 dark:bg-dark-surface/50 p-4 rounded-2xl space-y-4">
                {actionType !== 'IN' && (
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-coffee-400">Da:</label>
                    <LocationSelect value={fromLoc} onChange={setFromLoc} />
                </div>
                )}
                
                {actionType !== 'OUT' && (
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-coffee-400">A:</label>
                    <LocationSelect value={toLoc} onChange={setToLoc} />
                </div>
                )}
            </div>
        </div>

      <div className="px-4 mb-4">
        <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-coffee-500 uppercase">Prodotto</label>
            {!isScanning && (
                <button 
                    onClick={() => setIsScanning(true)} 
                    className="text-[10px] bg-coffee-800 text-white px-2 py-1 rounded-lg flex items-center gap-1 font-bold shadow-sm"
                >
                    <Camera size={12} /> Scan
                </button>
            )}
        </div>

        {isScanning ? (
            <div className="mb-4 bg-black rounded-2xl overflow-hidden relative shadow-lg">
                 <div id="reader" className="w-full"></div>
                 <p className="text-white text-xs text-center p-2 font-medium">Inquadra il codice a barre</p>
                 <button 
                    onClick={stopScanning}
                    className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-black z-10 shadow-sm"
                 >
                     <X size={16} />
                 </button>
            </div>
        ) : (
            <>
                <div className="relative mb-2">
                    <input 
                        type="text" 
                        placeholder="Cerca nome o codice..." 
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-surface border border-transparent focus:bg-white dark:focus:bg-coffee-900 focus:border-coffee-500 outline-none text-sm font-medium text-coffee-900 dark:text-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus={!selectedProductId}
                    />
                    <ScanLine className="absolute left-3.5 top-3.5 text-coffee-400" size={18} />
                </div>
                
                {/* Product Dropdown for Quick Select */}
                <div className="relative">
                    <select
                        value={selectedProductId}
                        onChange={(e) => {
                             setSelectedProductId(e.target.value);
                             const prod = products.find(p => p.id === e.target.value);
                             if(prod) setSearchTerm(prod.name);
                        }}
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-surface border border-transparent focus:bg-white dark:focus:bg-coffee-900 focus:border-coffee-500 outline-none text-xs font-bold text-coffee-900 dark:text-white appearance-none"
                    >
                        <option value="">-- Seleziona da lista --</option>
                        {products
                            .sort((a,b) => a.name.localeCompare(b.name))
                            .map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ArrowDownLeft size={14} className="absolute right-3 top-3 text-coffee-400 pointer-events-none" />
                </div>
                
                {searchTerm && !selectedProductId && (
                    <div className="mt-2 max-h-40 overflow-y-auto rounded-xl bg-white dark:bg-dark-surface shadow-lg border border-gray-100 dark:border-dark-border z-20 relative">
                        {filteredProducts.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => { setSelectedProductId(p.id); setSearchTerm(p.name); }}
                                className="p-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-coffee-50 dark:hover:bg-coffee-900 transition-colors"
                            >
                                <p className="text-sm font-bold text-coffee-900 dark:text-white">{p.name}</p>
                                <p className="text-xs text-coffee-400 mt-0.5">{p.code}</p>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
      </div>

      {/* Unit Cost Input - Only for IN */}
      {actionType === 'IN' && (
          <div className="px-4 mb-4">
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Costo Acquisto Unitario (€)</label>
              <div className="relative">
                  <input 
                    type="number" 
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-dark-surface border border-transparent focus:bg-white dark:focus:bg-coffee-900 focus:border-coffee-500 outline-none text-sm font-bold text-coffee-900 dark:text-white"
                    placeholder="Prezzo fattura"
                  />
                  <Euro size={16} className="absolute left-3.5 top-3.5 text-coffee-400" />
              </div>
              <p className="text-[10px] text-coffee-400 mt-1">Serve per calcolare il Costo Medio Ponderato.</p>
          </div>
      )}

      <div className="px-4 mb-6">
        <div className="flex justify-between">
            <label className="block text-xs font-bold text-coffee-500 uppercase mb-2">Quantità</label>
            {selectedProductId && actionType !== 'IN' && (
                <span className={`text-[10px] font-bold uppercase ${maxQty <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                    Disponibili: {maxQty} pz
                </span>
            )}
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setQuantity(prev => Math.max(0, (parseInt(prev) || 0) - 1).toString())}
                className="w-14 h-14 rounded-2xl bg-white dark:bg-dark-surface border border-coffee-100 dark:border-dark-border text-coffee-600 dark:text-coffee-200 font-bold text-2xl flex items-center justify-center shadow-sm active:bg-coffee-50 dark:active:bg-coffee-900"
            >-</button>
            <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`flex-1 h-14 text-center text-2xl font-bold rounded-2xl border outline-none text-coffee-900 dark:text-white transition-all ${
                    !isQtyValid && quantity ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-900' : 'bg-coffee-50 dark:bg-dark-surface border-transparent focus:bg-white dark:focus:bg-coffee-900 focus:border-coffee-500'
                }`}
                placeholder="0"
            />
            <button 
                onClick={() => setQuantity(prev => ((parseInt(prev) || 0) + 1).toString())}
                className="w-14 h-14 rounded-2xl bg-white dark:bg-dark-surface border border-coffee-100 dark:border-dark-border text-coffee-600 dark:text-coffee-200 font-bold text-2xl flex items-center justify-center shadow-sm active:bg-coffee-50 dark:active:bg-coffee-900"
            >+</button>
        </div>
        
        {actionType !== 'IN' && quantity && parseInt(quantity) > maxQty && (
             <div className="mt-2 flex items-center gap-2 text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
                 <AlertTriangle size={14} />
                 <span>Quantità superiore alla disponibilità ({maxQty})</span>
             </div>
        )}

        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {[5, 10, 20, 50, 100].map(val => (
                <button 
                    key={val}
                    onClick={() => setQuantity(val.toString())}
                    className="px-4 py-2 rounded-xl bg-coffee-50 dark:bg-dark-surface text-coffee-600 dark:text-coffee-300 text-xs font-bold border border-coffee-100 dark:border-dark-border whitespace-nowrap active:bg-coffee-100"
                >+{val}</button>
            ))}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-gray-50 dark:border-dark-border">
        <button 
            disabled={!isQtyValid}
            onClick={handleSubmit}
            className="w-full bg-coffee-800 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-coffee-900/20 hover:bg-coffee-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98] transition-all"
        >
            <Save className="mr-2" size={20} />
            Conferma {actionType === 'IN' ? 'Carico' : actionType === 'OUT' ? 'Scarico' : 'Spostamento'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-white dark:bg-dark-bg w-full max-w-md h-[85vh] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 pointer-events-auto flex flex-col animate-in slide-in-from-bottom-20 sm:zoom-in-95 duration-300">
        <div className="p-4 border-b border-coffee-50 dark:border-dark-border flex justify-between items-center bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-t-3xl sticky top-0 z-20">
          <div className="flex items-center gap-3">
              {actionType && (
                  <button onClick={() => setActionType(null)} className="h-8 w-8 flex items-center justify-center rounded-full bg-coffee-50 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-200">
                      <ArrowLeft size={18} strokeWidth={3} />
                  </button>
              )}
              <h2 className="text-xl font-extrabold text-coffee-900 dark:text-white">
                  {actionType === 'IN' ? 'Arrivo Merce' : actionType === 'MOVE' ? 'Logistica' : actionType === 'OUT' ? 'Vendita' : 'Azione Rapida'}
              </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {!actionType ? renderStep1_ActionSelect() : renderStep2_ProductAndDetails()}
      </div>
    </div>
  );
};
