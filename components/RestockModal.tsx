
import React, { useState, useEffect } from 'react';
import { Product, InventoryItem, LocationType } from '../types';
import { X, Truck, Copy, CheckCircle, AlertTriangle, ArrowRight, Printer } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventory: InventoryItem[];
  onConfirm: (movements: { productId: string; qty: number; to: LocationType }[]) => void;
}

interface RestockItem {
  productId: string;
  productName: string;
  warehouseStock: number;
  
  currentVetrina: number;
  targetVetrina: number;
  fillVetrina: number; // How much to move to Vetrina
  
  currentDeposito: number;
  targetDeposito: number;
  fillDeposito: number; // How much to move to Deposito
}

export const RestockModal: React.FC<RestockModalProps> = ({ isOpen, onClose, products, inventory, onConfirm }) => {
  const [items, setItems] = useState<RestockItem[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      const calculated: RestockItem[] = [];
      
      products.forEach(p => {
        const stockMag = inventory.find(i => i.productId === p.id && i.location === LocationType.MAGAZZINO)?.quantity || 0;
        const stockVet = inventory.find(i => i.productId === p.id && i.location === LocationType.VETRINA)?.quantity || 0;
        const stockDep = inventory.find(i => i.productId === p.id && i.location === LocationType.DEPOSITO)?.quantity || 0;

        // Use user-defined Ideal Stocks
        const targetVet = p.idealStockVetrina || 5;
        const targetDep = p.idealStockDeposito || 10;

        let neededVet = Math.max(0, targetVet - stockVet);
        let neededDep = Math.max(0, targetDep - stockDep);

        // Optimization: Don't move if we have 0 in warehouse
        if (stockMag === 0) {
            neededVet = 0;
            neededDep = 0;
        } else {
            // Cap total needs by Warehouse availability
            const totalNeed = neededVet + neededDep;
            if (totalNeed > stockMag) {
                // Priority to Vetrina, then Deposito
                if (neededVet > stockMag) {
                    neededVet = stockMag;
                    neededDep = 0;
                } else {
                    neededDep = stockMag - neededVet;
                }
            }
        }

        if (neededVet > 0 || neededDep > 0) {
          calculated.push({
            productId: p.id,
            productName: p.name,
            warehouseStock: stockMag,
            currentVetrina: stockVet,
            targetVetrina: targetVet,
            fillVetrina: neededVet,
            currentDeposito: stockDep,
            targetDeposito: targetDep,
            fillDeposito: neededDep
          });
        }
      });
      
      setItems(calculated);
    }
  }, [isOpen, products, inventory]);

  const totalMoves = items.reduce((acc, item) => acc + item.fillVetrina + item.fillDeposito, 0);

  const handleCopyList = async () => {
    const lines = [`📦 LISTA PRELIEVO - ${new Date().toLocaleDateString('it-IT')}\n`];
    
    // Group items by supplier to make it easier for the warehouse worker
    const grouped: Record<string, RestockItem[]> = {};
    
    items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const supplier = prod?.supplier || 'Vari';
        if (!grouped[supplier]) grouped[supplier] = [];
        grouped[supplier].push(item);
    });

    Object.entries(grouped).forEach(([supplier, groupItems]) => {
        lines.push(`🏢 ${supplier.toUpperCase()}`);
        groupItems.forEach(item => {
            const totalQty = item.fillVetrina + item.fillDeposito;
            if (totalQty > 0) {
                // Added (Mag: X) for easier check
                lines.push(`- ${item.productName}: ${totalQty} pz (Mag: ${item.warehouseStock})`);
            }
        });
        lines.push(''); // Empty line between suppliers
    });

    const text = lines.join('\n');
    
    try {
        await navigator.clipboard.writeText(text);
        alert("Lista copiata! Incolla su WhatsApp.");
    } catch (err) {
        console.error('Failed to copy', err);
        alert("Impossibile copiare automaticamente.");
    }
  };

  const handleExecute = () => {
    const movements: { productId: string; qty: number; to: LocationType }[] = [];
    items.forEach(item => {
      if (item.fillVetrina > 0) movements.push({ productId: item.productId, qty: item.fillVetrina, to: LocationType.VETRINA });
      if (item.fillDeposito > 0) movements.push({ productId: item.productId, qty: item.fillDeposito, to: LocationType.DEPOSITO });
    });
    onConfirm(movements);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="bg-[#f9f5f3] dark:bg-dark-bg w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white dark:bg-dark-surface p-5 border-b border-coffee-100 dark:border-dark-border flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-coffee-100 dark:bg-coffee-800 p-2 rounded-xl text-coffee-700 dark:text-coffee-200">
                    <Truck size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-coffee-900 dark:text-white">Rifornimento Intelligente</h2>
                    <p className="text-xs text-coffee-500 dark:text-coffee-400 font-medium">Calcolato su Target Scorte</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleCopyList} 
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                    title="Copia per WhatsApp"
                >
                    <Copy size={18} /> <span className="hidden sm:inline">Copia Lista</span>
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f9f5f3] dark:bg-dark-bg">
            
            {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-coffee-400">
                    <CheckCircle size={64} className="mb-4 text-green-500/50" />
                    <p className="text-lg font-bold text-coffee-600 dark:text-coffee-300">Tutto in ordine!</p>
                    <p className="text-sm">I livelli di Vetrina e Deposito sono ottimali.</p>
                </div>
            ) : (
                <>
                   <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
                        <div>
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Revisione Prelievo</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                Queste quantità servono per ripristinare il livello ideale (Target) impostato per Vetrina e Deposito, prelevando dal Magazzino.
                            </p>
                        </div>
                   </div>

                   {/* Table */}
                   <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-coffee-50 dark:border-dark-border overflow-hidden">
                       <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wider text-coffee-500 dark:text-coffee-400 border-b border-coffee-100 dark:border-dark-border bg-gray-50 dark:bg-coffee-800/20">
                                    <th className="py-3 pl-4 font-bold">Prodotto</th>
                                    <th className="py-3 font-bold text-center text-blue-600 dark:text-blue-400">Magazzino</th>
                                    <th className="py-3 font-bold text-center text-amber-600 dark:text-amber-400">Per Vetrina</th>
                                    <th className="py-3 font-bold text-center text-amber-600 dark:text-amber-400">Per Deposito</th>
                                    <th className="py-3 pr-4 font-bold text-right">Totale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-coffee-50 dark:hover:bg-coffee-800/30 transition-colors">
                                        <td className="py-3 pl-4">
                                            <p className="text-sm font-bold text-coffee-900 dark:text-white">{item.productName}</p>
                                            <p className="text-[10px] text-coffee-400 font-mono mt-0.5">
                                                Vet: <span className={item.currentVetrina < item.targetVetrina ? 'text-red-500 font-bold' : ''}>{item.currentVetrina}</span>/{item.targetVetrina} | 
                                                Dep: <span className={item.currentDeposito < item.targetDeposito ? 'text-red-500 font-bold' : ''}>{item.currentDeposito}</span>/{item.targetDeposito}
                                            </p>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">{item.warehouseStock}</span>
                                        </td>
                                        <td className="py-3 text-center">
                                            <div className="flex items-center justify-center">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max={item.warehouseStock}
                                                    value={item.fillVetrina}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const maxAllowed = item.warehouseStock - item.fillDeposito;
                                                        if (val <= maxAllowed) {
                                                            const newItems = [...items];
                                                            newItems[idx].fillVetrina = val;
                                                            setItems(newItems);
                                                        }
                                                    }}
                                                    className="w-16 p-1 text-center text-sm font-bold border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-dark-bg text-coffee-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <div className="flex items-center justify-center">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max={item.warehouseStock}
                                                    value={item.fillDeposito}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const maxAllowed = item.warehouseStock - item.fillVetrina;
                                                        if (val <= maxAllowed) {
                                                            const newItems = [...items];
                                                            newItems[idx].fillDeposito = val;
                                                            setItems(newItems);
                                                        }
                                                    }}
                                                    className="w-16 p-1 text-center text-sm font-bold border border-coffee-200 dark:border-coffee-700 bg-white dark:bg-dark-bg text-coffee-900 dark:text-white rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-right">
                                            <span className="text-lg font-black text-coffee-900 dark:text-white">
                                                {item.fillVetrina + item.fillDeposito}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                       </table>
                   </div>
                </>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-dark-surface border-t border-coffee-50 dark:border-dark-border flex justify-between items-center">
            <div className="text-xs text-coffee-500 dark:text-coffee-400 font-medium">
                Totale Pezzi da Spostare: <span className="font-bold text-coffee-900 dark:text-white text-base ml-1">{totalMoves}</span>
            </div>
            <button 
                onClick={handleExecute}
                disabled={totalMoves === 0}
                className="bg-coffee-800 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-coffee-900/10 hover:bg-coffee-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-[0.98]"
            >
                <ArrowRight size={20} /> Conferma Spostamento
            </button>
        </div>
      </div>
    </div>
  );
};
