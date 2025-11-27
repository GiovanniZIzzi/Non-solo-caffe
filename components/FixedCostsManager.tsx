import React, { useState } from 'react';
import { FixedCost, CostFrequency } from '../types';
import { Plus, Trash2, Euro, Calendar, Tag, Clock } from 'lucide-react';

interface FixedCostsManagerProps {
  costs: FixedCost[];
  onAdd: (cost: Omit<FixedCost, 'id'>) => void;
  onDelete: (id: string) => void;
}

export const FixedCostsManager: React.FC<FixedCostsManagerProps> = ({ costs, onAdd, onDelete }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<CostFrequency>('MONTHLY');
  const [category, setCategory] = useState('');

  const handleAdd = () => {
    if (!name || !amount) return;
    onAdd({
      name,
      amount: parseFloat(amount),
      frequency,
      category: category || 'Generale'
    });
    setName('');
    setAmount('');
    setCategory('');
  };

  const getMonthlyEquivalent = (c: FixedCost) => {
    switch (c.frequency) {
        case 'DAILY': return c.amount * 30.41; // Average days in month
        case 'WEEKLY': return (c.amount * 52) / 12;
        case 'MONTHLY': return c.amount;
        case 'BIMONTHLY': return c.amount / 2;
        case 'QUARTERLY': return c.amount / 3;
        case 'SEMIANNUALLY': return c.amount / 6;
        case 'YEARLY': return c.amount / 12;
        case 'ONE_OFF': return 0;
        default: return 0;
    }
  };

  const totalMonthly = costs.reduce((acc, c) => acc + getMonthlyEquivalent(c), 0);

  const getFrequencyLabel = (f: CostFrequency) => {
      const labels: Record<CostFrequency, string> = {
          DAILY: 'Giornaliero',
          WEEKLY: 'Settimanale',
          MONTHLY: 'Mensile',
          BIMONTHLY: 'Bimestrale',
          QUARTERLY: 'Trimestrale',
          SEMIANNUALLY: 'Semestrale',
          YEARLY: 'Annuale',
          ONE_OFF: 'Una Tantum'
      };
      return labels[f];
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900">
          <div className="flex justify-between items-center">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Totale Spese Fisse (Mensilizzato)</h3>
              <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">€{totalMonthly.toFixed(2)}</p>
          </div>
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1">Stima basata sulla ripartizione mensile di tutti i costi ricorrenti.</p>
      </div>

      {/* Add Form */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-sm border border-coffee-100 dark:border-dark-border space-y-3">
         <h4 className="text-xs font-bold text-coffee-500 uppercase">Aggiungi Costo</h4>
         <div className="grid grid-cols-2 gap-3">
             <input 
                placeholder="Nome (es. Luce, Affitto)" 
                className="p-3 rounded-xl bg-gray-50 dark:bg-coffee-800/50 border-none text-sm text-coffee-900 dark:text-white outline-none"
                value={name} onChange={e => setName(e.target.value)}
             />
             <input 
                type="number" 
                placeholder="Importo €" 
                className="p-3 rounded-xl bg-gray-50 dark:bg-coffee-800/50 border-none text-sm text-coffee-900 dark:text-white outline-none"
                value={amount} onChange={e => setAmount(e.target.value)}
             />
         </div>
         <div className="grid grid-cols-2 gap-3">
             <div className="relative">
                 <select 
                    value={frequency} 
                    onChange={(e:any) => setFrequency(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-coffee-800/50 border-none text-sm text-coffee-900 dark:text-white outline-none appearance-none"
                 >
                     <option value="DAILY">Giornaliero</option>
                     <option value="WEEKLY">Settimanale</option>
                     <option value="MONTHLY">Mensile</option>
                     <option value="BIMONTHLY">Bimestrale (Ogni 2 mesi)</option>
                     <option value="QUARTERLY">Trimestrale (Ogni 3 mesi)</option>
                     <option value="SEMIANNUALLY">Semestrale (Ogni 6 mesi)</option>
                     <option value="YEARLY">Annuale</option>
                     <option value="ONE_OFF">Una Tantum</option>
                 </select>
                 <Clock size={16} className="absolute right-3 top-3.5 text-coffee-400 pointer-events-none" />
             </div>
             <input 
                placeholder="Categoria (es. Utenze)" 
                className="p-3 rounded-xl bg-gray-50 dark:bg-coffee-800/50 border-none text-sm text-coffee-900 dark:text-white outline-none"
                value={category} onChange={e => setCategory(e.target.value)}
             />
         </div>
         <button 
            onClick={handleAdd}
            disabled={!name || !amount}
            className="w-full bg-coffee-800 hover:bg-coffee-900 text-white font-bold py-3 rounded-xl shadow-md transition-colors disabled:opacity-50"
         >
             Aggiungi Spesa
         </button>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
          {costs.map(cost => (
              <div key={cost.id} className="flex justify-between items-center p-3 bg-white dark:bg-dark-surface rounded-xl border border-gray-50 dark:border-dark-border">
                  <div className="flex items-center gap-3">
                      <div className="bg-gray-100 dark:bg-coffee-800 p-2 rounded-lg text-coffee-600 dark:text-coffee-300">
                          {cost.frequency === 'ONE_OFF' ? <Tag size={18} /> : <Calendar size={18} />}
                      </div>
                      <div>
                          <p className="text-sm font-bold text-coffee-900 dark:text-white">{cost.name}</p>
                          <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-coffee-500 uppercase bg-coffee-50 dark:bg-coffee-900/40 px-1.5 py-0.5 rounded">{cost.category}</span>
                              <span className="text-[10px] text-coffee-400">{getFrequencyLabel(cost.frequency)}</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="text-right">
                          <p className="font-bold text-coffee-800 dark:text-coffee-200">€{cost.amount.toFixed(2)}</p>
                          {cost.frequency !== 'MONTHLY' && cost.frequency !== 'ONE_OFF' && (
                              <p className="text-[9px] text-coffee-400">~ €{getMonthlyEquivalent(cost).toFixed(2)}/mese</p>
                          )}
                      </div>
                      <button onClick={() => onDelete(cost.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 size={16} />
                      </button>
                  </div>
              </div>
          ))}
          {costs.length === 0 && (
              <p className="text-center text-coffee-400 text-xs py-4">Nessuna spesa fissa registrata.</p>
          )}
      </div>
    </div>
  );
};