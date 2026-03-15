import { Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Post from "../models/post";
import Comment from "../models/comment";
import { AuthRequest } from "../middleware/auth";

let genAI: GoogleGenerativeAI | null = null;
const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  }
  return genAI;
};

// Rate limiting: track requests per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

// Global rate limiting: cap total requests across all users to stay under Gemini free tier (10 RPM)
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

// Simple cache to avoid repeat API calls for the same query
const searchCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    // Check cache first
    const cached = searchCache.get(trimmedQuery);
    if (cached && Date.now() < cached.expiresAt) {
      res.json(cached.data);
      return;
    }

    // Rate limit check
    if (!checkRateLimit(req.userId!)) {
      res.status(429).json({ message: "Too many AI requests. Please wait a moment." });
      return;
    }

    // Global rate limit check — prevents exceeding Gemini free tier (10 RPM)
    if (!checkGlobalLimit()) {
      res.status(429).json({ message: "Server is reaching capacity. Try again in a minute." });
      return;
    }

    // Fetch posts (limit to 20 for token efficiency)
    const posts = await Post.find()
      .populate("owner", "username profileImage")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (posts.length === 0) {
      res.json({ results: [], summary: "No posts available to search." });
      return;
    }

    // Compact format — one line per post, minimal tokens
    const postsCompact = posts.map((p) => {
      const author = (p.owner as { username?: string })?.username || "?";
      const desc = (p.description || "").slice(0, 80);
      return `${p._id}|${p.dishName}|${p.restaurant}|${desc}|${author}`;
    }).join("\n");

    const model = getGenAI().getGenerativeModel({ model: "gemini-flash-latest" });
    console.log(`[AI] Sending request to Gemini for query: "${query.trim()}"`);

    const prompt = `Food app search. Posts (id|dish|restaurant|description|author):
${postsCompact}

Query: "${query.trim()}"

Return JSON only: {"results":[{"postId":"<id>","relevance":"<why>"}],"summary":"<short summary>"}
Max 10 results. Match semantically (e.g. "sweet"=desserts). Same language as query. No markdown.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    let parsed;
    try {
      const cleanJson = responseText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      res.json({
        results: [],
        summary: "Could not process search. Please try a different query.",
      });
      return;
    }

    // Enrich results with full post data
    const postMap = new Map(posts.map((p) => [p._id.toString(), p]));
    const postIds = posts.map((p) => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      commentCounts.map((c: { _id: string; count: number }) => [c._id.toString(), c.count])
    );

    const enrichedResults = (parsed.results || [])
      .filter((r: { postId: string }) => postMap.has(r.postId))
      .map((r: { postId: string; relevance: string }) => {
        const post = postMap.get(r.postId)!;
        return {
          post: { ...post, commentCount: countMap.get(r.postId) || 0 },
          relevance: r.relevance,
        };
      });

    const responseData = {
      results: enrichedResults,
      summary: parsed.summary || "",
    };

    // Cache the result
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
