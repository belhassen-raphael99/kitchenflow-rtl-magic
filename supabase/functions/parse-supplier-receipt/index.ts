function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get('Origin') || '';
  const envOrigin = Deno.env.get('ALLOWED_ORIGIN');
  if (envOrigin && origin === envOrigin) return origin;
  const allowedHosts = ['.lovable.app', '.lovableproject.com', '.vercel.app'];
  if (allowedHosts.some((h) => origin.endsWith(h))) return origin;
  return envOrigin || 'https://kitchenflow-rtl-magic.lovable.app';
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getAllowedOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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
    const { file_base64, mime_type, supplier_hint } = body as {
      file_base64?: string;
      mime_type?: string;
      supplier_hint?: string;
    };

    if (!file_base64 || typeof file_base64 !== "string") {
      return new Response(JSON.stringify({ error: "Missing file_base64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!mime_type || !ALLOWED_MIME.includes(mime_type)) {
      return new Response(
        JSON.stringify({ error: "Unsupported mime_type", allowed: ALLOWED_MIME }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // base64 length ~ bytes * 4/3
    const approxBytes = Math.floor((file_base64.length * 3) / 4);
    if (approxBytes > MAX_FILE_BYTES) {
      return new Response(JSON.stringify({ error: "file_too_large", max: MAX_FILE_BYTES }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supplierLine = supplier_hint
      ? `The supplier is likely: "${supplier_hint}". Use it as supplier_name if confirmed.`
      : "Try to detect the supplier name from the document header.";

    const prompt = `Extract data from this supplier delivery receipt / order (Hebrew or French).
Return ONLY valid JSON, no other text or markdown:
{
  "supplier_name": "string or null",
  "document_date": "YYYY-MM-DD or null",
  "items": [
    {
      "name": "short product name in original language",
      "quantity": number,
      "unit": "string (קג, יחידה, ארגז, ק״ג, kg, unité...)",
      "price_per_unit": number or null,
      "total_price": number or null
    }
  ]
}
Rules:
- ${supplierLine}
- Extract every product line (food, ingredients, packaging).
- Skip headers, totals, taxes, signatures.
- quantity must be a number (use 1 if unclear).
- If unit is missing, use "יחידה".
- Keep product names short and clean (remove SKU codes if possible).
- If this is clearly not a supplier order/receipt, return: {"error": "not_a_receipt"}`;

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
                image_url: { url: `data:${mime_type};base64,${file_base64}` },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ success: false, error: "ai_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";

    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", rawText);
      return new Response(
        JSON.stringify({ success: false, error: "parse_failed" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (parsed.error === "not_a_receipt") {
      return new Response(
        JSON.stringify({ success: false, error: "not_a_receipt" }),
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