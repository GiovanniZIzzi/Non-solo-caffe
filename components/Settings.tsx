import React, { useRef } from 'react';
import { AppSettings, AppTheme } from '../types';
import { Moon, Sun, Smartphone, Layout, Trash2, Upload, Image, RefreshCw } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onReset: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const themes: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
      { id: 'light', label: 'Chiaro', icon: <Sun size={18} /> },
      { id: 'dark', label: 'Scuro', icon: <Moon size={18} /> },
      { id: 'system', label: 'Sistema', icon: <Smartphone size={18} /> },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("L'immagine è troppo grande. Usa un file inferiore a 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // Save the Base64 string to settings
        onUpdate({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    onUpdate({ ...settings, logoUrl: APP_LOGO_URL });
  };

  return (
    <div className="p-4 pt-10 pb-32">
      <h1 className="text-2xl font-extrabold text-coffee-900 dark:text-white mb-6">Impostazioni</h1>
      
      <div className="space-y-6">
          {/* Customization */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-sm border border-coffee-50 dark:border-dark-border">
              <h3 className="text-sm font-bold text-coffee-600 dark:text-coffee-400 uppercase tracking-wider mb-4">Personalizzazione Azienda</h3>
              
              <div className="flex items-center gap-4 mb-6">
                  {/* Fixed size container, flexible content */}
                  <div className="h-24 w-24 bg-gray-50 dark:bg-coffee-800/50 rounded-2xl flex items-center justify-center overflow-hidden border border-coffee-100 dark:border-coffee-700 shadow-sm shrink-0 p-2">
                      {settings.logoUrl ? (
                          <img 
                            src={settings.logoUrl} 
                            alt="Logo" 
                            className="w-full h-full object-contain" 
                          />
                      ) : (
                          <Image className="text-coffee-300" size={32} />
                      )}
                  </div>
                  <div className="flex-1 space-y-2">
                      <input 
                          type="file" 
                          accept="image/*" 
                          ref={fileInputRef} 
                          className="hidden" 
                          onChange={handleLogoUpload}
                      />
                      <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                      >
                          <Upload size={16} /> Carica Logo
                      </button>
                      <button 
                          onClick={handleResetLogo}
                          className="w-full py-2.5 px-4 bg-gray-50 dark:bg-coffee-800 text-coffee-600 dark:text-coffee-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                      >
                          <RefreshCw size={16} /> Ripristina Default
                      </button>
                  </div>
              </div>
              <p className="text-[10px] text-coffee-400 leading-tight">
                  Il logo verrà adattato automaticamente all'intestazione dell'app. Usa un'immagine PNG trasparente per il miglior risultato estetico.
              </p>
          </div>

          {/* Appearance */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-sm border border-coffee-50 dark:border-dark-border">
              <h3 className="text-sm font-bold text-coffee-600 dark:text-coffee-400 uppercase tracking-wider mb-4">Aspetto</h3>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                  {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => onUpdate({ ...settings, theme: t.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${settings.theme === t.id ? 'bg-coffee-800 text-white border-coffee-800' : 'bg-gray-50 dark:bg-coffee-800/30 border-transparent text-coffee-600 dark:text-coffee-400 hover:bg-gray-100'}`}
                      >
                          <div className="mb-2">{t.icon}</div>
                          <span className="text-xs font-bold">{t.label}</span>
                      </button>
                  ))}
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-coffee-800/30 rounded-2xl">
                  <div className="flex items-center gap-3">
                      <Layout className="text-coffee-500" size={20} />
                      <span className="text-sm font-bold text-coffee-900 dark:text-white">Mostra Barra Navigazione</span>
                  </div>
                  <div 
                    onClick={() => onUpdate({ ...settings, showNavbar: !settings.showNavbar })}
                    className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${settings.showNavbar ? 'bg-coffee-600' : 'bg-gray-300'}`}
                  >
                      <div className={`bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${settings.showNavbar ? 'translate-x-5' : ''}`}></div>
                  </div>
              </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-sm border border-coffee-50 dark:border-dark-border">
            <p className="text-sm font-bold text-red-500 mb-4 uppercase tracking-wider">Zona Pericolo</p>
            <button 
                onClick={() => { if(confirm('Cancellare tutto e ripristinare i dati iniziali?')) onReset(); }}
                className="w-full flex items-center justify-center p-4 text-red-600 border border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-900 rounded-2xl font-bold active:scale-95 transition-transform"
            >
                <Trash2 size={20} className="mr-2"/> Reset Dati di Fabbrica
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">Versione 2.3.1 (Github Ready)</p>
          </div>
      </div>
    </div>
  );
};