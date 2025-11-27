import React, { useState, useRef } from 'react';
import { X, Camera, ArrowRight, Check, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { geminiService } from '../services/geminiService';

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSubmit: (items: { productId: string; quantity: number }[]) => void;
}

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({ isOpen, onClose, products, onSubmit }) => {
  const [step, setStep] = useState<'UPLOAD' | 'PROCESSING' | 'REVIEW'>('UPLOAD');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<{ description: string; quantity: number; cost: number; matchedProductId: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processInvoice = async () => {
    if (!imagePreview) return;
    setStep('PROCESSING');

    try {
      const rawItems = await geminiService.parseInvoice(imagePreview);
      
      // Attempt auto-matching
      const matchedItems = rawItems.map((item: any) => {
        // Simple fuzzy match logic
        const search = item.description.toLowerCase();
        // Try to find a product where name or code is contained in the invoice description
        // OR the invoice description contains significant parts of the product name
        const match = products.find(p => {
             const pName = p.name.toLowerCase();
             return search.includes(pName) || pName.includes(search) || (p.code && search.includes(p.code.toLowerCase()));
        });

        return {
          description: item.description,
          quantity: item.quantity,
          cost: item.unitCost,
          matchedProductId: match ? match.id : ''
        };
      });

      setParsedItems(matchedItems);
      setStep('REVIEW');
    } catch (error) {
      alert("Errore durante l'analisi della fattura. Riprova con una foto più chiara.");
      setStep('UPLOAD');
    }
  };

  const handleConfirm = () => {
    const validItems = parsedItems
        .filter(i => i.matchedProductId && i.quantity > 0)
        .map(i => ({ productId: i.matchedProductId, quantity: i.quantity }));
    
    if (validItems.length === 0) {
        alert("Nessun prodotto valido abbinato. Seleziona i prodotti dal menu a tendina.");
        return;
    }
    
    onSubmit(validItems);
    onClose();
    setStep('UPLOAD');
    setImagePreview(null);
    setParsedItems([]);
  };

  const updateMatch = (index: number, productId: string) => {
      const newItems = [...parsedItems];
      newItems[index].matchedProductId = productId;
      setParsedItems(newItems);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-[#f9f5f3] w-full max-w-2xl h-[90vh] rounded-3xl shadow-2xl z-10 flex flex-col pointer-events-auto overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white p-4 border-b border-coffee-100 flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-coffee-900 flex items-center gap-2">
                <FileText className="text-coffee-600" /> Lettore Fattura AI
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={24} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            
            {step === 'UPLOAD' && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    {imagePreview ? (
                        <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                                onClick={() => setImagePreview(null)}
                                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full max-w-sm aspect-video border-4 border-dashed border-coffee-200 rounded-3xl flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-coffee-50 transition-colors"
                        >
                            <Camera size={48} className="text-coffee-300 mb-2" />
                            <p className="font-bold text-coffee-500">Scatta o Carica Foto Fattura</p>
                        </div>
                    )}
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                    />

                    {imagePreview && (
                        <button 
                            onClick={processInvoice}
                            className="w-full max-w-sm bg-coffee-800 text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center"
                        >
                            Analizza con AI <ArrowRight className="ml-2" />
                        </button>
                    )}
                </div>
            )}

            {step === 'PROCESSING' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Loader2 size={64} className="text-coffee-600 animate-spin mb-6" />
                    <h3 className="text-2xl font-bold text-coffee-900">Analisi in corso...</h3>
                    <p className="text-coffee-500 max-w-xs mt-2">L'intelligenza artificiale sta leggendo i prodotti e le quantità dalla tua foto.</p>
                </div>
            )}

            {step === 'REVIEW' && (
                <div className="flex-1">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-4 flex items-start gap-3">
                        <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                        <p className="text-xs text-yellow-800 font-medium">Controlla gli abbinamenti. L'AI potrebbe non riconoscere perfettamente tutti i nomi dei prodotti. Seleziona il prodotto corretto dal menu a tendina se manca.</p>
                    </div>

                    <div className="space-y-3 pb-20">
                        {parsedItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-coffee-50 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-bold text-coffee-400 uppercase">Rilevato in fattura</p>
                                        <p className="font-medium text-coffee-800 italic">"{item.description}"</p>
                                    </div>
                                    <div className="bg-coffee-100 text-coffee-800 px-3 py-1 rounded-lg font-bold">
                                        x{item.quantity}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <ArrowRight size={16} className="text-coffee-300 rotate-90 sm:rotate-0" />
                                    <select 
                                        className={`flex-1 p-2 rounded-xl text-sm font-bold border outline-none ${item.matchedProductId ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}
                                        value={item.matchedProductId}
                                        onChange={(e) => updateMatch(idx, e.target.value)}
                                    >
                                        <option value="">-- Seleziona Prodotto --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-coffee-50 flex justify-center z-20 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                         <div className="w-full max-w-2xl">
                             <button 
                                onClick={handleConfirm}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center active:scale-[0.98] transition-all"
                             >
                                 <Check className="mr-2" /> Conferma Carico Magazzino
                             </button>
                         </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};