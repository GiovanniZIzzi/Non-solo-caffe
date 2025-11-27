import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { X, Check, Search, Euro, Package, Truck, Plus, ArrowRight } from 'lucide-react';

interface ManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSubmit: (items: { productId: string; quantity: number; unitCost: number }[]) => void;
}

export const ManualInvoiceModal: React.FC<ManualInvoiceModalProps> = ({ isOpen, onClose, products, onSubmit }) => {
  const [step, setStep] = useState<'SUPPLIER' | 'PRODUCTS'>('SUPPLIER');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [supplierSearch, setSupplierSearch] = useState('');
  
  // Map of productId -> { quantity, totalCost }
  const [entries, setEntries] = useState<Record<string, { quantity: string; totalCost: string }>>({});
  
  // List of extra products added manually to this invoice that aren't strictly from this supplier originally
  const [extraProductIds, setExtraProductIds] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(products.map(p => p.supplier))).sort();
  }, [products]);

  const filteredSuppliers = uniqueSuppliers.filter(s => s.toLowerCase().includes(supplierSearch.toLowerCase()));

  // Products to show: Originally linked to supplier + manually added extras
  const displayedProducts = useMemo(() => {
    if (!selectedSupplier) return [];
    const supplierProds = products.filter(p => p.supplier === selectedSupplier);
    const extraProds = products.filter(p => extraProductIds.includes(p.id));
    
    // Merge and dedup
    const combined = [...supplierProds];
    extraProds.forEach(p => {
        if (!combined.find(c => c.id === p.id)) combined.push(p);
    });
    
    return combined.filter(p => 
        p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
        p.code.includes(productSearchTerm)
    );
  }, [products, selectedSupplier, extraProductIds, productSearchTerm]);

  // Search results for adding extra product
  const allProductsSearchResults = useMemo(() => {
      if (!isAddingProduct) return [];
      return products.filter(p => 
          !displayedProducts.find(d => d.id === p.id) && // Exclude already displayed
          (p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.code.includes(productSearchTerm))
      );
  }, [products, displayedProducts, productSearchTerm, isAddingProduct]);

  const handleEntryChange = (productId: string, field: 'quantity' | 'totalCost', value: string) => {
    setEntries(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId] || { quantity: '', totalCost: '' },
        [field]: value
      }
    }));
  };

  const handleConfirmSupplier = (supplier: string) => {
      setSelectedSupplier(supplier);
      setStep('PRODUCTS');
  };

  const handleSubmit = () => {
    const itemsToSubmit: { productId: string; quantity: number; unitCost: number }[] = [];
    
    Object.entries(entries).forEach(([pid, data]) => {
        const qty = parseInt(data.quantity);
        const total = parseFloat(data.totalCost);
        
        if (qty > 0) {
            // If total cost is provided, calc unit. If not, unit is 0.
            const unit = (!isNaN(total) && total > 0) ? total / qty : 0;
            itemsToSubmit.push({ productId: pid, quantity: qty, unitCost: unit });
        }
    });

    if (itemsToSubmit.length === 0) {
        alert("Inserisci almeno una quantità.");
        return;
    }

    onSubmit(itemsToSubmit);
    handleClose();
  };

  const handleClose = () => {
      onClose();
      setStep('SUPPLIER');
      setSelectedSupplier('');
      setEntries({});
      setExtraProductIds([]);
      setSupplierSearch('');
      setProductSearchTerm('');
      setIsAddingProduct(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={handleClose}></div>
      <div className="bg-[#f9f5f3] dark:bg-dark-bg w-full max-w-3xl h-[95vh] sm:h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-white dark:bg-dark-surface p-4 border-b border-coffee-100 dark:border-dark-border flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl text-green-700 dark:text-green-400">
                    <Truck size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-coffee-900 dark:text-white">Carico Fattura</h2>
                    <p className="text-xs text-coffee-500 dark:text-coffee-400 font-medium">
                        {step === 'SUPPLIER' ? 'Seleziona Fornitore' : `Carico per ${selectedSupplier}`}
                    </p>
                </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400">
                <X size={24} />
            </button>
        </div>

        {/* Step 1: Supplier Selection */}
        {step === 'SUPPLIER' && (
            <div className="flex-1 flex flex-col overflow-hidden p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-4 text-coffee-400" size={20} />
                    <input 
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-dark-surface border border-coffee-200 dark:border-dark-border outline-none text-lg font-bold shadow-sm focus:ring-2 focus:ring-coffee-500/20 transition-all"
                        placeholder="Cerca o crea fornitore..."
                        value={supplierSearch}
                        onChange={e => setSupplierSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {/* Create New Option */}
                    {supplierSearch && !uniqueSuppliers.includes(supplierSearch) && (
                        <button 
                            onClick={() => handleConfirmSupplier(supplierSearch)}
                            className="w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl text-left flex items-center gap-3 group"
                        >
                            <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-full text-indigo-600 dark:text-indigo-200 group-hover:scale-110 transition-transform"><Plus size={20} /></div>
                            <div>
                                <p className="font-bold text-indigo-900 dark:text-indigo-200">Crea nuovo fornitore: "{supplierSearch}"</p>
                                <p className="text-xs text-indigo-500 dark:text-indigo-400">Inizia un carico per questo nuovo fornitore</p>
                            </div>
                        </button>
                    )}

                    {filteredSuppliers.map(s => (
                        <button 
                            key={s}
                            onClick={() => handleConfirmSupplier(s)}
                            className="w-full p-4 bg-white dark:bg-dark-surface border border-coffee-100 dark:border-dark-border rounded-2xl shadow-sm hover:bg-coffee-50 dark:hover:bg-coffee-800/50 text-left font-bold text-coffee-900 dark:text-white transition-all flex items-center justify-between group"
                        >
                            <span>{s}</span>
                            <ArrowRight size={18} className="text-coffee-300 group-hover:text-coffee-600 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </button>
                    ))}
                    
                    {filteredSuppliers.length === 0 && !supplierSearch && (
                         <p className="text-center text-coffee-400 py-10">Inizia a scrivere per cercare...</p>
                    )}
                </div>
            </div>
        )}

        {/* Step 2: Products */}
        {step === 'PRODUCTS' && (
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Product Search & Add Bar */}
                <div className="p-4 bg-coffee-50 dark:bg-dark-surface/50 border-b border-coffee-100 dark:border-dark-border space-y-3">
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-coffee-400" size={18} />
                            <input 
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-dark-surface border border-coffee-200 dark:border-dark-border outline-none text-sm font-medium"
                                placeholder={isAddingProduct ? "Cerca nel catalogo completo..." : "Filtra lista..."}
                                value={productSearchTerm}
                                onChange={e => setProductSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => {
                                setIsAddingProduct(!isAddingProduct);
                                setProductSearchTerm(''); // Clear search when toggling
                            }}
                            className={`px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors ${isAddingProduct ? 'bg-coffee-200 text-coffee-800' : 'bg-coffee-800 text-white'}`}
                        >
                            {isAddingProduct ? <X size={16}/> : <Plus size={16}/>}
                            {isAddingProduct ? 'Annulla' : 'Aggiungi Altro'}
                        </button>
                     </div>
                     
                     {/* Add Product Dropdown/Results */}
                     {isAddingProduct && (
                         <div className="max-h-40 overflow-y-auto bg-white dark:bg-dark-surface rounded-xl shadow-lg border border-coffee-100 dark:border-dark-border animate-in fade-in slide-in-from-top-2">
                             {allProductsSearchResults.length > 0 ? allProductsSearchResults.map(p => (
                                 <button
                                    key={p.id}
                                    onClick={() => {
                                        setExtraProductIds(prev => [...prev, p.id]);
                                        setIsAddingProduct(false);
                                        setProductSearchTerm('');
                                    }}
                                    className="w-full text-left p-3 hover:bg-coffee-50 dark:hover:bg-coffee-800 border-b border-gray-50 dark:border-gray-800 last:border-0"
                                 >
                                     <p className="text-sm font-bold text-coffee-900 dark:text-white">{p.name}</p>
                                     <p className="text-[10px] text-coffee-400">{p.supplier}</p>
                                 </button>
                             )) : (
                                 <p className="p-3 text-xs text-coffee-400 text-center">Nessun prodotto trovato nel catalogo.</p>
                             )}
                         </div>
                     )}
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {displayedProducts.map(p => {
                        const entry = entries[p.id] || { quantity: '', totalCost: '' };
                        const isActive = entry.quantity !== '' || entry.totalCost !== '';

                        return (
                            <div key={p.id} className={`p-3 rounded-2xl border transition-all ${isActive ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900' : 'bg-white dark:bg-dark-surface border-transparent'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-coffee-900 dark:text-white">{p.name}</p>
                                        <p className="text-[10px] text-coffee-400">{p.code}</p>
                                    </div>
                                    {p.supplier !== selectedSupplier && (
                                        <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Extra</span>
                                    )}
                                </div>
                                
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[9px] font-bold text-coffee-500 uppercase mb-1 block">Quantità</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                placeholder="0"
                                                className={`w-full p-2 pl-8 rounded-lg font-bold text-coffee-900 dark:text-white outline-none border focus:ring-2 focus:ring-green-200 ${isActive ? 'bg-white dark:bg-dark-bg border-green-300' : 'bg-gray-50 dark:bg-dark-bg border-transparent'}`}
                                                value={entry.quantity}
                                                onChange={e => handleEntryChange(p.id, 'quantity', e.target.value)}
                                            />
                                            <Package size={14} className="absolute left-2.5 top-3 text-coffee-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[9px] font-bold text-coffee-500 uppercase mb-1 block">Costo Totale (€)</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                placeholder="0.00"
                                                className={`w-full p-2 pl-8 rounded-lg font-bold text-coffee-900 dark:text-white outline-none border focus:ring-2 focus:ring-green-200 ${isActive ? 'bg-white dark:bg-dark-bg border-green-300' : 'bg-gray-50 dark:bg-dark-bg border-transparent'}`}
                                                value={entry.totalCost}
                                                onChange={e => handleEntryChange(p.id, 'totalCost', e.target.value)}
                                            />
                                            <Euro size={14} className="absolute left-2.5 top-3 text-coffee-400" />
                                        </div>
                                        {isActive && entry.quantity && entry.totalCost && (
                                            <p className="text-[9px] text-right text-coffee-400 mt-1">
                                                ~ €{(parseFloat(entry.totalCost) / parseInt(entry.quantity)).toFixed(2)} /pz
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {displayedProducts.length === 0 && !isAddingProduct && (
                        <div className="text-center py-10">
                            <p className="text-coffee-400 mb-2">Nessun prodotto trovato per {selectedSupplier}.</p>
                            <button onClick={() => setIsAddingProduct(true)} className="text-indigo-600 font-bold text-sm underline">Aggiungi un prodotto dal catalogo</button>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white dark:bg-dark-surface border-t border-coffee-100 dark:border-dark-border flex gap-3">
                    <button 
                        onClick={() => setStep('SUPPLIER')}
                        className="px-4 py-4 rounded-2xl font-bold text-coffee-600 bg-coffee-100 hover:bg-coffee-200 transition-colors"
                    >
                        Indietro
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className="flex-1 bg-coffee-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center active:scale-[0.98] transition-all"
                    >
                        <Check className="mr-2" /> Conferma Carico
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
