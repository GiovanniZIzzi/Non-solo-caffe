import { GoogleGenAI, Type } from "@google/genai";

// Safe access to env vars
const API_KEY = import.meta.env.VITE_API_KEY || (window as any).API_KEY || '';

export const geminiService = {
  
  parseProductInfo: async (text: string): Promise<any> => {
    if (!API_KEY) {
      console.warn("API Key mancante per Gemini");
      throw new Error("Funzionalità AI non disponibile: API Key mancante");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Estrai le informazioni del prodotto da questo testo. Se mancano info, stima in base al contesto del caffè (Borbone, Lollo, etc). Il testo è: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              supplier: { type: Type.STRING },
              code: { type: Type.STRING },
              category: { type: Type.STRING },
              estimatedCost: { type: Type.NUMBER },
              estimatedSell: { type: Type.NUMBER },
            },
            required: ["name", "supplier", "category"]
          }
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini parse error:", error);
      throw error;
    }
  },

  analyzeStock: async (lowStockItems: string[]) => {
    if (!API_KEY || lowStockItems.length === 0) return "Nessun suggerimento (AI offline).";

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
       const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Sono un assistente di magazzino per un negozio di caffè. I seguenti articoli sono in esaurimento: ${lowStockItems.join(', ')}. Dammi un consiglio breve e conciso (massimo 2 frasi) su cosa ordinare o controllare.`,
      });
      return response.text;
    } catch (e) {
      return "Impossibile generare suggerimenti.";
    }
  },

  parseInvoice: async (base64Image: string): Promise<any[]> => {
    if (!API_KEY) throw new Error("API Key mancante");

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: "Analizza questa fattura. Estrai prodotti: 'description', 'quantity', 'unitCost'. JSON Array." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unitCost: { type: Type.NUMBER }
                        },
                        required: ["description", "quantity"]
                    }
                }
            }
        });

        return JSON.parse(response.text || '[]');
    } catch (error) {
        console.error("Invoice parsing error:", error);
        throw error;
    }
  }
};
};
