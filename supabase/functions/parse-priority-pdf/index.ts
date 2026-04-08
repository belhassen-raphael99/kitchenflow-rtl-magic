function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  if (origin.endsWith('.lovable.app')) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { pdf_base64 } = body;

    if (!pdf_base64 || typeof pdf_base64 !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing pdf_base64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Lovable AI (Gemini) to parse the PDF
    const prompt = `Extract data from this Priority catering quote PDF. Return ONLY valid JSON, no other text or markdown:
{
  "quote_number": "string",
  "client": { "name": "full name", "city": "city", "phone": "phone number" },
  "event": { "date": "YYYY-MM-DD", "time": "HH:MM", "delivery_time": "HH:MM", "guests": number },
  "items": [
    {
      "name": "short product name in Hebrew — remove size info like '2.5 ליטר', '1 קג', quantities in parentheses",
      "full_name": "complete product name exactly as written in PDF",
      "quantity": number,
      "is_service": boolean
    }
  ]
}
Rules:
- date format must be YYYY-MM-DD
- time format must be HH:MM
- guests must be a number
- Extract the SHORT name for matching (e.g. "סלט פסטה" not "סלט פסטה- 2.5 ליטר")
- Keep full_name with the complete original text from PDF
- items: include ALL product lines
- is_service = true ONLY for: כלים חד פעמיים, דמי משלוח, בקבוקי שתיה
- is_service = false for all food items
- Do NOT include any prices
- If this is not a Priority quote PDF, return: {"error": "not_priority_quote"}`;

    const aiResponse = await fetch(LOVABLE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdf_base64}`,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: "AI parsing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response (strip markdown fences if present)
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", rawText);
      return new Response(
        JSON.stringify({ success: false, error: "parse_failed" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (parsed.error === "not_priority_quote") {
      return new Response(
        JSON.stringify({ success: false, error: "not_priority_quote" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
