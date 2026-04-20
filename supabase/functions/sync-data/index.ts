import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  const allowedHosts = ['.lovable.app', '.lovableproject.com', '.vercel.app'];
  if (allowedHosts.some((h) => origin.endsWith(h))) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Get all recipes
    const { data: recipes } = await supabase.from("recipes").select("id, name");
    const recipeMap: Record<string, string> = {};
    for (const r of recipes || []) recipeMap[r.name] = r.id;

    // Get all warehouse items
    const { data: whItems } = await supabase.from("warehouse_items").select("id, name");
    const whMap: Record<string, string> = {};
    for (const w of whItems || []) whMap[w.name] = w.id;

    // Helper: find warehouse item by fuzzy match
    function findWarehouseId(ingName: string): string | null {
      // Exact match
      for (const [whName, whId] of Object.entries(whMap)) {
        if (whName === ingName) return whId;
      }
      // Check if warehouse name starts with ingredient name (or vice versa)
      for (const [whName, whId] of Object.entries(whMap)) {
        const cleanWh = whName.replace(/\d+.*ק"ג|1\s*ק"ג|\d+\s*גרם/g, '').trim();
        const cleanIng = ingName.trim();
        if (cleanWh === cleanIng || cleanWh.startsWith(cleanIng) || cleanIng.startsWith(cleanWh)) return whId;
      }
      // Partial match (first 4+ chars)
      if (ingName.length >= 4) {
        const prefix = ingName.substring(0, 4);
        const matches = Object.entries(whMap).filter(([n]) => n.includes(prefix));
        if (matches.length === 1) return matches[0][1];
      }
      return null;
    }

    // All missing recipe ingredients data from Excel files
    // Format: [recipeName, [[ingName, quantity, unit], ...]]
    const recipeIngredients: [string, [string, number, string][]][] = [
      // === BAKERY ===
      ["בצק לחמניות", [
        ["קמח פיצה", 2400, "גרם"], ["קמח רב תכליתי", 2000, "גרם"], ["מים", 1850, "גרם"],
        ["ביצים", 250, "גרם"], ["שמן קנולה", 400, "גרם"], ["מלח", 80, "גרם"],
        ["משפר אפייה", 40, "גרם"], ["סוכר", 300, "גרם"], ["שמרים טריים", 120, "גרם"]
      ]],
      ["אוזני פיל", [
        ["בצק עלים שאריות", 500, "גרם"], ["סוכר", 150, "גרם"]
      ]],
      ["בוקר צרפתי", [
        ["בצק בריוש כרוך", 1100, "גרם"]
      ]],
      ["בריוש מלוח", [
        ["בצק בריוש כרוך", 1100, "גרם"], ["בולגרית מעודנת", 250, "גרם"],
        ["שרי", 80, "גרם"], ["פסטו", 20, "גרם"], ["שומשום לבן", 14, "גרם"]
      ]],
      ["קראנץ פיסטוק", [
        ["בצק בריוש כרוך", 350, "גרם"], ["ממרח פיסטוק", 90, "גרם"],
        ["שוקולד לבן גרוס", 15, "גרם"]
      ]],

      // === KITCHEN ===
      ["בייגלס", [
        ["בייגלס", 6, "יח"], ["ברי גד", 80, "גרם"], ["חסה לליק", 150, "גרם"],
        ["עגבניית תמר", 100, "גרם"], ["חמאה", 20, "גרם"],
        ["פסטו", 20, "גרם"], ["בולגרית", 120, "גרם"],
        ["מילוי חצילים", 88, "גרם"], ["בזיליקום", 10, "גרם"], ["בלסמי מצומצם", 10, "גרם"]
      ]],
      ["פרעצלס", [
        ["פרעצלס", 2, "יח"], ["סלט ביצים", 140, "גרם"], ["חסה לליק", 30, "גרם"],
        ["מלפפון", 15, "גרם"], ["אמנטל פרוסות", 70, "גרם"],
        ["עגבנייה תמר", 50, "גרם"], ["חסה סלנובה", 30, "גרם"], ["חמאה", 20, "גרם"]
      ]],
      ["מיקס כריכים", [
        ["לחמניית פרעצל", 4, "יח"], ["מוצרלה במים", 110, "גרם"],
        ["בזיליקום", 12, "עלים"], ["עגבניה", 1, "יח"], ["ממרח פסטו בזיליקום", 12, "גרם"],
        ["לחמניות כוסמין", 2, "יח"], ["גאודה פרוסות", 41, "גרם"],
        ["חמאה", 12, "גרם"], ["חסה סלנובה", 35, "גרם"], ["עגבניה תמר", 90, "גרם"],
        ["סלט טונה", 160, "גרם"], ["מלפפון", 80, "גרם"], ["חסה לליק", 35, "גרם"]
      ]],
      ["כריך פוקאצ'ה", [
        ["פוקאצ'ה", 1, "יח"], ["פסטו", 45, "גרם"], ["מוצרלה במים", 240, "גרם"],
        ["עגבניית תמר", 50, "גרם"], ["בזיליקום", 5, "גרם"], ["רוטב בלסמי מצומצם", 6, "גרם"]
      ]],
      ["טאפאנד זיתים", [
        ["שמן זית", 150, "גרם"], ["שמן קנולה", 150, "גרם"],
        ["זיתי קלמטה מגולענים", 700, "גרם"], ["תערובת תבלינים", 0, "גרם"]
      ]],
      ["בטטה צלויה", [
        ["בטטה", 1000, "גרם"], ["שמן קנולה", 150, "גרם"],
        ["מלח דק", 30, "גרם"], ["תערובת תבלינים", 0, "גרם"]
      ]],
      ["מאפינס בטטה", [
        ["מילוי בטטה", 1000, "גרם"], ["ביצים", 200, "גרם"]
      ]],
      ["מיני טורטיות", [
        ["טורטייה כוסמין", 3, "יח"], ["סלט טונה", 213, "גרם"], ["חסה לליק", 25, "גרם"],
        ["מילוי בטטה", 50, "גרם"], ["מילוי חצילים", 60, "גרם"],
        ["טחינה", 20, "גרם"], ["פלפל אדום קלוי", 45, "גרם"], ["חסה סלנובה", 25, "גרם"]
      ]],
      ["לחמנייה ללא גלוטן", [
        ["לחמנייה ללא גלוטן", 2, "יח"], ["מוצרלה במים", 110, "גרם"],
        ["בזיליקום", 12, "עלים"], ["עגבניה", 1, "יח"], ["ממרח פסטו בזיליקום", 12, "גרם"],
        ["סלט טונה", 160, "גרם"], ["מלפפון", 80, "גרם"], ["חסה לליק", 35, "גרם"]
      ]],
      ["סלט טונה", [
        ["טונה נתחים", 900, "גרם"], ["מיונז", 200, "גרם"],
        ["פלפל אדום", 200, "גרם"], ["פלפל צהוב", 200, "גרם"],
        ["זיתי קלמטה חצאים", 150, "גרם"]
      ]],
      ["סלט קיסר", [
        ["לבבות קיסר בנספק", 450, "גרם"], ["גרנה פדנה מגורדת (פרמז'ן)", 35, "גרם"],
        ["בצל אדום", 50, "גרם"], ["קרוטונים", 70, "גרם"], ["רוטב קיסר", 100, "גרם"]
      ]],
      ["סלט תאילנדי", [
        ["כרוב אדום", 600, "גרם"], ["פלפל אדום", 200, "גרם"],
        ["פלפל צהוב", 200, "גרם"], ["מלפפון", 250, "גרם"],
        ["גזר ארוז", 250, "גרם"], ["שומשום קלוי", 20, "גרם"],
        ["בוטנים מטוגנים", 50, "גרם"], ["רוטב תאילנדי", 100, "גרם"]
      ]],
      ["אנטיפסטי", [
        ["מילוי בטטה", 200, "גרם"], ["מילוי חצילים", 200, "גרם"],
        ["מילוי בצל אדום", 300, "גרם"], ["פלפלים אדומים קלויים", 200, "גרם"],
        ["רוטב בלסמי מצומצם", 5, "גרם"]
      ]],
      ["עלי גפן", [
        ["עלי גפן", 30, "יח"]
      ]],
      ["פיטריות צלויות", [
        ["פיטריות שמפניון", 1000, "גרם"], ["מלח דק", 10, "גרם"],
        ["שמן קנולה", 70, "גרם"], ["פלפל שחור טחון", 10, "גרם"]
      ]],
      ["רוטב יווני", [
        ["שמן זית", 1000, "גרם"], ["לימון סחוט", 300, "גרם"],
        ["מלח דק", 0, "גרם"], ["פלפל שחור", 0, "גרם"]
      ]],
      ["רוטב רוזה", [
        ["שמנת מתוקה", 300, "גרם"], ["עגבניות מרוסקות", 250, "גרם"],
        ["שום", 2, "שיניים"]
      ]],
      ["רוטב שמנת פיטריות", [
        ["שמנת מתוקה", 300, "גרם"], ["פיטריות שמפניון", 250, "גרם"],
        ["שמן קנולה", 30, "גרם"], ["מלח דק", 5, "גרם"],
        ["פלפל שחור", 5, "גרם"], ["אגוז מוסקט", 0, "גרם"], ["קורנפלור", 0, "גרם"]
      ]],
      ["רוטב תאילנדי", [
        ["דבש", 150, "גרם"], ["חומץ", 400, "גרם"],
        ["חמאת בוטנים", 150, "גרם"], ["סויה", 80, "גרם"],
        ["שמן זית", 300, "גרם"], ["שמן קנולה", 550, "גרם"]
      ]],
      ["פסטה רוזה", [
        ["פסטה יבשה", 500, "גרם"], ["רוטב רוזה", 550, "גרם"]
      ]],
      ["קרוטונים", [
        ["לחם מחמצת", 1, "יח"], ["שמן זית", 50, "גרם"],
        ["מלח", 10, "גרם"], ["פלפל שחור", 10, "גרם"]
      ]],
      ["מיני תפו\"א ובטטה", []],
      ["שיפודי סלמון", []],

      // === PATISSERIE ===
      ["טראפלס", [
        ["שמנת מתוקה", 800, "גרם"], ["שוקולד מריר 60%", 1100, "גרם"]
      ]],
      ["כדורי שוקולד", [
        ["בראוניז", 0, "גרם"], ["חלב", 0, "גרם"], ["שאריות בצק פריך", 0, "גרם"]
      ]],
      ["כדורי תמרים", [
        ["תמר מג'הול", 1000, "גרם"], ["אגוז מלך", 200, "גרם"],
        ["אבקת שקדים", 100, "גרם"], ["קקאו", 20, "גרם"]
      ]],
      ["קיש תרד", [
        ["בצק פריך מלוח", 430, "גרם"], ["רויאל", 500, "גרם"],
        ["תרד (מלית)", 450, "גרם"]
      ]],
      ["טארטלט לימון", [
        ["בצק פריך", 26, "גרם"], ["קרם לימון", 25, "גרם"],
        ["קרם מסקרפונה", 10, "גרם"]
      ]],
      ["טארטלט פיסטוק", [
        ["חמאה", 280, "גרם"], ["אבקת סוכר", 240, "גרם"],
        ["אבקת שקדים", 280, "גרם"], ["ביצים", 240, "גרם"],
        ["קורנפלור", 55, "גרם"], ["מחית פיסטוק", 250, "גרם"],
        ["בצק פריך", 26, "גרם"], ["דובדבני אמרנה", 1, "יח"]
      ]],
      ["טארטלט שוקולד", [
        ["חמאה", 240, "גרם"], ["שוקולד מריר 60%", 1200, "גרם"],
        ["שמנת מתוקה", 1200, "גרם"], ["בצק פריך", 26, "גרם"],
        ["גנאש שוקולד", 30, "גרם"], ["שנטיי מסקרפונה", 1, "גרם"]
      ]],
      ["טארטלט תפוחים", [
        ["בצק פריך", 26, "גרם"], ["קרם שקדים", 20, "גרם"],
        ["שטרוייזל", 3, "גרם"], ["תפוחים בסירופ", 15, "גרם"]
      ]],
      ["מסקרפונה בכוסות", [
        ["קראמבל", 6, "גרם"], ["שנטיי מסקרפונה", 40, "גרם"], ["פטל", 2, "גרם"]
      ]],
      ["עוגיות שוקולד צ'יפס", [
        ["חמאה", 400, "גרם"], ["סוכר חום כהה", 500, "גרם"],
        ["סוכר לבן", 120, "גרם"], ["ביצים", 200, "גרם"],
        ["מלח", 16, "גרם"], ["סודה לשתייה", 8, "גרם"],
        ["אבקת אפייה", 16, "גרם"], ["קמח לבן", 840, "גרם"],
        ["שוקולד מריר 60%", 600, "גרם"]
      ]],
      ["עוגת גזר", [
        ["ביצים", 840, "גרם"], ["סוכר לבן", 960, "גרם"],
        ["סוכר חום", 960, "גרם"], ["שמן קנולה", 600, "גרם"],
        ["מיץ תפוזים", 360, "גרם"], ["קמח לבן", 1560, "גרם"],
        ["קינמון", 10, "גרם"], ["אבקת אפייה", 48, "גרם"],
        ["סודה לשתייה", 36, "גרם"], ["גזר", 1900, "גרם"],
        ["אגוז מלך", 360, "גרם"]
      ]],
      ["פיננסייר שוקולד", [
        ["חמאה", 250, "גרם"], ["חלבון", 200, "גרם"],
        ["סוכר", 240, "גרם"], ["אבקת שקדים", 110, "גרם"],
        ["קמח", 60, "גרם"], ["אבקת קקאו", 30, "גרם"],
        ["מלח", 4, "גרם"], ["שוקולד מריר", 80, "גרם"]
      ]],
      ["בצק רבוך", [
        ["מים", 1200, "גרם"], ["חלב", 1200, "גרם"],
        ["מלח", 24, "גרם"], ["סוכר", 150, "גרם"],
        ["חמאה", 1080, "גרם"], ["קמח", 1440, "גרם"], ["ביצים", 2060, "גרם"]
      ]],
      ["קנטוצ'יני", [
        ["קמח לבן", 720, "גרם"], ["סוכר", 840, "גרם"],
        ["אבקת אפייה", 36, "גרם"], ["חלב", 45, "גרם"],
        ["ביצים", 960, "גרם"], ["אגוז מלך", 450, "גרם"],
        ["שקדים פרוסים", 450, "גרם"]
      ]],
    ];

    let totalInserted = 0;
    let totalSkipped = 0;
    const unmatchedIngredients: string[] = [];

    for (const [recipeName, ingredients] of recipeIngredients) {
      const recipeId = recipeMap[recipeName];
      if (!recipeId) {
        console.log(`Recipe not found: ${recipeName}`);
        continue;
      }
      if (ingredients.length === 0) {
        totalSkipped++;
        continue;
      }

      // Check if recipe already has ingredients
      const { count } = await supabase
        .from("recipe_ingredients")
        .select("id", { count: "exact", head: true })
        .eq("recipe_id", recipeId);

      if (count && count > 0) {
        console.log(`Recipe ${recipeName} already has ${count} ingredients, skipping`);
        totalSkipped++;
        continue;
      }

      const rows = ingredients.map(([name, quantity, unit]) => {
        const whId = findWarehouseId(name as string);
        if (!whId) unmatchedIngredients.push(`${recipeName} -> ${name}`);
        return {
          recipe_id: recipeId,
          name: name as string,
          quantity: quantity as number,
          unit: unit as string,
          warehouse_item_id: whId,
        };
      });

      const { error } = await supabase.from("recipe_ingredients").insert(rows);
      if (error) {
        console.error(`Error inserting ingredients for ${recipeName}:`, error);
      } else {
        totalInserted += rows.length;
        console.log(`Inserted ${rows.length} ingredients for ${recipeName}`);
      }
    }

    // Final counts
    const { count: totalRecipes } = await supabase.from("recipes").select("id", { count: "exact", head: true });
    const { count: totalIngredients } = await supabase.from("recipe_ingredients").select("id", { count: "exact", head: true });
    const { count: unmatchedCount } = await supabase
      .from("recipe_ingredients")
      .select("id", { count: "exact", head: true })
      .is("warehouse_item_id", null);

    const { data: recipesWithNoIngredients } = await supabase.rpc("has_role", { _user_id: "00000000-0000-0000-0000-000000000000", _role: "admin" }).select();

    // Get recipes still missing ingredients
    const { data: emptyRecipes } = await supabase
      .from("recipes")
      .select("name")
      .not("id", "in", `(SELECT DISTINCT recipe_id FROM recipe_ingredients)`);

    return new Response(JSON.stringify({
      success: true,
      inserted: totalInserted,
      skipped: totalSkipped,
      totalRecipes,
      totalIngredients,
      unmatchedCount,
      unmatchedIngredients: [...new Set(unmatchedIngredients)],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
