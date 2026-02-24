// ML Service for OpenAI API integration
// Supports GPT-4o-mini and text-embedding-3-small

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
    throw new Error("OpenAI API key is missing. Set VITE_OPENAI_API_KEY in .env and restart the dev server or rebuild.");
  }

  const { system, user, max_tokens = 1200, temperature = 0.5 } = params;

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

// Generate text embeddings using text-embedding-3-small
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!getOpenAIKey()) {
    // Return mock   embedding (1536 dimensions for text-embedding-3-small)
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
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Fallback to mock embedding on error
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
}

// Generate embeddings for multiple texts in one API call (batch)
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
    return (data.data as any[]).sort((a: any, b: any) => (a.index ?? 0) - (b.index ?? 0)).map((d: any) => d.embedding);
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return texts.map(() => Array.from({ length: 1536 }, () => Math.random() * 2 - 1));
  }
}

// Build a single text representation for a problem (for embedding)
function problemToText(p: { title?: string; domain?: string; tags?: string[] }): string {
  const title = (p.title ?? "").trim();
  const domain = (p.domain ?? "").trim();
  const tags = Array.isArray(p.tags) ? p.tags.join(" ") : "";
  return [title, domain, tags].filter(Boolean).join(" ");
}

// Rank candidate problems by similarity to current (using embeddings if API key set, else domain/tag overlap)
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
      if (embeddings.length !== allTexts.length) return candidates.slice(0, topN).map((c) => ({ id: c.id, pid: c.pid, title: c.title ?? "", domain: c.domain ?? "" }));
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

// Calculate cosine similarity between two embeddings
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

// Summarize text using GPT-4o-mini
export async function summarizeText(text: string, maxLength: number = 200): Promise<string> {
  if (!getOpenAIKey()) {
    // Return mock summary
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ').trim();
    return summary.length > maxLength 
      ? summary.substring(0, maxLength) + '...' 
      : summary + '.';
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
    console.error('Error summarizing text:', error);
    // Fallback to mock summary
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ').trim();
    return summary.length > maxLength 
      ? summary.substring(0, maxLength) + '...' 
      : summary + '.';
  }
}

// Summarize multiple solution abstracts
export async function summarizeSolutions(abstracts: string[]): Promise<string> {
  if (abstracts.length === 0) {
    return 'No solutions to summarize.';
  }

  if (!getOpenAIKey()) {
    const lines: string[] = [];
    lines.push("AI Summary");
    lines.push("");
    lines.push("Key points:");
    abstracts.slice(0, 5).forEach((a, idx) => {
      const short = a.replace(/\s+/g, " ").trim();
      lines.push(`- Solution ${idx + 1}: ${short.length > 180 ? short.slice(0, 180) + "…" : short}`);
    });
    if (abstracts.length > 5) {
      lines.push(`- +${abstracts.length - 5} more solution(s)`);
    }
    return lines.join("\n");
  }

  const combinedText = abstracts
    .map((abstract, index) => `Solution ${index + 1}: ${abstract}`)
    .join('\n\n');

  const system = [
    "You summarize multiple proposed solutions to a research problem.",
    "Output should be structured plain text. Use headings and bullets; include sub-bullets when helpful.",
    "Produce a synthesized summary: DO NOT list or repeat each abstract verbatim.",
    "You may quote only short phrases when necessary; focus on merging ideas.",
    "Be as detailed as needed to cover all solutions.",
  ].join("\n");

  const user = [
    "Analyze, summarize and synthesize all the following solution abstracts into an integrated, detailed overview. Provide a detailed analysis of the solutions, including the strengths and weaknesses of each solution, and the potential for combining them into a coherent combined plan.",
    "Do not output the raw abstracts. Instead, merge them into themes, approaches, and a coherent combined plan.",
    "",
    "Required structure:",
    "AI Summary",
    "Detailed overview",
    " ",
    combinedText,
  ].join("\n");

  try {
    return await openAiChatCompletion({ system, user, max_tokens: 1800, temperature: 0.3 });
  } catch (error) {
    console.error("Error summarizing solutions:", error);
    // fallback: at least surface the abstracts in a structured way
    const lines: string[] = [];
    lines.push("AI Summary");
    lines.push("");
    lines.push("Key points:");
    abstracts.forEach((a, idx) => {
      const short = a.replace(/\s+/g, " ").trim();
      lines.push(`- Solution ${idx + 1}: ${short}`);
    });
    return lines.join("\n");
  }
}

