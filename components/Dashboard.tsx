
import React, { useMemo, useState, useEffect } from 'react';
import { Product, InventoryItem, DashboardMetrics, LocationType, FixedCost } from '../types';
import { TrendingUp, Euro, Wallet, AlertOctagon, Sparkles, Store, Truck, Info, Briefcase, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { FixedCostsManager } from './FixedCostsManager';

interface DashboardProps {
  products: Product[];
  inventory: InventoryItem[];
  fixedCosts: FixedCost[];
  logoUrl?: string;
  onAddFixedCost: (c: Omit<FixedCost, 'id'>) => void;
  onDeleteFixedCost: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ products, inventory, fixedCosts, logoUrl, onAddFixedCost, onDeleteFixedCost }) => {
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState<string | null>(null);
  
  const alerts = useMemo(() => {
      const list: { prodName: string; location: LocationType; current: number; min: number }[] = [];
      products.forEach(p => {
          const magazzinoStock = inventory.find(i => i.productId === p.id && i.location === LocationType.MAGAZZINO)?.quantity || 0;
          if (magazzinoStock < p.alertThresholdWarehouse) {
              list.push({ prodName: p.name, location: LocationType.MAGAZZINO, current: magazzinoStock, min: p.alertThresholdWarehouse });
          }
          const depositoStock = inventory.find(i => i.productId === p.id && i.location === LocationType.DEPOSITO)?.quantity || 0;
          if (depositoStock < p.alertThresholdDeposit) {
              list.push({ prodName: p.name, location: LocationType.DEPOSITO, current: depositoStock, min: p.alertThresholdDeposit });
          }
      });
      return list;
  }, [products, inventory]);

  const metrics = useMemo(() => {
    let totalItems = 0;
    let totalCost = 0;
    let potentialRev = 0;
    inventory.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        totalItems += item.quantity;
        totalCost += item.quantity * prod.costPrice;
        potentialRev += item.quantity * prod.sellPrice;
      }
    });

    const totalMonthlyFixedCosts = fixedCosts.reduce((acc, c) => {
        if (c.frequency === 'MONTHLY') return acc + c.amount;
        if (c.frequency === 'YEARLY') return acc + (c.amount / 12);
        return acc; 
    }, 0);

    const potentialGrossMargin = potentialRev - totalCost;
    // ROI = (Net Profit / Cost) * 100. Simple stock ROI = (Margin / Cost) * 100
    const roi = totalCost > 0 ? (potentialGrossMargin / totalCost) * 100 : 0;

    return {
      totalItems,
      totalCostValue: totalCost,
      potentialRevenue: potentialRev,
      lowStockCount: alerts.length,
      potentialGrossMargin,
      totalMonthlyFixedCosts,
      roi
    };
  }, [products, inventory, alerts, fixedCosts]);

  const locationStats = useMemo(() => {
    const vetrina = inventory.filter(i => i.location === LocationType.VETRINA).reduce((a, b) => a + b.quantity, 0);
    const deposito = inventory.filter(i => i.location === LocationType.DEPOSITO).reduce((a, b) => a + b.quantity, 0);
    const magazzino = inventory.filter(i => i.location === LocationType.MAGAZZINO).reduce((a, b) => a + b.quantity, 0);
    return { vetrina, deposito, magazzino, shopTotal: vetrina + deposito };
  }, [inventory]);

  useEffect(() => {
      if (alerts.length > 0 && !aiTip) {
          if (process.env.API_KEY) {
            const alertSummary = alerts.slice(0, 3).map(a => `${a.prodName} (${a.location})`).join(', ');
            geminiService.analyzeStock([alertSummary]).then(setAiTip);
          } else {
            setAiTip(`Hai ${alerts.length} avvisi di giacenza. Controlla il Centro Notifiche.`);
          }
      }
  }, [alerts]);

  const InfoTooltip = ({ id, title, desc }: any) => (
      showInfo === id && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowInfo(null)}>
              <div className="bg-white dark:bg-dark-surface p-6 rounded-2xl max-w-xs shadow-xl border border-coffee-100 dark:border-dark-border animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2 mb-2 text-coffee-800 dark:text-white">
                      <Info size={20} /> <h3 className="font-bold text-lg">{title}</h3>
                  </div>
                  <p className="text-sm text-coffee-600 dark:text-coffee-300">{desc}</p>
                  <button onClick={() => setShowInfo(null)} className="mt-4 w-full bg-coffee-100 dark:bg-coffee-800 text-coffee-800 dark:text-white py-2 rounded-xl font-bold text-xs">Chiudi</button>
              </div>
          </div>
      )
  );

  return (
    <div className="p-4 space-y-6 pt-8 pb-32 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 md:hidden">
         {/* Logo Container */}
         <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center">
             {logoUrl && (
                <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="max-h-full max-w-full object-contain drop-shadow-sm" 
                />
             )}
         </div>
         <div>
            <h1 className="text-3xl font-extrabold text-coffee-900 dark:text-white leading-none tracking-tight">Dashboard</h1>
            <p className="text-sm text-coffee-500 dark:text-coffee-400 font-medium mt-1">Financial Overview</p>
         </div>
      </div>
      
      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
          <h2 className="text-3xl font-extrabold text-coffee-900 dark:text-white">Analisi Finanziaria</h2>
          <p className="text-coffee-500 dark:text-coffee-400">Panoramica delle performance e dello stato del magazzino.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Stats */}
          <div className="lg:col-span-2 space-y-6">
              {/* KPI Cards */}
              <div>
                  <h2 className="text-sm font-bold text-coffee-800 dark:text-coffee-200 mb-3 flex items-center px-1">
                      <Wallet size={16} className="mr-2 text-coffee-500" /> Situazione Finanziaria
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-dark-surface p-5 rounded-3xl shadow-sm border border-coffee-50 dark:border-dark-border relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-coffee-50 dark:bg-coffee-800/30 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-2.5 bg-coffee-100/50 dark:bg-coffee-800 rounded-xl text-coffee-700 dark:text-coffee-200">
                                      <Euro size={20} />
                                  </div>
                                  <button onClick={() => setShowInfo('assets')} className="text-[10px] font-bold bg-coffee-50 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-300 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-coffee-100">ASSETS <Info size={10}/></button>
                              </div>
                              <p className="text-coffee-400 dark:text-coffee-500 text-[10px] uppercase font-bold tracking-widest">Valore Magazzino (Costo)</p>
                              <p className="text-3xl font-extrabold text-coffee-900 dark:text-white mt-1 tracking-tight">€ {metrics.totalCostValue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                      </div>

                      <div className="bg-white dark:bg-dark-surface p-5 rounded-3xl shadow-sm border border-green-50 dark:border-green-900/30 relative overflow-hidden group hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                                      <TrendingUp size={20} />
                                  </div>
                                  <button onClick={() => setShowInfo('margin')} className="text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-green-100">MARGINI <Info size={10}/></button>
                              </div>
                              <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-green-600/60 dark:text-green-400/60 text-[10px] uppercase font-bold tracking-widest">Potenziale Vendita</p>
                                    <p className="text-3xl font-extrabold text-green-900 dark:text-white mt-1 tracking-tight">€ {metrics.potentialRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-900/30 flex justify-between items-center">
                                  <span className="text-xs font-bold text-green-800 dark:text-green-300">Margine Lordo: {metrics.roi.toFixed(1)}%</span>
                                  <span className="text-xs font-bold text-green-600 dark:text-green-400">+ €{metrics.potentialGrossMargin.toLocaleString('it-IT', {maximumFractionDigits:0})}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Stock Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Punto Vendita Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-3xl border border-amber-100 dark:border-amber-900/40 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white dark:bg-amber-800 p-1.5 rounded-lg shadow-sm text-amber-600 dark:text-amber-200"><Store size={16} /></div>
                        <h3 className="text-xs font-extrabold text-amber-900 dark:text-amber-100 uppercase tracking-wide">Punto Vendita</h3>
                    </div>
                    <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-2">{locationStats.shopTotal}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-amber-800 dark:text-amber-200 border-b border-amber-200/50 dark:border-amber-700/50 pb-0.5">
                            <span>Vetrina</span> <span>{locationStats.vetrina}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-amber-800 dark:text-amber-200">
                            <span>Deposito</span> <span>{locationStats.deposito}</span>
                        </div>
                    </div>
                </div>

                {/* Magazzino Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/40 shadow-sm flex flex-col justify-between">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white dark:bg-blue-800 p-1.5 rounded-lg shadow-sm text-blue-600 dark:text-blue-200"><Truck size={16} /></div>
                        <h3 className="text-xs font-extrabold text-blue-900 dark:text-blue-100 uppercase tracking-wide">Magazzino</h3>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-blue-900 dark:text-blue-100">{locationStats.magazzino}</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-300 font-medium leading-tight mt-1 opacity-70">Sede staccata</p>
                    </div>
                </div>
              </div>
          </div>

          {/* Right Column: Notifications & Expenses */}
          <div className="space-y-6">
              {/* Notifications Center */}
              <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-glass border border-white/50 dark:border-white/10 overflow-hidden h-full max-h-96 flex flex-col">
                  <div className="p-4 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-dark-surface flex items-center justify-between">
                      <h2 className="font-bold text-coffee-800 dark:text-white flex items-center text-sm">
                          <AlertOctagon size={18} className="mr-2 text-red-500" /> Centro Notifiche
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${alerts.length > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
                          {alerts.length > 0 ? `${alerts.length} AVVISI` : 'TUTTO OK'}
                      </span>
                  </div>
                  <div className="overflow-y-auto p-2 bg-[#faf7f5] dark:bg-black/20 flex-1">
                      {alerts.length === 0 ? (
                          <p className="text-center text-coffee-400 py-6 text-xs font-medium">Nessun prodotto sotto soglia.</p>
                      ) : (
                          <div className="space-y-2">
                              {alerts.map((alert, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-dark-surface rounded-2xl border border-red-50 dark:border-red-900/30 shadow-sm">
                                      <div className="min-w-0">
                                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-0.5">{alert.location}</p>
                                          <p className="text-xs text-coffee-900 dark:text-white font-bold truncate">{alert.prodName}</p>
                                      </div>
                                      <div className="text-right pl-3 border-l border-red-50 dark:border-red-900/30 ml-2">
                                          <p className="text-lg font-bold text-red-600 leading-none">{alert.current}</p>
                                          <p className="text-[9px] text-red-300 font-medium">Min: {alert.min}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {/* Fixed Costs Section */}
              <div>
                  <h2 className="text-sm font-bold text-coffee-800 dark:text-coffee-200 mb-3 flex items-center px-1">
                      <Briefcase size={16} className="mr-2 text-coffee-500" /> Gestione Spese Fisse
                  </h2>
                  <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-sm border border-coffee-50 dark:border-dark-border p-5">
                      <FixedCostsManager costs={fixedCosts} onAdd={onAddFixedCost} onDelete={onDeleteFixedCost} />
                  </div>
              </div>
          </div>
      </div>
      
      <InfoTooltip id="assets" title="Valore Assets" desc="Indica quanti soldi sono 'bloccati' in merce. È calcolato moltiplicando la quantità di ogni prodotto per il suo Costo Medio di Acquisto." />
      <InfoTooltip id="margin" title="Analisi Margini" desc="Il Potenziale Vendita è quanto incasseresti vendendo tutto. Il Margine Lordo è la differenza tra Vendita e Costo. Il ROI indica il ritorno sull'investimento in merce." />
    </div>
  );
};
