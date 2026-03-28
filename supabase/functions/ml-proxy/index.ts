import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MlRequest =
  | { action: "chat"; system: string; user: string; max_tokens?: number; temperature?: number }
  | { action: "embedding"; input: string }
  | { action: "embeddings"; input: string[] };

function badRequest(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as MlRequest;
    const openAiHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (body.action === "chat") {
      if (!body.system || !body.user) return badRequest("Missing chat input.");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: openAiHeaders,
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: body.system },
            { role: "user", content: body.user },
          ],
          max_tokens: body.max_tokens ?? 800,
          temperature: body.temperature ?? 0.4,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        return new Response(JSON.stringify({ error: text || "OpenAI chat request failed." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim?.() || "";
      return new Response(JSON.stringify({ text }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "embedding") {
      if (!body.input || typeof body.input !== "string") return badRequest("Missing embedding input.");
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: openAiHeaders,
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: body.input,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        return new Response(JSON.stringify({ error: text || "OpenAI embedding request failed." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await response.json();
      return new Response(JSON.stringify({ embedding: data?.data?.[0]?.embedding ?? [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "embeddings") {
      if (!Array.isArray(body.input)) return badRequest("Missing embeddings input.");
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: openAiHeaders,
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: body.input,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        return new Response(JSON.stringify({ error: text || "OpenAI embeddings request failed." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await response.json();
      const embeddings = (data?.data ?? [])
        .sort((a: { index: number }, b: { index: number }) => (a?.index ?? 0) - (b?.index ?? 0))
        .map((entry: { embedding: number[] }) => entry.embedding);
      return new Response(JSON.stringify({ embeddings }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return badRequest("Unsupported action.");
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown server error." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
