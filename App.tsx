import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from './components/Layout';
import { InventoryList } from './components/InventoryList';
import { Dashboard } from './components/Dashboard';
import { MovementLog } from './components/MovementLog';
import { QuickActionModal } from './components/QuickActionModal';
import { SupplierReportModal } from './components/SupplierReportModal';
import { ManualInvoiceModal } from './components/ManualInvoiceModal';
import { RestockModal } from './components/RestockModal';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { ProductHistoryModal } from './components/ProductHistoryModal';
import { Settings } from './components/Settings';
import { storageService } from './services/storageService';
import { Product, InventoryItem, Transaction, LocationType, FixedCost, AppSettings } from './types';
import { geminiService } from './services/geminiService';
import { Trash2, X, Save, AlertCircle, Camera, Truck, Tag, ArrowLeft, ScanLine, History, Box, PackageSearch, ChevronDown, PenLine } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { APP_LOGO_URL } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Standard Input Group
const InputGroup = ({ label, value, onChange, placeholder, type = "text" }: any) => (
  <div>
    <label className="text-[10px] font-bold text-coffee-500 dark:text-coffee-400 uppercase tracking-wider mb-1 block">{label}</label>
    <input 
        type={type}
        className="w-full p-3 bg-gray-50 dark:bg-dark-surface border border-transparent focus:bg-white dark:focus:bg-coffee-900 focus:border-coffee-500 dark:focus:border-coffee-500 rounded-xl text-sm font-medium text-coffee-900 dark:text-white outline-none transition-all" 
        value={value} 
        onChange={onChange}
        placeholder={placeholder}
    />
  </div>
);

// Smart Component: Select existing OR type new
const SelectOrInput = ({ label, value, onChange, options, placeholder }: { label: string, value: string, onChange: (val: string) => void, options: string[], placeholder?: string }) => {
    const [isCustom, setIsCustom] = useState(false);

    // If the incoming value is not in the options list (and is not empty), default to custom mode
    useEffect(() => {
        if (value && !options.includes(value) && !isCustom) {
            setIsCustom(true);
        }
    }, []);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '__NEW__') {
            setIsCustom(true);
            onChange('');
        } else {
            onChange(val);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-coffee-500 dark:text-coffee-400 uppercase tracking-wider">{label}</label>
                <button 
                    onClick={() => {
                        setIsCustom(!isCustom);
                        if (!isCustom) onChange(''); // Clear when switching to custom to type
                    }}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                    {isCustom ? 'Scegli da lista' : '+ Nuovo/Modifica'}
                </button>
            </div>
            
            {isCustom ? (
                <div className="relative animate-in fade-in zoom-in-95 duration-200">
                    <input 
                        type="text"
                        className="w-full p-3 bg-white dark:bg-dark-surface border-2 border-indigo-100 dark:border-indigo-900/50 focus:border-indigo-500 rounded-xl text-sm font-medium text-coffee-900 dark:text-white outline-none transition-all" 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder || "Digita nuovo valore..."}
                        autoFocus
                    />
                    <PenLine size={14} className="absolute right-3 top-3.5 text-indigo-400" />
                </div>
            ) : (
                <div className="relative">
                    <select
                        className="w-full p-3 bg-gray-50 dark:bg-dark-surface border border-transparent focus:bg-white dark:focus:bg-coffee-900 focus:border-coffee-500 rounded-xl text-sm font-medium text-coffee-900 dark:text-white outline-none appearance-none transition-all"
                        value={options.includes(value) ? value : ''}
                        onChange={handleSelectChange}
                    >
                        <option value="">-- Seleziona --</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="__NEW__" className="font-bold text-indigo-600">+ Aggiungi Nuovo...</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-3.5 text-coffee-400 pointer-events-none" />
                </div>
            )}
        </div>
    );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ theme: 'system', showNavbar: true, logoUrl: APP_LOGO_URL });

  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [isSupplierReportOpen, setIsSupplierReportOpen] = useState(false);
  const [isManualInvoiceOpen, setIsManualInvoiceOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isPurchaseOrderOpen, setIsPurchaseOrderOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState<Product | null>(null);

  // Edit Product Inventory State
  const [editStockVet, setEditStockVet] = useState(0);
  const [editStockDep, setEditStockDep] = useState(0);
  const [editStockMag, setEditStockMag] = useState(0);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdSupplier, setNewProdSupplier] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdSell, setNewProdSell] = useState('');
  const [newProdThreshW, setNewProdThreshW] = useState('10');
  const [newProdThreshD, setNewProdThreshD] = useState('5');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isScanningForForm, setIsScanningForForm] = useState(false);
  const scannerRef = useRef<any>(null);

  // Derived lists for Dropdowns
  const existingSuppliers = useMemo(() => Array.from(new Set(products.map(p => p.supplier))).sort(), [products]);
  const existingCategories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  useEffect(() => {
    setProducts(storageService.getProducts());
    setInventory(storageService.getInventory());
    setTransactions(storageService.getTransactions());
    setFixedCosts(storageService.getFixedCosts());
    const savedSettings = storageService.getSettings();
    setSettings(savedSettings);
    applyTheme(savedSettings.theme);
  }, []);

  // Initialize stock inputs when editing a product
  useEffect(() => {
    if (editingProduct) {
        const vet = inventory.find(i => i.productId === editingProduct.id && i.location === LocationType.VETRINA)?.quantity || 0;
        const dep = inventory.find(i => i.productId === editingProduct.id && i.location === LocationType.DEPOSITO)?.quantity || 0;
        const mag = inventory.find(i => i.productId === editingProduct.id && i.location === LocationType.MAGAZZINO)?.quantity || 0;
        setEditStockVet(vet);
        setEditStockDep(dep);
        setEditStockMag(mag);
    }
  }, [editingProduct, inventory]);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      const root = window.document.documentElement;
      root.classList.remove('dark');
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          root.classList.add('dark');
      }
  };

  const updateSettings = (newSettings: AppSettings) => {
      setSettings(newSettings);
      storageService.saveSettings(newSettings);
      applyTheme(newSettings.theme);
  };

  useEffect(() => {
      if (!isScanningForForm && scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          scannerRef.current = null;
      }
  }, [isScanningForForm]);

  const startFormScanner = (onScanSuccess: (code: string) => void) => {
      setIsScanningForForm(true);
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
            "form-reader",
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
              onScanSuccess(decodedText);
              setIsScanningForForm(false);
              html5QrcodeScanner.clear();
          }, (errorMessage: string) => {});
      }, 300);
  };

  const handleTransaction = (type: 'IN' | 'OUT' | 'MOVE', productId: string, qty: number, from?: LocationType, to?: LocationType, unitCost?: number) => {
    const newTx: Transaction = {
      id: generateId(),
      date: new Date().toISOString(),
      type,
      productId,
      quantity: qty,
      fromLocation: from,
      toLocation: to,
      unitPrice: unitCost
    };

    if (type === 'IN' && unitCost !== undefined) {
        const product = products.find(p => p.id === productId);
        if (product) {
            const currentTotalStock = inventory
                .filter(i => i.productId === productId)
                .reduce((acc, curr) => acc + curr.quantity, 0);
            
            let newAverageCost = unitCost;
            
            if (currentTotalStock > 0) {
                const totalValue = (currentTotalStock * product.costPrice) + (qty * unitCost);
                newAverageCost = totalValue / (currentTotalStock + qty);
            }

            const updatedProduct = { ...product, costPrice: newAverageCost };
            const updatedProducts = products.map(p => p.id === productId ? updatedProduct : p);
            setProducts(updatedProducts);
            storageService.saveProducts(updatedProducts);
        }
    }

    const newInventory = [...inventory];
    const updateStock = (pid: string, loc: LocationType, change: number) => {
      const idx = newInventory.findIndex(i => i.productId === pid && i.location === loc);
      if (idx >= 0) {
        newInventory[idx].quantity = Math.max(0, newInventory[idx].quantity + change);
      } else if (change > 0) {
        newInventory.push({ productId: pid, location: loc, quantity: change });
      }
    };

    if (type === 'IN' && to) updateStock(productId, to, qty);
    else if (type === 'OUT' && from) updateStock(productId, from, -qty);
    else if (type === 'MOVE' && from && to) {
      updateStock(productId, from, -qty);
      updateStock(productId, to, qty);
    }

    setInventory(newInventory);
    storageService.saveInventory(newInventory);

    const newTransactions = [newTx, ...transactions];
    setTransactions(newTransactions);
    storageService.addTransaction(newTx);
  };

  const handleFixedCostAdd = (cost: Omit<FixedCost, 'id'>) => {
      const newCost = { ...cost, id: generateId() };
      const updated = [...fixedCosts, newCost];
      setFixedCosts(updated);
      storageService.saveFixedCosts(updated);
  };

  const handleFixedCostDelete = (id: string) => {
      const updated = fixedCosts.filter(c => c.id !== id);
      setFixedCosts(updated);
      storageService.saveFixedCosts(updated);
  };

  const handleBatchInvoiceLoad = (items: { productId: string; quantity: number; unitCost: number }[]) => {
      items.forEach(item => {
          handleTransaction('IN', item.productId, item.quantity, undefined, LocationType.MAGAZZINO, item.unitCost);
      });
      alert(`Caricati con successo ${items.length} prodotti nel Magazzino!`);
  };

  const handleBatchMove = (movements: { productId: string; qty: number; to: LocationType }[]) => {
    movements.forEach(m => {
        handleTransaction('MOVE', m.productId, m.qty, LocationType.MAGAZZINO, m.to);
    });
    alert(`Rifornimento completato! Sono stati spostati ${movements.length} articoli.`);
  };

  const resetNewProductForm = () => {
    setNewProdName('');
    setNewProdCode('');
    setNewProdSupplier('');
    setNewProdCategory('');
    setNewProdCost('');
    setNewProdSell('');
    setNewProdThreshW('10');
    setNewProdThreshD('5');
    setNewProdDesc('');
  };

  const handleAddProduct = async () => {
     const id = generateId();
     const newProd: Product = {
         id,
         code: newProdCode || generateId().substring(0,4).toUpperCase(),
         name: newProdName || 'Nuovo Prodotto',
         supplier: newProdSupplier || 'Generico',
         category: newProdCategory || 'Varie',
         costPrice: parseFloat(newProdCost) || 0,
         sellPrice: parseFloat(newProdSell) || 0,
         alertThresholdWarehouse: parseInt(newProdThreshW) || 10,
         alertThresholdDeposit: parseInt(newProdThreshD) || 5,
         idealStockVetrina: 5,
         idealStockDeposito: 10,
         idealStockMagazzino: 20
     };

     const updatedProds = [...products, newProd];
     setProducts(updatedProds);
     storageService.saveProducts(updatedProds);
     setNewProductModalOpen(false);
     resetNewProductForm();
  };

  const handleAiParse = async () => {
    if (!newProdDesc) return;
    setIsAiLoading(true);
    try {
        const data = await geminiService.parseProductInfo(newProdDesc);
        setNewProdName(data.name || '');
        setNewProdCode(data.code || '');
        setNewProdSupplier(data.supplier || '');
        setNewProdCategory(data.category || '');
        setNewProdCost(data.estimatedCost?.toString() || '');
        setNewProdSell(data.estimatedSell?.toString() || '');
        alert("Dati estratti con successo! Verifica e completa l'inserimento.");
        setNewProdDesc('');
    } catch (e) {
        alert('Errore AI. Inserisci manualmente.');
    } finally {
        setIsAiLoading(false);
    }
  };

  const saveEditedProduct = () => {
      if (!editingProduct) return;

      const updatedProds = products.map(p => p.id === editingProduct.id ? editingProduct : p);
      setProducts(updatedProds);
      storageService.saveProducts(updatedProds);

      let currentInventory = [...inventory];
      const transactionsToAdd: Transaction[] = [];

      const adjust = (loc: LocationType, newQty: number) => {
          const itemIndex = currentInventory.findIndex(i => i.productId === editingProduct.id && i.location === loc);
          const currentQty = itemIndex >= 0 ? currentInventory[itemIndex].quantity : 0;
          const diff = newQty - currentQty;

          if (diff !== 0) {
              if (itemIndex >= 0) {
                  currentInventory[itemIndex].quantity = newQty;
              } else {
                  currentInventory.push({ productId: editingProduct.id, location: loc, quantity: newQty });
              }

              transactionsToAdd.push({
                  id: generateId(),
                  date: new Date().toISOString(),
                  type: diff > 0 ? 'IN' : 'OUT',
                  productId: editingProduct.id,
                  quantity: Math.abs(diff),
                  toLocation: diff > 0 ? loc : undefined,
                  fromLocation: diff < 0 ? loc : undefined,
                  note: 'Rettifica Manuale Inventario'
              });
          }
      };

      adjust(LocationType.VETRINA, editStockVet);
      adjust(LocationType.DEPOSITO, editStockDep);
      adjust(LocationType.MAGAZZINO, editStockMag);

      if (transactionsToAdd.length > 0) {
          setInventory(currentInventory);
          storageService.saveInventory(currentInventory);
          
          const newTxList = [...transactionsToAdd, ...transactions];
          setTransactions(newTxList);
          localStorage.setItem('nsc_transactions', JSON.stringify(newTxList));
      }

      setEditingProduct(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return <InventoryList 
                  products={products} 
                  inventory={inventory} 
                  logoUrl={settings.logoUrl}
                  onAddProduct={() => setNewProductModalOpen(true)} 
                  onEditProduct={(p) => setEditingProduct(p)} 
                  onOpenSupplierReport={() => setIsSupplierReportOpen(true)}
                  onOpenHistory={(p) => setViewingHistoryProduct(p)}
               />;
      case 'dashboard':
        return <Dashboard 
                  products={products} 
                  inventory={inventory} 
                  fixedCosts={fixedCosts}
                  logoUrl={settings.logoUrl}
                  onAddFixedCost={handleFixedCostAdd}
                  onDeleteFixedCost={handleFixedCostDelete}
               />;
      case 'movements':
        return <MovementLog transactions={transactions} products={products} />;
      case 'settings':
          return <Settings settings={settings} onUpdate={updateSettings} onReset={storageService.clearData} />;
      default:
        return <InventoryList products={products} inventory={inventory} logoUrl={settings.logoUrl} onAddProduct={() => setNewProductModalOpen(true)} onEditProduct={setEditingProduct} onOpenSupplierReport={() => setIsSupplierReportOpen(true)} onOpenHistory={setViewingHistoryProduct} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onOpenAction={() => setIsActionModalOpen(true)}>
      {renderContent()}
      
      <QuickActionModal 
        isOpen={isActionModalOpen} 
        onClose={() => setIsActionModalOpen(false)} 
        products={products}
        inventory={inventory} 
        onSubmit={handleTransaction}
        onOpenInvoiceScanner={() => setIsManualInvoiceOpen(true)}
        onOpenRestock={() => setIsRestockModalOpen(true)}
        onOpenPurchaseOrder={() => setIsPurchaseOrderOpen(true)}
      />
      
      <SupplierReportModal
        isOpen={isSupplierReportOpen}
        onClose={() => setIsSupplierReportOpen(false)}
        products={products}
        inventory={inventory}
      />

      <ManualInvoiceModal 
        isOpen={isManualInvoiceOpen}
        onClose={() => setIsManualInvoiceOpen(false)}
        products={products}
        onSubmit={handleBatchInvoiceLoad}
      />

      <RestockModal 
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        products={products}
        inventory={inventory}
        onConfirm={handleBatchMove}
      />

      <PurchaseOrderModal 
        isOpen={isPurchaseOrderOpen}
        onClose={() => setIsPurchaseOrderOpen(false)}
        products={products}
        inventory={inventory}
      />

      {viewingHistoryProduct && (
          <ProductHistoryModal 
            isOpen={!!viewingHistoryProduct}
            onClose={() => setViewingHistoryProduct(null)}
            product={viewingHistoryProduct}
            transactions={transactions}
          />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center pointer-events-none">
              <div className="bg-white dark:bg-dark-bg w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 pointer-events-auto flex flex-col animate-in slide-in-from-bottom-20 sm:zoom-in-95 duration-300">
                  <div className="p-4 border-b border-coffee-100 dark:border-dark-border flex items-center gap-4 bg-white/80 dark:bg-dark-surface/80 rounded-t-3xl backdrop-blur-md sticky top-0 z-20">
                      <button onClick={() => setEditingProduct(null)} className="h-10 w-10 flex items-center justify-center rounded-full bg-coffee-50 dark:bg-coffee-800 text-coffee-800 dark:text-white hover:bg-coffee-100">
                          <ArrowLeft size={20} strokeWidth={2.5} />
                      </button>
                      <h2 className="text-lg font-extrabold text-coffee-900 dark:text-white">Modifica Prodotto</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                      {isScanningForForm ? (
                          <div className="mb-4 bg-black rounded-2xl overflow-hidden relative shadow-lg">
                               <div id="form-reader" className="w-full h-64"></div>
                               <button 
                                  onClick={() => setIsScanningForForm(false)}
                                  className="absolute top-4 right-4 bg-white p-2 rounded-full text-black z-10 shadow-lg"
                               >
                                   <X size={20} />
                               </button>
                               <p className="text-white text-center pb-4 text-xs font-medium">Inquadra il codice a barre</p>
                          </div>
                      ) : (
                          <>
                            <InputGroup label="Nome Prodotto" value={editingProduct.name} onChange={(e:any) => setEditingProduct({...editingProduct, name: e.target.value})} />
                            
                            <div>
                                <label className="text-[10px] font-bold text-coffee-500 dark:text-coffee-400 uppercase tracking-wider mb-1 block">Codice / Barcode</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 p-3 bg-gray-50 dark:bg-dark-surface border border-transparent rounded-xl text-sm font-mono text-coffee-900 dark:text-white outline-none" 
                                        value={editingProduct.code} 
                                        onChange={e => setEditingProduct({...editingProduct, code: e.target.value})}
                                    />
                                    <button 
                                        onClick={() => startFormScanner((code) => setEditingProduct({...editingProduct, code}))}
                                        className="bg-coffee-800 text-white px-4 rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                                    >
                                        <ScanLine size={18} /> 
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-coffee-500"></div>
                                <h3 className="text-xs font-extrabold text-coffee-900 dark:text-white mb-3 flex items-center uppercase tracking-wide pl-2">
                                    <PackageSearch className="mr-2 text-coffee-500" size={16}/> Rettifica Giacenza (Reale)
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center bg-purple-50 dark:bg-purple-900/10 p-2 rounded-xl">
                                        <label className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-1 block">Vetrina</label>
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => setEditStockVet(s => Math.max(0, s - 1))} className="w-6 h-6 bg-white dark:bg-coffee-800 rounded-lg shadow-sm text-coffee-600 dark:text-coffee-200 font-bold flex items-center justify-center active:scale-90 transition-transform">-</button>
                                            <input 
                                                type="number"
                                                className="w-full text-center font-extrabold text-lg text-purple-900 dark:text-purple-100 bg-transparent outline-none"
                                                value={editStockVet}
                                                onChange={e => setEditStockVet(parseInt(e.target.value) || 0)}
                                            />
                                            <button onClick={() => setEditStockVet(s => s + 1)} className="w-6 h-6 bg-white dark:bg-coffee-800 rounded-lg shadow-sm text-coffee-600 dark:text-coffee-200 font-bold flex items-center justify-center active:scale-90 transition-transform">+</button>
                                        </div>
                                    </div>
                                    <div className="text-center bg-amber-50 dark:bg-amber-900/10 p-2 rounded-xl">
                                        <label className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1 block">Deposito</label>
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => setEditStockDep(s => Math.max(0, s - 1))} className="w-6 h-6 bg-white dark:bg-coffee-800 rounded-lg shadow-sm text-coffee-600 dark:text-coffee-200 font-bold flex items-center justify-center active:scale-90 transition-transform">-</button>
                                            <input 
                                                type="number"
                                                className="w-full text-center font-extrabold text-lg text-amber-900 dark:text-amber-100 bg-transparent outline-none"
                                                value={editStockDep}
                                                onChange={e => setEditStockDep(parseInt(e.target.value) || 0)}
                                            />
                                            <button onClick={() => setEditStockDep(s => s + 1)} className="w-6 h-6 bg-white dark:bg-coffee-800 rounded-lg shadow-sm text-coffee-600 dark:text-coffee-200 font-bold flex items-center justify-center active:scale-90 transition-transform">+</button>
                                        </div>
                                    </div>
                                    <div className="text-center bg-blue-50 dark:bg-blue-900/10 p-2 rounded-xl">
                                        <label className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1 block">Magazzino</label>
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => setEditStockMag(s => Math.max(0, s - 1))} className="w-6 h-6 bg-white dark:bg-coffee-800 rounded-lg shadow-sm text-coffee-600 dark:text-coffee-200 font-bold flex items-center justify-center active:scale-90 transition-transform">-</button>
                                            <input 
                                                type="number"
                                                className="w-full text-center font-extrabold text-lg text-blue-900 dark:text-blue-100 bg-transparent outline-none"
                                                value={editStockMag}
                                                onChange={e => setEditStockMag(parseInt(e.target.value) || 0)}
                                            />
                                            <button onClick={() => setEditStockMag(s => s + 1)} className="w-6 h-6 bg-white dark:bg-coffee-800 rounded-lg shadow-sm text-coffee-600 dark:text-coffee-200 font-bold flex items-center justify-center active:scale-90 transition-transform">+</button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-400 text-center mt-2 italic">Modificando questi valori verrà registrata una rettifica.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <SelectOrInput 
                                    label="Fornitore" 
                                    value={editingProduct.supplier} 
                                    onChange={(val) => setEditingProduct({...editingProduct, supplier: val})} 
                                    options={existingSuppliers} 
                                    placeholder="Nuovo fornitore"
                                />
                                <SelectOrInput 
                                    label="Categoria" 
                                    value={editingProduct.category} 
                                    onChange={(val) => setEditingProduct({...editingProduct, category: val})} 
                                    options={existingCategories} 
                                    placeholder="Nuova categoria"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 items-end">
                                <InputGroup type="number" label="Costo Medio (€)" value={editingProduct.costPrice} onChange={(e:any) => setEditingProduct({...editingProduct, costPrice: parseFloat(e.target.value) || 0})} />
                                <button 
                                    onClick={() => setViewingHistoryProduct(editingProduct)}
                                    className="h-[46px] bg-coffee-100 dark:bg-coffee-800 text-coffee-800 dark:text-coffee-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mb-px"
                                >
                                    <History size={16} /> Storico Acquisti
                                </button>
                            </div>
                            
                            <InputGroup type="number" label="Prezzo Vendita (€)" value={editingProduct.sellPrice} onChange={(e:any) => setEditingProduct({...editingProduct, sellPrice: parseFloat(e.target.value) || 0})} />

                            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                                <h3 className="text-xs font-extrabold text-blue-800 dark:text-blue-200 mb-3 flex items-center uppercase tracking-wide">
                                    <Box className="mr-2 text-blue-500" size={16}/> Quantità Necessaria (Target)
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[9px] font-bold text-blue-600 dark:text-blue-300 uppercase mb-1 block text-center">Vetrina</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 bg-white dark:bg-dark-surface border border-blue-200 dark:border-blue-800 rounded-lg text-center font-bold text-coffee-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-200" 
                                            value={editingProduct.idealStockVetrina || 0} 
                                            onChange={e => setEditingProduct({...editingProduct, idealStockVetrina: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-blue-600 dark:text-blue-300 uppercase mb-1 block text-center">Deposito</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 bg-white dark:bg-dark-surface border border-blue-200 dark:border-blue-800 rounded-lg text-center font-bold text-coffee-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-200" 
                                            value={editingProduct.idealStockDeposito || 0} 
                                            onChange={e => setEditingProduct({...editingProduct, idealStockDeposito: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-blue-600 dark:text-blue-300 uppercase mb-1 block text-center">Magazzino</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 bg-white dark:bg-dark-surface border border-blue-200 dark:border-blue-800 rounded-lg text-center font-bold text-coffee-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-200" 
                                            value={editingProduct.idealStockMagazzino || 0} 
                                            onChange={e => setEditingProduct({...editingProduct, idealStockMagazzino: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>
                                <p className="text-[9px] text-blue-400 mt-2 text-center">Questi valori sono usati per il Rifornimento Intelligente.</p>
                            </div>

                            <div className="bg-orange-50/50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                                <h3 className="text-xs font-extrabold text-orange-800 dark:text-orange-200 mb-3 flex items-center uppercase tracking-wide">
                                    <AlertCircle className="mr-2 text-orange-500" size={16}/> Soglie Allarme (Minimo)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-bold text-orange-600 dark:text-orange-300 uppercase mb-1 block">Magazzino</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 bg-white dark:bg-dark-surface border border-orange-200 dark:border-orange-800 rounded-lg text-center font-bold text-coffee-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-200" 
                                            value={editingProduct.alertThresholdWarehouse} 
                                            onChange={e => setEditingProduct({...editingProduct, alertThresholdWarehouse: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-orange-600 dark:text-orange-300 uppercase mb-1 block">Deposito</label>
                                        <input 
                                            type="number"
                                            className="w-full p-2 bg-white dark:bg-dark-surface border border-orange-200 dark:border-orange-800 rounded-lg text-center font-bold text-coffee-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-200" 
                                            value={editingProduct.alertThresholdDeposit} 
                                            onChange={e => setEditingProduct({...editingProduct, alertThresholdDeposit: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>
                            </div>
                          </>
                      )}
                  </div>

                  <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface">
                      {!isScanningForForm && (
                          <button 
                            onClick={saveEditedProduct}
                            className="w-full bg-coffee-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-coffee-900/10 flex items-center justify-center active:scale-[0.98] transition-all"
                          >
                              <Save size={20} className="mr-2" /> Salva Modifiche
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Add Product Modal... (unchanged content) */}
      {newProductModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center pointer-events-none">
              <div className="bg-white dark:bg-dark-bg w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 pointer-events-auto flex flex-col animate-in slide-in-from-bottom-20 sm:zoom-in-95 duration-300">
                  <div className="p-4 border-b border-coffee-100 dark:border-dark-border flex items-center gap-4 bg-white/80 dark:bg-dark-surface/80 rounded-t-3xl backdrop-blur-md sticky top-0 z-20">
                     <button onClick={() => setNewProductModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-coffee-50 dark:bg-coffee-800 text-coffee-800 dark:text-white hover:bg-coffee-100">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                     </button>
                     <h2 className="text-lg font-extrabold text-coffee-900 dark:text-white">Nuovo Prodotto</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {isScanningForForm ? (
                        <div className="mb-4 bg-black rounded-2xl overflow-hidden relative shadow-lg">
                            <div id="form-reader" className="w-full h-64"></div>
                            <button 
                                onClick={() => setIsScanningForForm(false)}
                                className="absolute top-4 right-4 bg-white p-2 rounded-full text-black z-10"
                            >
                                <X size={20} />
                            </button>
                            <p className="text-white text-center pb-4 text-xs font-medium">Inquadra il codice a barre</p>
                        </div>
                  ) : (
                      <>
                        <InputGroup label="Nome Prodotto" value={newProdName} onChange={(e:any) => setNewProdName(e.target.value)} placeholder="Es. Caffè Borbone Blu" />
                        
                        <div>
                            <label className="text-[10px] font-bold text-coffee-500 dark:text-coffee-400 uppercase tracking-wider mb-1 block">Codice / Barcode</label>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 p-3 bg-gray-50 dark:bg-dark-surface border border-transparent rounded-xl text-sm font-mono text-coffee-900 dark:text-white outline-none" 
                                    value={newProdCode} 
                                    onChange={e => setNewProdCode(e.target.value)}
                                    placeholder="Scansiona o digita..."
                                />
                                <button 
                                    onClick={() => startFormScanner((code) => setNewProdCode(code))}
                                    className="bg-coffee-800 text-white px-4 rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                                >
                                    <ScanLine size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <SelectOrInput 
                                label="Fornitore" 
                                value={newProdSupplier} 
                                onChange={setNewProdSupplier} 
                                options={existingSuppliers} 
                                placeholder="Nuovo Fornitore"
                            />
                            <SelectOrInput 
                                label="Categoria" 
                                value={newProdCategory} 
                                onChange={setNewProdCategory} 
                                options={existingCategories} 
                                placeholder="Nuova Categoria"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup type="number" label="Costo (€)" value={newProdCost} onChange={(e:any) => setNewProdCost(e.target.value)} placeholder="0.00" />
                            <InputGroup type="number" label="Vendita (€)" value={newProdSell} onChange={(e:any) => setNewProdSell(e.target.value)} placeholder="0.00" />
                        </div>

                        <div className="bg-orange-50/50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                            <h3 className="text-xs font-extrabold text-orange-800 dark:text-orange-200 mb-3 flex items-center uppercase tracking-wide">
                                <AlertCircle className="mr-2 text-orange-500" size={16}/> Soglie Allarme
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] font-bold text-orange-600 dark:text-orange-300 uppercase mb-1 block">Magazzino</label>
                                    <input 
                                        type="number"
                                        className="w-full p-2 bg-white dark:bg-dark-surface border border-orange-200 dark:border-orange-800 rounded-lg text-center font-bold text-coffee-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-200" 
                                        value={newProdThreshW} 
                                        onChange={e => setNewProdThreshW(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-orange-600 dark:text-orange-300 uppercase mb-1 block">Deposito</label>
                                    <input 
                                        type="number"
                                        className="w-full p-2 bg-white dark:bg-dark-surface border border-orange-200 dark:border-orange-800 rounded-lg text-center font-bold text-coffee-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-200" 
                                        value={newProdThreshD} 
                                        onChange={e => setNewProdThreshD(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-coffee-100 dark:border-coffee-800"></div>
                            <span className="flex-shrink-0 mx-4 text-coffee-300 dark:text-coffee-600 text-[10px] font-bold tracking-widest uppercase">Oppure usa IA</span>
                            <div className="flex-grow border-t border-coffee-100 dark:border-coffee-800"></div>
                        </div>

                        <div>
                            <textarea 
                                className="w-full p-3 border border-transparent bg-indigo-50/50 dark:bg-indigo-900/30 focus:bg-indigo-50 rounded-xl text-sm h-20 outline-none transition-colors text-coffee-900 dark:text-white"
                                placeholder="Incolla qui la descrizione..."
                                value={newProdDesc}
                                onChange={e => setNewProdDesc(e.target.value)}
                            ></textarea>
                            <button 
                                onClick={handleAiParse} 
                                disabled={isAiLoading || !newProdDesc}
                                className="w-full mt-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 py-2 rounded-xl font-bold text-xs flex justify-center items-center hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
                            >
                                {isAiLoading ? 'Analisi in corso...' : '✨ Estrai Dati con IA'}
                            </button>
                        </div>
                      </>
                  )}
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface">
                    <button onClick={handleAddProduct} disabled={!newProdName} className="w-full bg-coffee-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-coffee-900/10 active:scale-[0.98] transition-all disabled:opacity-50">Crea Prodotto</button>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
}