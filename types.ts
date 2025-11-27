export enum LocationType {
  VETRINA = 'Vetrina',
  DEPOSITO = 'Deposito',
  MAGAZZINO = 'Magazzino'
}

export interface Product {
  id: string;
  code: string;
  name: string;
  supplier: string;
  category: string;
  costPrice: number; // This will be the Weighted Average Cost (WAC)
  sellPrice: number; 
  alertThresholdWarehouse: number; // Min threshold for alerts
  alertThresholdDeposit: number; // Min threshold for alerts
  
  // Target/Ideal Stock levels for Restocking Logic
  idealStockVetrina: number;
  idealStockDeposito: number;
  idealStockMagazzino: number;
}

export interface InventoryItem {
  productId: string;
  location: LocationType;
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT' | 'MOVE';
  productId: string;
  quantity: number;
  fromLocation?: LocationType;
  toLocation?: LocationType;
  note?: string;
  unitPrice?: number; // Specific cost for this batch (used for WAC calculation)
}

export type CostFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY' | 'ONE_OFF';

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  frequency: CostFrequency;
  category: string;
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: AppTheme;
  showNavbar: boolean;
  logoUrl?: string;
}

export interface DashboardMetrics {
  totalItems: number;
  totalCostValue: number;
  potentialRevenue: number;
  lowStockCount: number;
}