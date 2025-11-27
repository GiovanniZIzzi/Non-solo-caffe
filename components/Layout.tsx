
import React from 'react';
import { BarChart3, Settings, Plus, ArrowRightLeft, PackageSearch, Coffee } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAction: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onOpenAction }) => {
  
  const NavItem = ({ id, icon: Icon, label, mobileOnly = false }: any) => (
    <button 
      onClick={() => onTabChange(id)}
      className={`
        flex items-center justify-center md:justify-start gap-3 p-3 rounded-2xl transition-all duration-300
        ${mobileOnly ? 'md:hidden flex-col md:flex-row' : 'flex-col md:flex-row'}
        ${activeTab === id 
          ? 'bg-white dark:bg-coffee-800 text-coffee-800 dark:text-white shadow-sm' 
          : 'text-coffee-400 dark:text-coffee-300 hover:text-coffee-600 hover:bg-white/50 dark:hover:bg-white/5'
        }
      `}
    >
      <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
      <span className={`${activeTab === id ? 'font-bold' : 'font-medium'} text-[10px] md:text-sm mt-1 md:mt-0`}>
        {label}
      </span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#f9f5f3] dark:bg-dark-bg text-coffee-900 dark:text-coffee-100 overflow-hidden font-sans transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white/60 dark:bg-dark-surface/60 backdrop-blur-xl border-r border-white/50 dark:border-white/5 p-6 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-coffee-800 text-white p-2 rounded-xl">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-none text-coffee-900 dark:text-white">NSC Manager</h1>
            <p className="text-xs text-coffee-500 dark:text-coffee-400 font-medium">Web Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem id="inventory" icon={PackageSearch} label="Inventario" />
          <NavItem id="movements" icon={ArrowRightLeft} label="Movimenti" />
          <NavItem id="dashboard" icon={BarChart3} label="Analisi Finanziaria" />
          <NavItem id="settings" icon={Settings} label="Impostazioni" />
        </nav>

        <button 
          onClick={onOpenAction}
          className="mt-auto flex items-center justify-center gap-2 w-full bg-coffee-800 hover:bg-coffee-900 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-coffee-900/20 transition-all active:scale-[0.98]"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Nuova Azione</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="max-w-7xl mx-auto w-full h-full pb-28 md:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile Floating Dock */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="glass-panel rounded-3xl shadow-glass px-2 py-3 flex justify-between items-center max-w-lg mx-auto relative">
          <div className="grid grid-cols-5 w-full items-center">
            <NavItem id="inventory" icon={PackageSearch} label="Inventario" />
            <NavItem id="movements" icon={ArrowRightLeft} label="Movimenti" />
            
            {/* Center Action Button (Mobile) */}
            <div className="relative -top-8 flex justify-center">
              <button 
                onClick={onOpenAction}
                className="bg-coffee-800 hover:bg-coffee-900 text-white rounded-full p-4 shadow-xl shadow-coffee-800/30 border-4 border-[#f9f5f3] dark:border-dark-bg transition-transform active:scale-95"
              >
                <Plus size={28} strokeWidth={3} />
              </button>
            </div>

            <NavItem id="dashboard" icon={BarChart3} label="Analisi" />
            <NavItem id="settings" icon={Settings} label="Impost." />
          </div>
        </div>
      </div>
    </div>
  );
};
