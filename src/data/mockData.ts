// Mock data for Kitchen Flow - Hebrew catering management

export interface WarehouseItem {
  id: string;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  unit: string;
  minStock: number;
  status: 'ok' | 'low' | 'critical';
}

export interface ReserveItem {
  id: string;
  name: string;
  type: 'frozen' | 'fresh';
  quantity: number;
  unit: string;
  ingredients: { itemId: string; amount: number }[];
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  ingredients: { name: string; amount: number; unit: string; source: 'warehouse' | 'reserve' }[];
  instructions: string[];
}

export interface Event {
  id: string;
  date: string;
  time: string;
  name: string;
  guests: number;
  items: { recipeId: string; quantity: number }[];
  status: 'pending' | 'in-progress' | 'completed';
}

// Empty data arrays
export const warehouseItems: WarehouseItem[] = [];
export const reserveItems: ReserveItem[] = [];
export const recipes: Recipe[] = [];
export const events: Event[] = [];

// Client info
export const clientInfo = {
  name: 'קסרולה',
  tagline: 'ניהול קייטרינג חכם',
  logo: '🍳',
  primaryColor: '#10B981',
};

export type ClientInfo = typeof clientInfo;
