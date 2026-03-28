// ML: OpenAI from the browser via VITE_OPENAI_API_KEY (set in Vercel / .env).
// The key is bundled into the client — fine for small/private deploys; use a server proxy for production at scale.

function getOpenAIKey(): string {
  const raw = import.meta.env.VITE_OPENAI_API_KEY;
  return (typeof raw === "string" ? raw : "").trim();
}

const OPENAI_API_URL = "https://api.openai.com/v1";

export const isMockMode = () => !getOpenAIKey();

async function openAiChatCompletion(params: {
  system: string;
  user: string;
  max_tokens?: number;
  temperature?: number;
}): Promise<string> {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error("OpenAI API key missing. Set VITE_OPENAI_API_KEY in Vercel (or .env) and redeploy.");
  }

  const { system, user, max_tokens = 800, temperature = 0.5 } = params;

  const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim?.() || "";
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!getOpenAIKey()) {
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }

  try {
    const key = getOpenAIKey();
    const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (!getOpenAIKey()) {
    return texts.map(() => Array.from({ length: 1536 }, () => Math.random() * 2 - 1));
  }
  try {
    const key = getOpenAIKey();
    const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    return (data.data as any[])
      .sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0))
      .map((d: any) => d.embedding);
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return texts.map(() => Array.from({ length: 1536 }, () => Math.random() * 2 - 1));
  }
}

function problemToText(p: { title?: string; domain?: string; tags?: string[] }): string {
  const title = (p.title ?? "").trim();
  const domain = (p.domain ?? "").trim();
  const tags = Array.isArray(p.tags) ? p.tags.join(" ") : "";
  return [title, domain, tags].filter(Boolean).join(" ");
}

export async function getRelatedProblemsRanked(
  current: { id: string; title?: string; domain?: string; tags?: string[] },
  candidates: Array<{ id: string; pid: string; title?: string; domain?: string; tags?: string[] }>,
  topN: number = 8
): Promise<Array<{ id: string; pid: string; title: string; domain: string }>> {
  if (candidates.length === 0) return [];
  const currentDomain = (current.domain ?? "").trim().toLowerCase();
  const currentTags = new Set((current.tags ?? []).map((t) => String(t).trim().toLowerCase()).filter(Boolean));

  if (getOpenAIKey()) {
    try {
      const allTexts = [problemToText(current), ...candidates.map((c) => problemToText(c))];
      const embeddings = await generateEmbeddings(allTexts);
      if (embeddings.length !== allTexts.length)
        return candidates.slice(0, topN).map((c) => ({ id: c.id, pid: c.pid, title: c.title ?? "", domain: c.domain ?? "" }));
      const currentEmb = embeddings[0];
      const withScore = candidates.map((c, i) => ({
        ...c,
        score: cosineSimilarity(currentEmb, embeddings[i + 1]),
      }));
      withScore.sort((a, b) => b.score - a.score);
      return withScore.slice(0, topN).map((c) => ({ id: c.id, pid: c.pid, title: c.title ?? "", domain: c.domain ?? "" }));
    } catch (e) {
      console.error("Embedding rank failed, using fallback:", e);
    }
  }
  const withScore = candidates.map((c) => {
    const sameDomain = currentDomain && (c.domain ?? "").trim().toLowerCase() === currentDomain ? 2 : 0;
    const cTags = new Set((c.tags ?? []).map((t) => String(t).trim().toLowerCase()).filter(Boolean));
    let tagOverlap = 0;
    cTags.forEach((t) => {
      if (currentTags.has(t)) tagOverlap++;
    });
    return { ...c, score: sameDomain + tagOverlap };
  });
  withScore.sort((a, b) => (b as any).score - (a as any).score);
  return withScore.slice(0, topN).map((c) => ({ id: c.id, pid: c.pid, title: c.title ?? "", domain: c.domain ?? "" }));
}

export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export async function summarizeText(text: string, maxLength: number = 200): Promise<string> {
  if (!getOpenAIKey()) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join(". ").trim();
    return summary.length > maxLength ? summary.substring(0, maxLength) + "..." : summary + ".";
  }

  try {
    const summary = await openAiChatCompletion({
      system: "You are a helpful assistant that summarizes user-provided text clearly and accurately.",
      user: text,
      max_tokens: Math.max(150, Math.floor(maxLength * 1.5)),
      temperature: 0.4,
    });
    return summary;
  } catch (error) {
    console.error("Error summarizing text:", error);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join(". ").trim();
    return summary.length > maxLength ? summary.substring(0, maxLength) + "..." : summary + ".";
  }
}

export async function summarizeSolutions(abstracts: string[]): Promise<string> {
  if (abstracts.length === 0) {
    return "No solutions to summarize.";
  }

  if (!getOpenAIKey()) {
    const normalized = abstracts
      .map((a) => a.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const first = normalized.slice(0, 2).join(" ");
    const second = normalized.slice(2, 4).join(" ");
    const p1 = first.length > 280 ? first.slice(0, 277) + "..." : first;
    const p2 = second.length > 280 ? second.slice(0, 277) + "..." : second;
    return [p1, p2].filter(Boolean).join("\n\n");
  }

  const combinedText = abstracts
    .map((abstract, index) => `Solution ${index + 1}: ${abstract}`)
    .join("\n\n");

  const system = [
    "You summarize multiple proposed solutions to a research problem.",
    "Output must be exactly 1–2 short paragraphs of plain text.",
    "Each paragraph should be at most 4 sentences.",
    "Do NOT use headings or bullet points.",
    "Produce a synthesized summary: DO NOT list or repeat each abstract verbatim.",
    "You may quote only short phrases when necessary; focus on merging ideas.",
  ].join("\n");

  const user = [
    "Analyze, summarize and synthesize all the following solution abstracts into a concise overview.",
    "Summarize the main themes and approaches, and briefly mention any notable strengths or differences.",
    "Keep the answer very short: 1–2 paragraphs, each no more than 4 sentences.",
    "Do not output the raw abstracts. Instead, merge them into themes and a coherent combined view.",
    "",
    "Required structure:",
    "Detailed overview",
    " ",
    combinedText,
  ].join("\n");

  try {
    return await openAiChatCompletion({ system, user, max_tokens: 800, temperature: 0.3 });
  } catch (error) {
    console.error("Error summarizing solutions:", error);
    const lines: string[] = [];
    lines.push("Most of the Users say: ");
    abstracts.forEach((a, idx) => {
      const short = a.replace(/\s+/g, " ").trim();
      lines.push(`${idx + 1}. ${short}`);
    });
    return lines.join("\n");
  }
}
