// Mock data for PizzaKing - Pizza restaurant chain
import { WarehouseItem, ReserveItem, Recipe, Event } from './mockData';

// Warehouse (Makhsan) - Raw materials for PizzaKing
export const pizzakingWarehouse: WarehouseItem[] = [
  { id: 'pw1', name: 'קמח 00', category: 'יבשים', supplier: 'מילס', quantity: 80, unit: 'ק"ג', minStock: 20, status: 'ok' },
  { id: 'pw2', name: 'רוטב עגבניות', category: 'רטבים', supplier: 'מותג הבית', quantity: 30, unit: 'ליטר', minStock: 10, status: 'ok' },
  { id: 'pw3', name: 'מוצרלה', category: 'גבינות', supplier: 'תנובה', quantity: 5, unit: 'ק"ג', minStock: 10, status: 'low' },
  { id: 'pw4', name: 'זיתים שחורים', category: 'תוספות', supplier: 'יד מרדכי', quantity: 8, unit: 'ק"ג', minStock: 3, status: 'ok' },
  { id: 'pw5', name: 'פטריות', category: 'ירקות', supplier: 'פוליבה', quantity: 3, unit: 'ק"ג', minStock: 5, status: 'low' },
  { id: 'pw6', name: 'פפרוני', category: 'בשרי', supplier: 'עוף הכרמל', quantity: 10, unit: 'ק"ג', minStock: 5, status: 'ok' },
  { id: 'pw7', name: 'בצל', category: 'ירקות', supplier: 'פוליבה', quantity: 15, unit: 'ק"ג', minStock: 5, status: 'ok' },
  { id: 'pw8', name: 'אורגנו', category: 'תבלינים', supplier: 'פרג', quantity: 2, unit: 'ק"ג', minStock: 1, status: 'ok' },
];

// Reserve (Mlai) - Prepared bases for PizzaKing
export const pizzakingReserve: ReserveItem[] = [
  { 
    id: 'pr1', 
    name: 'בצק פיצה דק', 
    type: 'fresh', 
    quantity: 25, 
    unit: 'יח',
    ingredients: [{ itemId: 'pw1', amount: 0.3 }]
  },
  { 
    id: 'pr2', 
    name: 'בצק פיצה עבה', 
    type: 'fresh', 
    quantity: 15, 
    unit: 'יח',
    ingredients: [{ itemId: 'pw1', amount: 0.5 }]
  },
  { 
    id: 'pr3', 
    name: 'רוטב פיצה מוכן', 
    type: 'fresh', 
    quantity: 8, 
    unit: 'ליטר',
    ingredients: [{ itemId: 'pw2', amount: 1 }, { itemId: 'pw8', amount: 0.05 }]
  },
];

// Recipes for PizzaKing
export const pizzakingRecipes: Recipe[] = [
  {
    id: 'prec1',
    name: 'פיצה מרגריטה',
    category: 'פיצות קלאסיות',
    price: 55,
    ingredients: [
      { name: 'בצק פיצה דק', amount: 1, unit: 'יח', source: 'reserve' },
      { name: 'רוטב פיצה מוכן', amount: 0.15, unit: 'ליטר', source: 'reserve' },
      { name: 'מוצרלה', amount: 0.2, unit: 'ק"ג', source: 'warehouse' },
    ],
    instructions: [
      'לרדד את הבצק לעיגול',
      'למרוח רוטב עגבניות',
      'לפזר מוצרלה מגורדת',
      'לאפות ב-280 מעלות 8 דקות',
    ],
  },
  {
    id: 'prec2',
    name: 'פיצה פפרוני',
    category: 'פיצות קלאסיות',
    price: 65,
    ingredients: [
      { name: 'בצק פיצה דק', amount: 1, unit: 'יח', source: 'reserve' },
      { name: 'רוטב פיצה מוכן', amount: 0.15, unit: 'ליטר', source: 'reserve' },
      { name: 'מוצרלה', amount: 0.2, unit: 'ק"ג', source: 'warehouse' },
      { name: 'פפרוני', amount: 0.1, unit: 'ק"ג', source: 'warehouse' },
    ],
    instructions: [
      'לרדד את הבצק לעיגול',
      'למרוח רוטב עגבניות',
      'לפזר מוצרלה מגורדת',
      'להניח פרוסות פפרוני',
      'לאפות ב-280 מעלות 8 דקות',
    ],
  },
  {
    id: 'prec3',
    name: 'פיצה ירקות',
    category: 'פיצות צמחוניות',
    price: 60,
    ingredients: [
      { name: 'בצק פיצה עבה', amount: 1, unit: 'יח', source: 'reserve' },
      { name: 'רוטב פיצה מוכן', amount: 0.2, unit: 'ליטר', source: 'reserve' },
      { name: 'מוצרלה', amount: 0.15, unit: 'ק"ג', source: 'warehouse' },
      { name: 'פטריות', amount: 0.1, unit: 'ק"ג', source: 'warehouse' },
      { name: 'בצל', amount: 0.05, unit: 'ק"ג', source: 'warehouse' },
      { name: 'זיתים שחורים', amount: 0.05, unit: 'ק"ג', source: 'warehouse' },
    ],
    instructions: [
      'לרדד את הבצק לעיגול עבה',
      'למרוח רוטב עגבניות בנדיבות',
      'לפזר מוצרלה',
      'לסדר פטריות חתוכות, טבעות בצל וזיתים',
      'לאפות ב-260 מעלות 12 דקות',
    ],
  },
  {
    id: 'prec4',
    name: 'קלצונה גבינות',
    category: 'מאפים',
    price: 45,
    ingredients: [
      { name: 'בצק פיצה דק', amount: 1, unit: 'יח', source: 'reserve' },
      { name: 'מוצרלה', amount: 0.25, unit: 'ק"ג', source: 'warehouse' },
      { name: 'רוטב פיצה מוכן', amount: 0.1, unit: 'ליטר', source: 'reserve' },
    ],
    instructions: [
      'לרדד בצק לעיגול',
      'להניח מילוי גבינה בחצי',
      'לקפל ולסגור שוליים',
      'לאפות ב-250 מעלות 15 דקות',
    ],
  },
];

// Events for PizzaKing
export const pizzakingEvents: Event[] = [
  {
    id: 'pe1',
    date: '2026-01-01',
    time: '12:00',
    name: 'הזמנה קבוצתית - משרד גוגל',
    guests: 25,
    items: [
      { recipeId: 'prec1', quantity: 10 },
      { recipeId: 'prec2', quantity: 8 },
      { recipeId: 'prec3', quantity: 7 },
    ],
    status: 'pending',
  },
  {
    id: 'pe2',
    date: '2026-01-01',
    time: '18:00',
    name: 'מסיבת יום הולדת - משפחת אברהם',
    guests: 15,
    items: [
      { recipeId: 'prec2', quantity: 5 },
      { recipeId: 'prec4', quantity: 10 },
    ],
    status: 'pending',
  },
  {
    id: 'pe3',
    date: '2026-01-02',
    time: '19:30',
    name: 'אירוע סיום שנה - בית ספר',
    guests: 60,
    items: [
      { recipeId: 'prec1', quantity: 15 },
      { recipeId: 'prec3', quantity: 15 },
    ],
    status: 'pending',
  },
];

// Client info for PizzaKing
export const pizzakingClientInfo = {
  name: 'פיצה קינג',
  tagline: 'המלך של הפיצות',
  logo: '🍕',
  primaryColor: '#EF4444', // Red
};
