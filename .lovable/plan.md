

# Plan: Seed Database with Full Excel Data

## Summary
I've now fully parsed all 5 Excel files and extracted every data point. Ready to implement the approved plan.

## Files to Create/Modify

### 1. `src/data/seedData.ts` (~4500 lines, will be split into parts if needed)

Hardcoded data extracted verbatim:

- **20 suppliers** (unique non-empty): פפירוס, מייסטר, האחים כהן, רות פטיפורים, ריסטרטו, עידית וסביון, מרינה, תבניכל, אמ"ש פתרונות בע"מ, הוברמן, גד, אודי דגים, לולוס, תפוז טרי, פסטה ריקו, ספיר ספרינט מדבקות, עסק קופסאות בע"מ, מיכלי זהב, מאפיית רנין, פירספקט בע"מ
- **9 categories** with colors
- **~252 warehouse items** — every row from מחסן.xlsx
- **~98 recipes** from 3 files:
  - Patisserie (37): טראפלס, כדורי שוקולד, כדורי תמרים, בראוניז, קרם שקדים, קיש תרד, קיש פלפלים, קיש פיטריות, קיש בטטה, קיש ים תיכוני, טארטלט קיצי, טארטלט פיסטוק, טארטלט שוקולד, טארטלט תפוחים, שנטיי מסקרפונה, מסקרפונה בכוסות, טירמיסו, טארטלט לימון (tartlet + cups), קרם לימון, מלבי, מוס שוקולד, קראמבל קקאו, עוגת גזר, עוגת וניל-תפוז, עוגת דבש, פיננסייר שוקולד, עוגיות שוקולד צ'יפס, סהרוני שקדים, קנטוצ'יני, שלגיה, פרמז'ן, גרנולה, בצק רבוך, פחזניות מתוקות, טארטלט שחור (×2 variants)
  - Kitchen (47): לחמניות ביס, פרעצלס, בייגלס, קרוסטיני, מיקס כריכים, כריך מחמצת, כריך פוקאצ'ה, פחזניות מלוחות, מיני קרואסון, מיני טורטיות, לחמנייה ללא גלוטן, פסטו בזיליקום, טאפאנד זיתים, בטטה צלויה, מאפינס בטטה, רויאל לקיש, מילוי חצילים, פיטריות צלויות, סלט ביצים, סלט טונה, רוטב שמנת פסטו, רוטב רוזה, רוטב שמנת פיטריות, רוטב עגבניות לפסטה, סלט עגבניות, סלט קינואה, סלט ירוק, סלט יווני, סלט קיסר, סלט תאילנדי, סלט פסטה, אנטיפסטי, מגש ירקות, עלי גפן, רוטב יווני, רוטב לסלט ירוק, רוטב קיסר, רוטב תאילנדי, קרוטונים, מוזלי, מגש פירות, פסטה עגבניות, פסטה רוזה, פסטה פסטו, רביולי גבינות, מיני תפו"א ובטטה, שיפודי סלמון
  - Bakery (14): בצק לחמניות, לחם מחמצת, בצק פוקאצ'ה, פיצה ילדים, בצק בריוש כרוך, מיני קרואסון לכריכים, קראנץ (2 types), בריוש מלוח, בוקר צרפתי, בצק פריך מלוח, בצק שקדים, בצק עלים, מאפה עלים מלוח, אוזני פיל

- **~96 reserve items** from מלאי.xlsx page 3

### 2. `supabase/functions/seed-data/index.ts`
Edge function using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. Inserts in order: suppliers → categories → warehouse_items → recipes → recipe_ingredients → reserve_items. Matches FKs by name, NULL if no match.

### 3. `supabase/config.toml`
Add `[functions.seed-data]` with `verify_jwt = false`

### 4. `src/components/pages/SeedDataPage.tsx`
Temporary admin page with import button, progress display, and result summary.

### 5. `src/App.tsx`
Add temporary `/admin/seed` route.

## Post-Import
Remove seedData.ts, SeedDataPage.tsx, route, and edge function after successful import.

