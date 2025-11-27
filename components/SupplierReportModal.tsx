import React, { useMemo } from 'react';
import { Product, InventoryItem } from '../types';
import { ArrowLeft, Building2, Package, Euro, Copy } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';

interface SupplierReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventory: InventoryItem[];
}

export const SupplierReportModal: React.FC<SupplierReportModalProps> = ({ isOpen, onClose, products, inventory }) => {
  const supplierData = useMemo(() => {
    const suppliers: Record<string, { totalItems: number; totalCost: number; products: any[] }> = {};

    products.forEach(p => {
      if (!suppliers[p.supplier]) {
        suppliers[p.supplier] = { totalItems: 0, totalCost: 0, products: [] };
      }

      const prodStock = inventory
        .filter(i => i.productId === p.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (prodStock > 0) {
        suppliers[p.supplier].totalItems += prodStock;
        suppliers[p.supplier].totalCost += prodStock * p.costPrice;
        suppliers[p.supplier].products.push({
          name: p.name,
          qty: prodStock,
          cost: prodStock * p.costPrice
        });
      }
    });

    return Object.entries(suppliers)
      .map(([name, data]) => ({ name, ...data }))
      .filter(s => s.totalItems > 0)
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [products, inventory]);

  const handleCopyReport = async () => {
      const lines = [`📦 REPORT GIACENZE - ${new Date().toLocaleDateString('it-IT')}\n`];

      supplierData.forEach(supplier => {
          lines.push(`🏢 ${supplier.name.toUpperCase()}`);
          supplier.products.forEach(p => {
              lines.push(`- ${p.name}: ${p.qty} pz`);
          });
          lines.push('');
      });

      const text = lines.join('\n');
      try {
          await navigator.clipboard.writeText(text);
          alert("Report copiato negli appunti! Puoi incollarlo su WhatsApp o nelle Note.");
      } catch (e) {
          alert("Impossibile copiare il report.");
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-[#f9f5f3] w-full max-w-2xl h-[92vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-white border-b border-coffee-100">
          <div className="flex items-center gap-4">
              <button 
                onClick={onClose} 
                className="h-10 w-10 flex items-center justify-center rounded-full bg-coffee-50 text-coffee-800 hover:bg-coffee-100 transition-colors"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </button>
              <div>
                <h2 className="text-xl font-extrabold text-coffee-900">Report Fornitori</h2>
                <p className="text-xs text-coffee-500 font-medium">Analisi stock per fornitore</p>
              </div>
          </div>
          <button 
            onClick={handleCopyReport}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
            title="Copia lista completa"
          >
             <Copy size={18} /> <span className="hidden sm:inline">Copia Report</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {supplierData.length === 0 ? (
            <div className="text-center py-20 text-coffee-400">
              <Package size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nessun dato disponibile.</p>
            </div>
          ) : (
            supplierData.map((supplier, idx) => (
              <div key={idx} className="bg-white rounded-3xl shadow-sm border border-white overflow-hidden">
                <div className="bg-coffee-50/50 p-4 border-b border-coffee-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl text-coffee-600 shadow-sm">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-coffee-800 text-sm">{supplier.name}</h3>
                        <p className="text-[10px] font-bold text-coffee-400 uppercase tracking-wide">{supplier.products.length} Referenze</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-coffee-800">€{supplier.totalCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-50">
                  {supplier.products.map((prod, pIdx) => (
                    <div key={pIdx} className="p-3 flex justify-between items-center hover:bg-[#faf9f8] transition-colors">
                      <div className="flex-1 pr-4">
                         <p className="text-xs font-bold text-coffee-700 line-clamp-1">{prod.name}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="bg-coffee-100 text-coffee-700 px-2 py-1 rounded-lg font-bold min-w-[3rem] text-center">
                          {prod.qty} pz
                        </span>
                        <span className="w-16 text-right text-coffee-400 font-medium">
                          €{prod.cost.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};