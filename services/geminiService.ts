import { GoogleGenAI, Type } from "@google/genai";

// We don't initialize here to avoid errors if API key is missing on load
// Initialization happens inside functions

export const geminiService = {
  
  // Parse a natural language description or pasted list into a Product object
  parseProductInfo: async (text: string): Promise<any> => {
    if (!process.env.API_KEY) {
      throw new Error("API Key mancante");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

  // Suggest actions based on stock levels (Demo feature)
  analyzeStock: async (lowStockItems: string[]) => {
    if (!process.env.API_KEY || lowStockItems.length === 0) return "Nessun suggerimento.";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

  // Parse an image of an invoice
  parseInvoice: async (base64Image: string): Promise<any[]> => {
    if (!process.env.API_KEY) throw new Error("API Key mancante");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Strip header if present to get pure base64
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: "Analizza questa fattura/bolla. Estrai una lista di prodotti. Per ogni riga restituisci: 'description' (nome prodotto sulla fattura), 'quantity' (numero pezzi, converti in numero intero), 'unitCost' (prezzo unitario se visibile, altrimenti 0). Ignora totali, iva e intestazioni. Restituisci solo JSON Array." }
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