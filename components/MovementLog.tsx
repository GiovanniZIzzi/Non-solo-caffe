import React, { useState, useMemo } from 'react';
import { Transaction, Product } from '../types';
import { ArrowRight, ArrowDownLeft, ArrowUpRight, History, Calendar, List, ChevronLeft, ChevronRight, X, CircleDot } from 'lucide-react';

interface MovementLogProps {
  transactions: Transaction[];
  products: Product[];
}

export const MovementLog: React.FC<MovementLogProps> = ({ transactions, products }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [currentDate, setCurrentDate] = useState(new Date()); // For Calendar Navigation
  const [selectedDay, setSelectedDay] = useState<Date | null>(null); // Specific selected day

  const getProdName = (id: string) => products.find(p => p.id === id)?.name || 'Prodotto sconosciuto';

  // --- Calendar Helpers ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 Sun, 1 Mon...
  // Adjust so Monday is 0
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // --- Data Grouping ---
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach(t => {
        const key = new Date(t.date).toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key)?.push(t);
    });
    return map;
  }, [transactions]);

  const selectedDayTransactions = useMemo(() => {
      if (!selectedDay) return [];
      return transactionsByDate.get(selectedDay.toDateString()) || [];
  }, [selectedDay, transactionsByDate]);

  // --- Render Functions ---
  
  const renderListItem = (t: Transaction) => {
    const isMove = t.type === 'MOVE';
    const isIn = t.type === 'IN';
    return (
        <div key={t.id} className="relative ml-6 animate-in slide-in-from-right-4 duration-300">
            {/* Dot on timeline */}
            <div className={`absolute -left-[31px] top-4 h-4 w-4 rounded-full border-2 border-white dark:border-dark-bg shadow-sm z-10 ${
                    isIn ? 'bg-green-500' : isMove ? 'bg-blue-500' : 'bg-amber-500'
            }`}></div>

            <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-dark-border flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md tracking-wide ${
                        isIn ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 
                        isMove ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 
                        'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    }`}>
                        {isIn ? 'CARICO' : isMove ? 'SPOSTAMENTO' : 'VENDITA / SCARICO'}
                    </span>
                    <span className="text-[10px] text-coffee-300 dark:text-coffee-500 font-medium">
                        {new Date(t.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                
                <h3 className="text-sm font-bold text-coffee-900 dark:text-white leading-tight">{getProdName(t.productId)}</h3>
                
                <div className="flex items-center justify-between mt-1 p-2 bg-[#faf8f7] dark:bg-coffee-800/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-medium">
                        {isIn ? (
                            <div className="flex items-center text-green-700 dark:text-green-400">
                                <ArrowDownLeft size={14} className="mr-1" />
                                <span>Dest: {t.toLocation}</span>
                            </div>
                        ) : isMove ? (
                            <div className="flex items-center text-coffee-600 dark:text-coffee-400">
                                <span className="text-coffee-400 dark:text-coffee-500">{t.fromLocation}</span>
                                <ArrowRight size={12} className="mx-1.5" />
                                <span className="text-coffee-800 dark:text-coffee-200">{t.toLocation}</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-amber-700 dark:text-amber-400">
                                <ArrowUpRight size={14} className="mr-1" />
                                <span>Orig: {t.fromLocation}</span>
                            </div>
                        )}
                    </div>
                    <span className="text-base font-extrabold text-coffee-800 dark:text-coffee-200">
                        {isIn || isMove ? '+' : '-'}{t.quantity}
                    </span>
                </div>
            </div>
        </div>
    );
  };

  const renderCalendar = () => {
    const days = [];
    // Empty cells for offset
    for (let i = 0; i < startOffset; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
        const dateKey = date.toDateString();
        const hasActivity = transactionsByDate.has(dateKey);
        const count = transactionsByDate.get(dateKey)?.length || 0;
        const isToday = new Date().toDateString() === dateKey;
        const isSelected = selectedDay?.toDateString() === dateKey;

        days.push(
            <button 
                key={d} 
                onClick={() => setSelectedDay(date)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border ${
                    isSelected 
                        ? 'bg-coffee-800 text-white border-coffee-800 shadow-md scale-105 z-10' 
                        : isToday
                            ? 'bg-white dark:bg-coffee-800 text-coffee-900 dark:text-white border-coffee-200 dark:border-coffee-700 font-bold'
                            : 'bg-white dark:bg-dark-surface text-coffee-600 dark:text-coffee-300 border-transparent hover:bg-gray-50 dark:hover:bg-coffee-800/50'
                }`}
            >
                <span className="text-sm">{d}</span>
                {hasActivity && (
                    <div className="flex gap-0.5 mt-1">
                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-coffee-400'}`}></div>
                    </div>
                )}
                {hasActivity && !isSelected && (
                    <span className="absolute top-1 right-1 text-[8px] text-coffee-300 font-mono">{count}</span>
                )}
            </button>
        );
    }

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 bg-white dark:bg-dark-surface p-3 rounded-2xl shadow-sm border border-coffee-50 dark:border-dark-border">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-coffee-800 rounded-full"><ChevronLeft size={20}/></button>
                <h3 className="font-bold text-lg text-coffee-900 dark:text-white capitalize">
                    {currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-coffee-800 rounded-full"><ChevronRight size={20}/></button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {['L','M','M','G','V','S','D'].map(d => (
                    <span key={d} className="text-xs font-bold text-coffee-400">{d}</span>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
                {days}
            </div>

            {/* Selected Day Detail Overlay */}
            {selectedDay && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none">
                     <div className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedDay(null)}></div>
                     <div className="bg-[#f9f5f3] dark:bg-dark-bg w-full max-w-md h-[70vh] rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col pointer-events-auto animate-in slide-in-from-bottom-20 duration-300">
                        <div className="p-4 border-b border-coffee-100 dark:border-dark-border bg-white dark:bg-dark-surface rounded-t-3xl flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-extrabold text-coffee-900 dark:text-white capitalize">
                                    {selectedDay.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                <p className="text-xs text-coffee-500 dark:text-coffee-400 font-bold">{selectedDayTransactions.length} Operazioni</p>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-2 bg-gray-100 dark:bg-coffee-800 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 relative">
                             <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-coffee-100 dark:bg-coffee-800"></div>
                             {selectedDayTransactions.length === 0 ? (
                                 <p className="text-center py-10 text-coffee-400">Nessun movimento in questa data.</p>
                             ) : (
                                 selectedDayTransactions.map(t => renderListItem(t))
                             )}
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="p-4 pt-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="bg-coffee-100 dark:bg-coffee-800 p-2 rounded-xl text-coffee-700 dark:text-coffee-200">
                <History size={24} />
            </div>
            <h1 className="text-2xl font-extrabold text-coffee-900 dark:text-white">Storico Movimenti</h1>
        </div>
        
        {/* View Toggle */}
        <div className="flex bg-white dark:bg-dark-surface p-1 rounded-xl shadow-sm border border-coffee-100 dark:border-dark-border">
            <button 
                onClick={() => setViewMode('LIST')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'LIST' ? 'bg-coffee-100 dark:bg-coffee-800 text-coffee-900 dark:text-white' : 'text-coffee-400'}`}
            >
                <List size={20} />
            </button>
            <button 
                onClick={() => setViewMode('CALENDAR')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'CALENDAR' ? 'bg-coffee-100 dark:bg-coffee-800 text-coffee-900 dark:text-white' : 'text-coffee-400'}`}
            >
                <Calendar size={20} />
            </button>
        </div>
      </div>
      
      {viewMode === 'LIST' ? (
          <div className="relative border-l-2 border-coffee-100 dark:border-coffee-800 ml-3 space-y-6">
            {transactions.length === 0 ? (
                <div className="ml-8 py-10 text-coffee-400 text-sm font-medium">Nessun movimento recente registrato.</div>
            ) : (
                transactions.map(t => renderListItem(t))
            )}
          </div>
      ) : (
          renderCalendar()
      )}
    </div>
  );
};