import React, { useState, useMemo } from 'react';
import { Transaction, Product } from '../types';
import { ArrowLeft, History, Filter, Calendar } from 'lucide-react';

interface ProductHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  transactions: Transaction[];
}

export const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({ isOpen, onClose, product, transactions }) => {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  if (!isOpen) return null;

  // Filter only IN transactions (Purchases) for this product
  const inboundTransactions = useMemo(() => {
    return transactions.filter(t => t.productId === product.id && t.type === 'IN');
  }, [transactions, product.id]);

  // Extract available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set(inboundTransactions.map(t => new Date(t.date).getFullYear().toString()));
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [inboundTransactions]);

  // Filter based on selection
  const filteredTransactions = useMemo(() => {
    return inboundTransactions.filter(t => {
      const d = new Date(t.date);
      const yearMatch = d.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'ALL' || (d.getMonth() + 1).toString() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [inboundTransactions, selectedYear, selectedMonth]);

  // Calculate Average Cost for the selected period
  const periodStats = useMemo(() => {
    if (filteredTransactions.length === 0) return null;
    let totalQty = 0;
    let totalCost = 0;
    filteredTransactions.forEach(t => {
      totalQty += t.quantity;
      if (t.unitPrice) totalCost += t.quantity * t.unitPrice;
    });
    return {
      avgCost: totalCost > 0 ? totalCost / totalQty : 0,
      totalQty
    };
  }, [filteredTransactions]);

  const months = [
    { value: '1', label: 'Gennaio' },
    { value: '2', label: 'Febbraio' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Aprile' },
    { value: '5', label: 'Maggio' },
    { value: '6', label: 'Giugno' },
    { value: '7', label: 'Luglio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Settembre' },
    { value: '10', label: 'Ottobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Dicembre' },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-[#f9f5f3] dark:bg-dark-bg w-full max-w-md h-[90vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-4 bg-white dark:bg-dark-surface border-b border-coffee-100 dark:border-dark-border flex items-center gap-4">
          <button 
            onClick={onClose} 
            className="h-10 w-10 flex items-center justify-center rounded-full bg-coffee-50 dark:bg-coffee-800 text-coffee-800 dark:text-white hover:bg-coffee-100 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-coffee-900 dark:text-white">Storico Acquisti</h2>
            <p className="text-xs text-coffee-500 dark:text-coffee-400 font-medium line-clamp-1">{product.name}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white dark:bg-dark-surface border-b border-coffee-100 dark:border-dark-border grid grid-cols-2 gap-3">
             <div className="relative">
                 <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full appearance-none pl-9 pr-4 py-2 bg-gray-50 dark:bg-coffee-800/50 rounded-xl text-sm font-bold text-coffee-900 dark:text-white outline-none"
                 >
                     {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
                 <Calendar className="absolute left-3 top-2.5 text-coffee-400" size={16} />
             </div>
             <div className="relative">
                 <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full appearance-none pl-9 pr-4 py-2 bg-gray-50 dark:bg-coffee-800/50 rounded-xl text-sm font-bold text-coffee-900 dark:text-white outline-none"
                 >
                     <option value="ALL">Tutto l'anno</option>
                     {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                 </select>
                 <Filter className="absolute left-3 top-2.5 text-coffee-400" size={16} />
             </div>
        </div>

        {/* Period Summary */}
        <div className="p-4 bg-coffee-50 dark:bg-dark-surface/50 border-b border-coffee-100 dark:border-dark-border flex justify-between items-center">
             <div>
                 <p className="text-[10px] font-bold text-coffee-500 dark:text-coffee-400 uppercase">Costo Medio (Periodo)</p>
                 <p className="text-2xl font-extrabold text-coffee-900 dark:text-white">
                     {periodStats ? `€${periodStats.avgCost.toFixed(2)}` : 'N/D'}
                 </p>
             </div>
             <div>
                 <p className="text-[10px] font-bold text-coffee-500 dark:text-coffee-400 uppercase text-right">Acquistati</p>
                 <p className="text-2xl font-extrabold text-coffee-700 dark:text-coffee-300 text-right">
                     {periodStats ? periodStats.totalQty : 0} pz
                 </p>
             </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-coffee-400 dark:text-coffee-500">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nessun acquisto nel periodo selezionato.</p>
            </div>
          ) : (
            filteredTransactions.map((t) => (
              <div key={t.id} className="bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-dark-border flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-coffee-300 dark:text-coffee-500">
                      {new Date(t.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-xs font-bold">
                          +{t.quantity} pz
                      </span>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-coffee-400 uppercase">Costo Unitario</p>
                   <p className="text-lg font-bold text-coffee-800 dark:text-coffee-200">
                       {t.unitPrice ? `€${t.unitPrice.toFixed(2)}` : '-'}
                   </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};