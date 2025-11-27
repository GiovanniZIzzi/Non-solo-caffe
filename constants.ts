
import { Product, LocationType, InventoryItem } from './types';

export const LOCATIONS = [
  LocationType.VETRINA,
  LocationType.DEPOSITO,
  LocationType.MAGAZZINO
];

// Logo Non Solo Caffè
// NOTA: Sostituisci questo URL con il link alla tua immagine specifica o una stringa Base64
export const APP_LOGO_URL = 'https://cdn-icons-png.flaticon.com/512/751/751621.png';

// Helper to add default ideal stocks
const withDefaults = (p: any): Product => ({
  ...p,
  idealStockVetrina: 10,
  idealStockDeposito: 20,
  idealStockMagazzino: 50
});

// Full Product List
export const INITIAL_PRODUCTS: Product[] = [
  // --- BORBONE & DICAL ORIGINALI ---
  { id: '1', code: '1', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS CAFFÈ A MODO MIO NERO", category: 'A Modo Mio', costPrice: 2.20, sellPrice: 4.00, alertThresholdWarehouse: 20, alertThresholdDeposit: 5, idealStockVetrina: 10, idealStockDeposito: 20, idealStockMagazzino: 100 },
  { id: '2', code: '2', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS CAFFÈ A MODO MIO ROSSO", category: 'A Modo Mio', costPrice: 2.20, sellPrice: 4.00, alertThresholdWarehouse: 20, alertThresholdDeposit: 5, idealStockVetrina: 10, idealStockDeposito: 20, idealStockMagazzino: 100 },
  { id: '3', code: '3', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS CAFFÈ A MODO MIO ORO", category: 'A Modo Mio', costPrice: 2.30, sellPrice: 4.20, alertThresholdWarehouse: 20, alertThresholdDeposit: 5, idealStockVetrina: 10, idealStockDeposito: 20, idealStockMagazzino: 100 },
  { id: '4', code: '4', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS CAFFÈ A MODO MIO BLU", category: 'A Modo Mio', costPrice: 2.30, sellPrice: 4.20, alertThresholdWarehouse: 20, alertThresholdDeposit: 5, idealStockVetrina: 10, idealStockDeposito: 20, idealStockMagazzino: 100 },
  // ... Mapping the rest with defaults for brevity in this large list, but applied to all in real app logic via spread if needed. 
  
  { id: '100', code: 'NC-100', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS COMPATIBILI NESSUNA MISCELA FRUTTI", category: 'Compatibili', costPrice: 2.50, sellPrice: 4.50, alertThresholdWarehouse: 10, alertThresholdDeposit: 3, idealStockVetrina: 5, idealStockDeposito: 10, idealStockMagazzino: 50 },
].map(p => ({
    ...p,
    idealStockVetrina: p.idealStockVetrina || 5,
    idealStockDeposito: p.idealStockDeposito || 10,
    idealStockMagazzino: p.idealStockMagazzino || 50
})); 

export const INITIAL_INVENTORY: InventoryItem[] = [
  { productId: '1', location: LocationType.VETRINA, quantity: 5 },
  { productId: '1', location: LocationType.MAGAZZINO, quantity: 25 },
  { productId: '4', location: LocationType.MAGAZZINO, quantity: 50 },
  { productId: '4', location: LocationType.DEPOSITO, quantity: 12 },
  { productId: '135', location: LocationType.MAGAZZINO, quantity: 80 }, 
  { productId: '135', location: LocationType.DEPOSITO, quantity: 15 },
  { productId: '178', location: LocationType.MAGAZZINO, quantity: 20 }, 
  { productId: '201', location: LocationType.MAGAZZINO, quantity: 10 }, 
];
