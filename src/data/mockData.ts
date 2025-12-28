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

// Warehouse (Makhsan) - Raw materials
export const warehouseItems: WarehouseItem[] = [
  { id: 'w1', name: 'קמח פיצה', category: 'יבשים', supplier: 'ריסטרטו', quantity: 50, unit: 'ק"ג', minStock: 10, status: 'ok' },
  { id: 'w2', name: 'ביצים', category: 'מקרר', supplier: 'יוני ביצים', quantity: 120, unit: 'יח', minStock: 50, status: 'ok' },
  { id: 'w3', name: 'סלמון מעושן', category: 'דגים', supplier: 'נטו', quantity: 2, unit: 'ק"ג', minStock: 5, status: 'low' },
  { id: 'w4', name: 'בזיליקום', category: 'ירקות', supplier: 'פוליבה', quantity: 10, unit: 'צרור', minStock: 5, status: 'ok' },
  { id: 'w5', name: 'שמן זית', category: 'יבשים', supplier: 'אחים כהן', quantity: 5, unit: 'ליטר', minStock: 3, status: 'ok' },
  { id: 'w6', name: 'גבינת שמנת', category: 'גבינות', supplier: 'גד', quantity: 6, unit: 'ק"ג', minStock: 4, status: 'ok' },
  { id: 'w7', name: 'בגט', category: 'לחמים', supplier: 'מאפיית לחם', quantity: 15, unit: 'יח', minStock: 10, status: 'ok' },
  { id: 'w8', name: 'בטטה', category: 'ירקות', supplier: 'פוליבה', quantity: 8, unit: 'ק"ג', minStock: 5, status: 'ok' },
];

// Reserve (Mlai) - Prepared bases
export const reserveItems: ReserveItem[] = [
  { 
    id: 'r1', 
    name: 'בצק פרעצל', 
    type: 'frozen', 
    quantity: 15, 
    unit: 'ק"ג',
    ingredients: [{ itemId: 'w1', amount: 2 }]
  },
  { 
    id: 'r2', 
    name: 'פסטו בזיליקום', 
    type: 'fresh', 
    quantity: 2, 
    unit: 'ק"ג',
    ingredients: [{ itemId: 'w4', amount: 2 }, { itemId: 'w5', amount: 0.5 }]
  },
  { 
    id: 'r3', 
    name: 'קיש בטטה', 
    type: 'frozen', 
    quantity: 10, 
    unit: 'יח',
    ingredients: [{ itemId: 'w8', amount: 1 }, { itemId: 'w2', amount: 3 }]
  },
];

// Recipes
export const recipes: Recipe[] = [
  {
    id: 'rec1',
    name: 'מגש מיקס כריכים',
    category: 'מגשי אירוח',
    price: 180,
    ingredients: [
      { name: 'בגט', amount: 0.3, unit: 'ק"ג', source: 'warehouse' },
      { name: 'גבינת שמנת', amount: 0.2, unit: 'ק"ג', source: 'warehouse' },
      { name: 'סלמון מעושן', amount: 0.2, unit: 'ק"ג', source: 'warehouse' },
    ],
    instructions: [
      'לפרוס בגט פרוסות דקות',
      'למרוח גבינת שמנת',
      'להניח סלמון מעושן מגולגל',
      'לקשט בעירית',
    ],
  },
  {
    id: 'rec2',
    name: 'מגש קרוסטיני סלמון',
    category: 'מגשי אירוח',
    price: 220,
    ingredients: [
      { name: 'בגט', amount: 0.3, unit: 'ק"ג', source: 'warehouse' },
      { name: 'גבינת שמנת', amount: 0.2, unit: 'ק"ג', source: 'warehouse' },
      { name: 'סלמון מעושן', amount: 0.2, unit: 'ק"ג', source: 'warehouse' },
    ],
    instructions: [
      'לפרוס בגט פרוסות דקות',
      'למרוח גבינת שמנת',
      'להניח סלמון מעושן מגולגל',
      'לקשט בעירית',
    ],
  },
  {
    id: 'rec3',
    name: 'קיש בטטה וגבינות',
    category: 'קישים',
    price: 85,
    ingredients: [
      { name: 'בצק פרעצל', amount: 0.3, unit: 'ק"ג', source: 'reserve' },
      { name: 'בטטה', amount: 0.5, unit: 'ק"ג', source: 'warehouse' },
      { name: 'ביצים', amount: 4, unit: 'יח', source: 'warehouse' },
    ],
    instructions: [
      'לרדד את הבצק בתבנית',
      'לקלף ולפרוס בטטה דק',
      'להכין תערובת ביצים',
      'לאפות 180 מעלות 45 דקות',
    ],
  },
  {
    id: 'rec4',
    name: 'פסטה פסטו ירוק',
    category: 'מנות עיקריות',
    price: 65,
    ingredients: [
      { name: 'פסטו בזיליקום', amount: 0.15, unit: 'ק"ג', source: 'reserve' },
      { name: 'פסטה', amount: 0.25, unit: 'ק"ג', source: 'warehouse' },
    ],
    instructions: [
      'לבשל פסטה אל דנטה',
      'לערבב עם פסטו',
      'להגיש מיד',
    ],
  },
];

// Events/Orders
export const events: Event[] = [
  {
    id: 'e1',
    date: '2026-01-01',
    time: '10:00',
    name: 'חברת הייטק - הרמת כוסית',
    guests: 50,
    items: [
      { recipeId: 'rec1', quantity: 5 },
      { recipeId: 'rec2', quantity: 3 },
    ],
    status: 'pending',
  },
  {
    id: 'e2',
    date: '2026-01-01',
    time: '13:00',
    name: 'ברית משפחת כהן',
    guests: 30,
    items: [
      { recipeId: 'rec1', quantity: 2 },
    ],
    status: 'pending',
  },
  {
    id: 'e3',
    date: '2026-01-02',
    time: '12:00',
    name: 'יום הולדת 50 - משפחת לוי',
    guests: 80,
    items: [
      { recipeId: 'rec2', quantity: 4 },
      { recipeId: 'rec3', quantity: 6 },
    ],
    status: 'pending',
  },
  {
    id: 'e4',
    date: '2026-01-03',
    time: '18:00',
    name: 'אירוע חברה - גוגל',
    guests: 120,
    items: [
      { recipeId: 'rec1', quantity: 8 },
      { recipeId: 'rec4', quantity: 40 },
    ],
    status: 'pending',
  },
];

// Client info
export const clientInfo = {
  name: 'קסרולה',
  tagline: 'ניהול קייטרינג חכם',
  logo: '🍳',
};
