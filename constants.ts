import { Product, LocationType, InventoryItem } from './types';

export const LOCATIONS = [
  LocationType.VETRINA,
  LocationType.DEPOSITO,
  LocationType.MAGAZZINO
];

export const APP_LOGO_URL = 'https://cdn-icons-png.flaticon.com/512/751/751621.png';

// Usiamo 'any' per l'array iniziale per evitare errori TypeScript durante la build
// se mancano dei campi opzionali prima del map
const rawProducts: any[] = [
  { id: '1', code: '1', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS CAFFÈ A MODO MIO NERO", category: 'A Modo Mio', costPrice: 2.20, sellPrice: 4.00, alertThresholdWarehouse: 20, alertThresholdDeposit: 5 },
  { id: '2', code: '2', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS CAFFÈ A MODO MIO ROSSO", category: 'A Modo Mio', costPrice: 2.20, sellPrice: 4.00, alertThresholdWarehouse: 20, alertThresholdDeposit: 5 },
  { id: '3', code: '3', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS CAFFÈ A MODO MIO ORO", category: 'A Modo Mio', costPrice: 2.30, sellPrice: 4.20, alertThresholdWarehouse: 20, alertThresholdDeposit: 5 },
  { id: '4', code: '4', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS CAFFÈ A MODO MIO BLU", category: 'A Modo Mio', costPrice: 2.30, sellPrice: 4.20, alertThresholdWarehouse: 20, alertThresholdDeposit: 5 },
  { id: '100', code: 'NC-100', supplier: 'CAFFÈ BORBONE SRL', name: "BOX 10 CAPS COMPATIBILI NESSUNA MISCELA FRUTTI", category: 'Compatibili', costPrice: 2.50, sellPrice: 4.50, alertThresholdWarehouse: 10, alertThresholdDeposit: 3 }
];

export const INITIAL_PRODUCTS: Product[] = rawProducts.map(p => ({
    ...p,
    idealStockVetrina: p.idealStockVetrina || 5,
    idealStockDeposito: p.idealStockDeposito || 10,
    idealStockMagazzino: p.idealStockMagazzino || 50
})) as Product[];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { productId: '1', location: LocationType.VETRINA, quantity: 5 },
  { productId: '1', location: LocationType.MAGAZZINO, quantity: 25 },
  { productId: '4', location: LocationType.MAGAZZINO, quantity: 50 },
  { productId: '4', location: LocationType.DEPOSITO, quantity: 12 },
];
