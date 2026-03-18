import { Response } from "express";
import { GoogleGenAI } from "@google/genai";
import Post from "../models/post";
import { AuthRequest } from "../middleware/auth";
import { findSimilarChunks, reindexAllPosts } from "../services/embedding";

let genAI: GoogleGenAI | null = null;
const getGenAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY || "AIzaSyCryRGvUY-9ET9e08nBPrmJ_q60AIBssug";
    console.log("[AI] Using GEMINI_API_KEY:", key ? `${key.slice(0, 8)}...${key.slice(-4)}` : "MISSING");
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

// ── Rate limiting ───────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

let globalRequestCount = 0;
let globalRateLimitReset = Date.now();
const GLOBAL_RATE_LIMIT = 10;

const checkGlobalLimit = (): boolean => {
  const now = Date.now();
  if (now - globalRateLimitReset > RATE_WINDOW) {
    globalRequestCount = 0;
    globalRateLimitReset = now;
  }
  if (globalRequestCount >= GLOBAL_RATE_LIMIT) return false;
  globalRequestCount++;
  return true;
};

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
};

// ── Cache ───────────────────────────────────────────────────

const searchCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// ── RAG search controller ───────────────────────────────────

const TOP_K_CHUNKS = 5; // Retrieve top 3–5 most relevant chunks

export const aiSearch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      res.status(400).json({ message: "Search query is required." });
      return;
    }

    const trimmedQuery = query.trim().toLowerCase();

    // ── Cache check ───────────────────────────────────────
    const cached = searchCache.get(trimmedQuery);
    if (cached && Date.now() < cached.expiresAt) {
      res.json(cached.data);
      return;
    }

    // ── Rate limits ───────────────────────────────────────
    if (!checkRateLimit(req.userId!)) {
      res.status(429).json({ message: "Too many AI requests. Please wait a moment." });
      return;
    }
    if (!checkGlobalLimit()) {
      res.status(429).json({ message: "Server is reaching capacity. Try again in a minute." });
      return;
    }

    // ── RAG Step 1: Query Embedding + Vector Search ───────
    const topChunks = await findSimilarChunks(query.trim(), TOP_K_CHUNKS);

    if (topChunks.length === 0) {
      res.json({ answer: "No data available to search.", sources: [] });
      return;
    }

    // ── RAG Step 2: Fetch source post metadata ────────────
    const uniquePostIds = [...new Set(topChunks.map((c) => c.postId))];
    const posts = await Post.find({ _id: { $in: uniquePostIds } })
      .populate("owner", "username profileImage")
      .lean();
    const postMap = new Map(posts.map((p) => [p._id.toString(), p]));

    // Build context from retrieved chunks
    const contextParts = topChunks.map((chunk, i) => {
      const post = postMap.get(chunk.postId);
      const title = post ? `${post.dishName} @ ${post.restaurant}` : "Unknown Post";
      return `[Source ${i + 1} — "${title}"]\n${chunk.content}`;
    });
    const context = contextParts.join("\n\n");

    // ── RAG Step 3: Prompt Augmentation + LLM Generation ──
    console.log(`[AI] RAG search — query: "${query.trim()}", chunks: ${topChunks.length}`);

    const prompt = `You are BiteShare's food assistant. Answer the user's question based ONLY on the context below.
If the context does not contain enough information, say so honestly.
Be concise and helpful. Use the same language as the user's question.

--- CONTEXT ---
${context}
--- END CONTEXT ---

User question: "${query.trim()}"

Respond in JSON only (no markdown fences):
{
  "answer": "<your helpful answer based on the context>",
  "sources": [<indexes of the sources you used, e.g. 1, 2>]
}`;

    const result = await getGenAI().models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { temperature: 0.2 } });
    const responseText = (result.text ?? "").trim();

    let parsed: { answer: string; sources: number[] };
    try {
      const cleanJson = responseText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      res.json({
        answer: "Could not process search. Please try a different query.",
        sources: [],
      });
      return;
    }

    // Map source indexes back to post data
    const sources = (parsed.sources || [])
      .filter((idx: number) => idx >= 1 && idx <= topChunks.length)
      .map((idx: number) => {
        const chunk = topChunks[idx - 1];
        const post = postMap.get(chunk.postId);
        return post
          ? {
              postId: post._id.toString(),
              dishName: post.dishName,
              restaurant: post.restaurant,
            }
          : null;
      })
      .filter(Boolean);

    // Deduplicate sources by postId
    const seen = new Set<string>();
    const uniqueSources = sources.filter((s: { postId: string } | null) => {
      if (!s || seen.has(s.postId)) return false;
      seen.add(s.postId);
      return true;
    });

    const responseData = {
      answer: parsed.answer || "",
      sources: uniqueSources,
    };

    // Cache
    searchCache.set(trimmedQuery, { data: responseData, expiresAt: Date.now() + CACHE_TTL });

    res.json(responseData);
  } catch (err: unknown) {
    console.error("AI search error:", err);
    const status = (err as { status?: number }).status;
    if (status === 429) {
      res.status(429).json({ message: "AI is busy right now. Please wait a few seconds and try again." });
      return;
    }
    res.status(500).json({ message: "AI search failed. Please try again." });
  }
};

// ── Reindex all posts ───────────────────────────────────────

export const reindex = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await reindexAllPosts();
    res.json(result);
  } catch (err) {
    console.error("Reindex error:", err);
    res.status(500).json({ message: "Reindex failed." });
  }
};
