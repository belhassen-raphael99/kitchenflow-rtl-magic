// Kitchen Ops Mock Data - Hebrew
// Data for the Kitchen Operations screen (Tablet view for chefs)

export type Department = 'bakery' | 'kitchen';

export interface StockProduction {
  id: string;
  name: string;
  nameHe: string;
  targetQuantity: number;
  unit: string;
  department: Department;
  status: 'pending' | 'in-progress' | 'completed';
  storageType: 'frozen' | 'refrigerated' | 'ambient';
  ingredients: { name: string; nameHe: string; amount: number; unit: string }[];
  instructions: string[];
  instructionsHe: string[];
  image?: string;
}

export interface OrderItem {
  recipeId: string;
  name: string;
  nameHe: string;
  quantity: number;
}

export interface AssemblyOrder {
  id: string;
  clientName: string;
  time: string;
  department: Department;
  status: 'pending' | 'in-progress' | 'completed';
  items: OrderItem[];
}

// Stock Production Data (Batching - Level 2)
export const stockProductions: StockProduction[] = [
  // Bakery Department
  {
    id: 'sp-1',
    name: 'Pretzel Dough',
    nameHe: 'בצק פרעצל',
    targetQuantity: 20,
    unit: 'kg',
    department: 'bakery',
    status: 'pending',
    storageType: 'frozen',
    ingredients: [
      { name: 'Flour', nameHe: 'קמח', amount: 10, unit: 'kg' },
      { name: 'Water', nameHe: 'מים', amount: 5, unit: 'L' },
      { name: 'Yeast', nameHe: 'שמרים', amount: 200, unit: 'g' },
      { name: 'Salt', nameHe: 'מלח', amount: 150, unit: 'g' },
      { name: 'Oil', nameHe: 'שמן', amount: 500, unit: 'ml' },
    ],
    instructions: [
      'Place water, flour, and yeast in mixer',
      'Mix on speed 1 for 5 minutes',
      'Add salt and oil',
      'Mix on speed 2 for 5 minutes',
      'Let rest for 30 minutes',
      'Divide into portions and freeze',
    ],
    instructionsHe: [
      'מניחים במיקסר מים, קמחים, שמרים',
      'ערבוב במהירות 1 למשך 5 דקות',
      'מוסיפים מלח ושמן',
      'ערבוב במהירות 2 למשך 5 דקות',
      'מניחים לתפוח 30 דקות',
      'מחלקים למנות ומקפיאים',
    ],
  },
  {
    id: 'sp-2',
    name: 'Bis Buns',
    nameHe: 'לחמניות ביס',
    targetQuantity: 100,
    unit: 'יחידות',
    department: 'bakery',
    status: 'pending',
    storageType: 'frozen',
    ingredients: [
      { name: 'White Flour', nameHe: 'קמח לבן', amount: 5, unit: 'kg' },
      { name: 'Butter', nameHe: 'חמאה', amount: 500, unit: 'g' },
      { name: 'Eggs', nameHe: 'ביצים', amount: 10, unit: 'יחידות' },
      { name: 'Sugar', nameHe: 'סוכר', amount: 200, unit: 'g' },
    ],
    instructions: [
      'Mix all dry ingredients',
      'Add eggs and butter',
      'Knead until smooth',
      'Shape into small buns',
      'Bake at 180°C for 15 minutes',
    ],
    instructionsHe: [
      'מערבבים את כל החומרים היבשים',
      'מוסיפים ביצים וחמאה',
      'לשים עד לקבלת בצק חלק',
      'מעצבים ללחמניות קטנות',
      'אופים ב-180 מעלות 15 דקות',
    ],
  },
  {
    id: 'sp-3',
    name: 'Croissant Dough',
    nameHe: 'בצק קרואסון',
    targetQuantity: 15,
    unit: 'kg',
    department: 'bakery',
    status: 'in-progress',
    storageType: 'frozen',
    ingredients: [
      { name: 'Flour', nameHe: 'קמח', amount: 8, unit: 'kg' },
      { name: 'Butter Block', nameHe: 'חמאה בלוק', amount: 4, unit: 'kg' },
      { name: 'Milk', nameHe: 'חלב', amount: 3, unit: 'L' },
    ],
    instructions: [
      'Prepare base dough',
      'Fold butter into dough (3 folds)',
      'Rest in refrigerator 2 hours between folds',
      'Roll and cut shapes',
    ],
    instructionsHe: [
      'מכינים בצק בסיס',
      'מקפלים חמאה לתוך הבצק (3 קיפולים)',
      'מניחים במקרר שעתיים בין קיפולים',
      'מרדדים וחותכים צורות',
    ],
  },
  // Kitchen Department
  {
    id: 'sp-4',
    name: 'Basil Pesto',
    nameHe: 'פסטו בזיליקום',
    targetQuantity: 5,
    unit: 'kg',
    department: 'kitchen',
    status: 'pending',
    storageType: 'refrigerated',
    ingredients: [
      { name: 'Fresh Basil', nameHe: 'בזיליקום טרי', amount: 300, unit: 'g' },
      { name: 'Pine Nuts', nameHe: 'צנוברים', amount: 200, unit: 'g' },
      { name: 'Parmesan', nameHe: 'פרמזן', amount: 250, unit: 'g' },
      { name: 'Olive Oil', nameHe: 'שמן זית', amount: 500, unit: 'ml' },
      { name: 'Garlic', nameHe: 'שום', amount: 50, unit: 'g' },
    ],
    instructions: [
      'Put everything in blender',
      'If dry, add more oil',
      'Blend until smooth',
      'Season to taste',
    ],
    instructionsHe: [
      'שמים הכל בבלנדר',
      'אם יבש, מוסיפים שמן',
      'טוחנים עד לקבלת מרקם חלק',
      'מתבלים לפי הטעם',
    ],
  },
  {
    id: 'sp-5',
    name: 'Tuna Salad',
    nameHe: 'סלט טונה',
    targetQuantity: 8,
    unit: 'kg',
    department: 'kitchen',
    status: 'pending',
    storageType: 'refrigerated',
    ingredients: [
      { name: 'Tuna Cans', nameHe: 'קופסאות טונה', amount: 20, unit: 'יחידות' },
      { name: 'Mayonnaise', nameHe: 'מיונז', amount: 1, unit: 'kg' },
      { name: 'Red Onion', nameHe: 'בצל סגול', amount: 300, unit: 'g' },
      { name: 'Lemon', nameHe: 'לימון', amount: 3, unit: 'יחידות' },
    ],
    instructions: [
      'Drain tuna well',
      'Chop onion finely',
      'Mix all ingredients',
      'Add lemon juice and season',
    ],
    instructionsHe: [
      'מסננים טונה היטב',
      'קוצצים בצל דק',
      'מערבבים את כל המרכיבים',
      'מוסיפים מיץ לימון ומתבלים',
    ],
  },
  {
    id: 'sp-6',
    name: 'Cream Cheese Spread',
    nameHe: 'ממרח גבינת שמנת',
    targetQuantity: 3,
    unit: 'kg',
    department: 'kitchen',
    status: 'completed',
    storageType: 'refrigerated',
    ingredients: [
      { name: 'Cream Cheese', nameHe: 'גבינת שמנת', amount: 2, unit: 'kg' },
      { name: 'Fresh Herbs', nameHe: 'עשבי תיבול', amount: 100, unit: 'g' },
      { name: 'Garlic', nameHe: 'שום', amount: 30, unit: 'g' },
    ],
    instructions: [
      'Soften cream cheese',
      'Chop herbs finely',
      'Mix everything together',
      'Refrigerate for 1 hour',
    ],
    instructionsHe: [
      'מרככים גבינת שמנת',
      'קוצצים עשבי תיבול דק',
      'מערבבים הכל יחד',
      'מקררים שעה',
    ],
  },
];

// Assembly Orders (Level 3 - Final products for clients)
export const assemblyOrders: AssemblyOrder[] = [
  {
    id: 'ao-1',
    clientName: 'חתונת כהן',
    time: '10:00',
    department: 'kitchen',
    status: 'pending',
    items: [
      { recipeId: 'r-1', name: 'Sandwich Mix', nameHe: 'מיקס כריכים', quantity: 50 },
      { recipeId: 'r-2', name: 'Salmon Crostini', nameHe: 'קרוסטיני סלמון', quantity: 20 },
      { recipeId: 'r-3', name: 'Caprese Skewers', nameHe: 'שיפודי קפרזה', quantity: 30 },
    ],
  },
  {
    id: 'ao-2',
    clientName: 'בר מצווה לוי',
    time: '12:00',
    department: 'kitchen',
    status: 'pending',
    items: [
      { recipeId: 'r-4', name: 'Mini Burgers', nameHe: 'מיני המבורגר', quantity: 80 },
      { recipeId: 'r-5', name: 'Hot Dogs', nameHe: 'נקניקיות', quantity: 60 },
    ],
  },
  {
    id: 'ao-3',
    clientName: 'ברית אברהם',
    time: '09:00',
    department: 'bakery',
    status: 'pending',
    items: [
      { recipeId: 'r-6', name: 'Croissant Platter', nameHe: 'מגש קרואסון', quantity: 3 },
      { recipeId: 'r-7', name: 'Pretzel Basket', nameHe: 'סלסלת פרעצלים', quantity: 2 },
    ],
  },
  {
    id: 'ao-4',
    clientName: 'אירוע חברת הייטק',
    time: '14:00',
    department: 'kitchen',
    status: 'in-progress',
    items: [
      { recipeId: 'r-8', name: 'Crostini Platter', nameHe: 'מגש קרוסטיני', quantity: 5 },
      { recipeId: 'r-9', name: 'Veggie Wraps', nameHe: 'ראפ ירקות', quantity: 40 },
    ],
  },
  {
    id: 'ao-5',
    clientName: 'יום הולדת שרה',
    time: '16:00',
    department: 'bakery',
    status: 'pending',
    items: [
      { recipeId: 'r-10', name: 'Birthday Cake', nameHe: 'עוגת יום הולדת', quantity: 1 },
      { recipeId: 'r-11', name: 'Cupcakes', nameHe: 'קאפקייקס', quantity: 24 },
    ],
  },
];

// Recipe instructions for assembly items
export const assemblyRecipes: Record<string, { instructionsHe: string[] }> = {
  'r-1': {
    instructionsHe: [
      'לפרוס לחם סנדוויץ׳',
      'למרוח גבינת שמנת',
      'להניח ירקות וגבינה',
      'לחתוך לחצאים',
    ],
  },
  'r-8': {
    instructionsHe: [
      'לפרוס בגט דק',
      'למרוח גבינת שמנת',
      'להוסיף סלמון / ירקות קלויים',
      'לקשט בעשבי תיבול',
    ],
  },
};
