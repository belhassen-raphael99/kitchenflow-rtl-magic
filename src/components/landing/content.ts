import {
  Boxes,
  Calendar,
  ChefHat,
  ClipboardList,
  Package,
  Truck,
  type LucideIcon,
} from 'lucide-react';

import screenAgenda from '@/assets/landing/screen-agenda.jpg';
import screenChef from '@/assets/landing/screen-chef.jpg';
import screenRecipes from '@/assets/landing/screen-recipes.jpg';
import screenWarehouse from '@/assets/landing/screen-warehouse.jpg';

export interface LandingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface LandingScreen {
  title: string;
  eyebrow: string;
  description: string;
  src: string;
  alt: string;
}

export const landingFeatures: LandingFeature[] = [
  {
    icon: Calendar,
    title: 'תכנון אירועים והפקות',
    description: 'יומן מרכזי לכל לקוח, שעת יציאה, צוות, ציוד, לוגיסטיקה והערות שירות במקום אחד.',
  },
  {
    icon: ClipboardList,
    title: 'לוח מטבח חי',
    description: 'משימות הכנה ברורות לפי מחלקה, סדר עדיפויות ומצב ביצוע — כדי שהמטבח יזוז בקצב הנכון.',
  },
  {
    icon: Boxes,
    title: 'מלאי ורכש',
    description: 'חוסרים, תוקפים, כמויות ונקודות קריטיות עם רשימות קנייה שנבנות לפי הפעילות בפועל.',
  },
  {
    icon: ChefHat,
    title: 'מתכונים ותפריטים',
    description: 'עלויות, כמויות, רגישויות וסטנדרט עבודה לכל מגש, מנה או מתכון שמרכיב את ההפקה.',
  },
  {
    icon: Package,
    title: 'רזרבות וייצור',
    description: 'שליטה על מה מיוצר מראש, מה יוצא להקפאה ומה זמין לשירות — בלי ניחושים ובלי כפילויות.',
  },
  {
    icon: Truck,
    title: 'משלוחים ושירות',
    description: 'כתובות, חלונות אספקה, תעודות וסטטוס ביום האירוע כדי שכל יציאה תהיה מתוזמנת היטב.',
  },
];

export const landingScreens: LandingScreen[] = [
  {
    title: 'יומן הפקות שמחזיק את כל השבוע',
    eyebrow: 'אירועים',
    description: 'כל אירוע, כל לקוח, כל שעה וכל עדכון שירות במקום אחד — כדי שהצוות יודע מה קורה בלי טלפונים מיותרים.',
    src: screenAgenda,
    alt: 'מסך יומן אירועים והפקות במערכת קסרולה',
  },
  {
    title: 'לוח שף שמחבר בין תכנון לביצוע',
    eyebrow: 'מטבח',
    description: 'רואים מיד מה צריך להכין היום, למי זה שייך, ומה כבר בוצע — עם סדר שמותאם לעבודה אמיתית במטבח.',
    src: screenChef,
    alt: 'מסך לוח שף וניהול משימות מטבח במערכת קסרולה',
  },
  {
    title: 'מלאי ורכש בלי קבצים מפוזרים',
    eyebrow: 'מחסן',
    description: 'שליטה ברמות מלאי, חוסרים, פריטים קריטיים ורכש צפוי כדי לא להיתקע לפני יציאה לאירוע.',
    src: screenWarehouse,
    alt: 'מסך ניהול מחסן ומלאי במערכת קסרולה',
  },
  {
    title: 'מתכונים ועלויות עם סטנדרט קבוע',
    eyebrow: 'תפריטים',
    description: 'כל רכיב, כל כמות וכל תמחור זמינים לצוות — כדי לשמור על אחידות גם כשההפקות גדלות.',
    src: screenRecipes,
    alt: 'מסך מתכונים ועלויות במערכת קסרולה',
  },
];