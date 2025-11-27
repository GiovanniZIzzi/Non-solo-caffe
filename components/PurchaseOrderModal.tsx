
import React, { useMemo } from 'react';
import { Product, InventoryItem, LocationType } from '../types';
import { X, ShoppingCart, Copy, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventory: InventoryItem[];
}

interface OrderItem {
  product: Product;
  currentStock: number;
  alertThreshold: number;
  idealStock: number;
  toOrder: number;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ isOpen, onClose, products, inventory }) => {
  
  const orderData = useMemo(() => {
    const grouped: Record<string, OrderItem[]> = {};
    let totalItems = 0;

    products.forEach(p => {
      // Check Magazzino Stock
      const magStock = inventory.find(i => i.productId === p.id && i.location === LocationType.MAGAZZINO)?.quantity || 0;
      
      // Threshold check: Is it below the alert level?
      if (magStock < p.alertThresholdWarehouse) {
          
          // Calculate how many to order to reach Ideal Stock
          // If idealStock is not set properly (e.g. 0), default to filling up to double the threshold + 10 buffer
          const target = p.idealStockMagazzino > p.alertThresholdWarehouse 
                         ? p.idealStockMagazzino 
                         : (p.alertThresholdWarehouse * 2) + 10;
          
          const qtyToOrder = target - magStock;

          if (qtyToOrder > 0) {
              if (!grouped[p.supplier]) {
                  grouped[p.supplier] = [];
              }
              
              grouped[p.supplier].push({
                  product: p,
                  currentStock: magStock,
                  alertThreshold: p.alertThresholdWarehouse,
                  idealStock: target,
                  toOrder: qtyToOrder
              });
              totalItems++;
          }
      }
    });

    return { grouped, totalItems };
  }, [products, inventory]);

  const handleCopyOrder = async () => {
      const lines = [`🛒 ORDINE FORNITORI - ${new Date().toLocaleDateString('it-IT')}\n`];

      Object.entries(orderData.grouped).forEach(([supplier, items]) => {
          lines.push(`🏢 ${supplier.toUpperCase()}`);
          items.forEach(item => {
              lines.push(`- ${item.product.name}: ${item.toOrder} pz`);
          });
          lines.push('');
      });

      const text = lines.join('\n');
      try {
          await navigator.clipboard.writeText(text);
          alert("Lista ordini copiata! Pronta per essere inviata.");
      } catch (e) {
          alert("Impossibile copiare la lista.");
      }
  };

  if (!isOpen) return null;

  const suppliers = Object.keys(orderData.grouped).sort();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="bg-[#f9f5f3] dark:bg-dark-bg w-full max-w-3xl h-[90vh] rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white dark:bg-dark-surface p-5 border-b border-coffee-100 dark:border-dark-border flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-700 dark:text-orange-400">
                    <ShoppingCart size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-coffee-900 dark:text-white">Genera Ordini</h2>
                    <p className="text-xs text-coffee-500 dark:text-coffee-400 font-medium">Basato su scorte minime Magazzino</p>
                </div>
            </div>
            <div className="flex gap-2">
                 <button 
                    onClick={handleCopyOrder} 
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                >
                    <Copy size={18} /> <span className="hidden sm:inline">Copia Ordini</span>
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f9f5f3] dark:bg-dark-bg">
            {orderData.totalItems === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-coffee-400">
                    <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-full mb-4">
                         <TrendingUp size={48} className="text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-lg font-bold text-coffee-600 dark:text-coffee-300">Magazzino Ben Fornito!</p>
                    <p className="text-sm">Nessun prodotto è sotto la soglia minima.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-xl p-4 flex gap-3">
                         <AlertCircle className="text-orange-600 dark:text-orange-400 shrink-0" size={20}/>
                         <p className="text-xs text-orange-800 dark:text-orange-200">
                             Sono stati trovati <strong>{orderData.totalItems} prodotti</strong> sotto la soglia di allarme del Magazzino. 
                             Le quantità suggerite servono a riportare lo stock al livello ideale.
                         </p>
                    </div>

                    {suppliers.map(supplier => (
                        <div key={supplier} className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-coffee-50 dark:border-dark-border overflow-hidden">
                            <div className="bg-gray-50 dark:bg-coffee-800/30 p-3 border-b border-gray-100 dark:border-dark-border flex justify-between items-center">
                                <h3 className="font-extrabold text-coffee-900 dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-coffee-400"></span>
                                    {supplier}
                                </h3>
                                <span className="text-[10px] font-bold bg-white dark:bg-coffee-800 px-2 py-1 rounded-lg text-coffee-500 shadow-sm border border-gray-100 dark:border-gray-700">
                                    {orderData.grouped[supplier].length} Articoli
                                </span>
                            </div>
                            <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {orderData.grouped[supplier].map((item, idx) => (
                                    <div key={idx} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-coffee-800/10 transition-colors">
                                        <div className="flex-1 pr-4">
                                            <p className="text-sm font-bold text-coffee-800 dark:text-white">{item.product.name}</p>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-coffee-400 font-mono">
                                                <span>Attuale: <span className="text-red-500 font-bold">{item.currentStock}</span></span>
                                                <ArrowRight size={10} />
                                                <span>Minimo: {item.alertThreshold}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[9px] font-bold text-coffee-400 uppercase mb-0.5">Da Ordinare</span>
                                            <div className="flex items-center justify-end gap-2 text-indigo-600 dark:text-indigo-400">
                                                <span className="text-xl font-black">{item.toOrder}</span>
                                                <span className="text-xs font-bold">pz</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
