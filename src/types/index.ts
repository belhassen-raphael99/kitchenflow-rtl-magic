// Types centralisés pour l'application Casserole

// Client Info - Configuration statique
export interface ClientInfo {
  name: string;
  tagline: string;
  logo: string;
  primaryColor: string;
}

export const clientInfo: ClientInfo = {
  name: 'קסרולה',
  tagline: 'ניהול קייטרינג חכם',
  logo: '🍳',
  primaryColor: '#10B981',
};

// Types pour Kitchen Ops (seront remplacés par DB plus tard)
export type Department = 'bakery' | 'kitchen';
export type StorageType = 'frozen' | 'refrigerated' | 'ambient';
export type ProductionStatus = 'pending' | 'in-progress' | 'completed';

export interface StockProductionIngredient {
  name: string;
  nameHe: string;
  amount: number;
  unit: string;
}

export interface StockProduction {
  id: string;
  name: string;
  nameHe: string;
  department: Department;
  targetQuantity: number;
  unit: string;
  storageType: StorageType;
  status: ProductionStatus;
  ingredients: StockProductionIngredient[];
  instructionsHe: string[];
}

export interface OrderItem {
  id: string;
  name: string;
  nameHe: string;
  quantity: number;
  unit: string;
  status: ProductionStatus;
}

export interface AssemblyOrder {
  id: string;
  clientName: string;
  time: string;
  department: Department;
  items: OrderItem[];
  status: ProductionStatus;
}

// Types pour les événements (à connecter à DB)
export interface Event {
  id: string;
  date: string;
  time: string;
  name: string;
  guests: number;
  items: { recipeId: string; quantity: number }[];
  status: 'pending' | 'in-progress' | 'completed';
}

// Types pour les recettes (à connecter à DB)
export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  source: 'warehouse' | 'reserve';
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
}

// Types pour la réserve (à connecter à DB)
export interface ReserveIngredient {
  itemId: string;
  amount: number;
}

export interface ReserveItem {
  id: string;
  name: string;
  type: 'frozen' | 'fresh';
  quantity: number;
  unit: string;
  ingredients: ReserveIngredient[];
}
