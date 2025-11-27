import { Product, InventoryItem, Transaction, FixedCost, AppSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_INVENTORY, APP_LOGO_URL } from '../constants';

const KEYS = {
  PRODUCTS: 'nsc_products',
  INVENTORY: 'nsc_inventory',
  TRANSACTIONS: 'nsc_transactions',
  FIXED_COSTS: 'nsc_fixed_costs',
  SETTINGS: 'nsc_settings'
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  showNavbar: true,
  logoUrl: APP_LOGO_URL
};

// Helper to safely parse JSON
const safeParse = (json: string | null, fallback: any) => {
    if (!json) return fallback;
    try {
        return JSON.parse(json);
    } catch (e) {
        console.error("Storage parse error", e);
        return fallback;
    }
};

export const storageService = {
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(KEYS.PRODUCTS);
    let products: Product[] = [];
    
    if (!stored) {
      products = INITIAL_PRODUCTS;
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    } else {
      products = safeParse(stored, INITIAL_PRODUCTS);
      // Merge new initial products if they don't exist in stored data
      let added = false;
      INITIAL_PRODUCTS.forEach(initProd => {
          if (!products.some(p => p.id === initProd.id)) {
              products.push(initProd);
              added = true;
          }
      });
      if (added) {
          localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
      }
    }
    return products;
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  getInventory: (): InventoryItem[] => {
    const stored = localStorage.getItem(KEYS.INVENTORY);
    if (!stored) {
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      return INITIAL_INVENTORY;
    }
    return safeParse(stored, INITIAL_INVENTORY);
  },

  saveInventory: (inventory: InventoryItem[]) => {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  },

  getTransactions: (): Transaction[] => {
    const stored = localStorage.getItem(KEYS.TRANSACTIONS);
    return safeParse(stored, []);
  },

  addTransaction: (transaction: Transaction) => {
    const transactions = storageService.getTransactions();
    transactions.unshift(transaction); // Newest first
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getFixedCosts: (): FixedCost[] => {
    const stored = localStorage.getItem(KEYS.FIXED_COSTS);
    return safeParse(stored, []);
  },

  saveFixedCosts: (costs: FixedCost[]) => {
    localStorage.setItem(KEYS.FIXED_COSTS, JSON.stringify(costs));
  },

  getSettings: (): AppSettings => {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    const parsed = safeParse(stored, DEFAULT_SETTINGS);
    // Merge to ensure all keys exist (like logoUrl)
    return { ...DEFAULT_SETTINGS, ...parsed };
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
  
  clearData: () => {
      localStorage.clear();
      window.location.reload();
  }
};