import { GoogleGenAI } from "@google/genai";
import Embedding, { IEmbedding } from "../models/embedding";
import Post, { IPost } from "../models/post";
import mongoose from "mongoose";

let genAI: GoogleGenAI | null = null;
const getGenAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY || "";
    console.log("[Embedding] Using GEMINI_API_KEY:", key ? `${key.slice(0, 8)}...${key.slice(-4)}` : "MISSING");
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

const CHUNK_SIZE = 900; // target ~800-1000 characters per chunk
const CHUNK_OVERLAP = 100; // overlap between chunks for context continuity

// ── Text preparation ────────────────────────────────────────

/**
 * Build the full searchable text from a post's fields.
 */
export const buildPostText = (post: {
  dishName: string;
  restaurant: string;
  description?: string;
  owner?: { username?: string } | mongoose.Types.ObjectId | string;
}): string => {
  const author =
    typeof post.owner === "object" && post.owner !== null && "username" in post.owner
      ? (post.owner as { username?: string }).username
      : undefined;
  const parts = [
    `Dish: ${post.dishName}`,
    `Restaurant: ${post.restaurant}`,
    post.description ? `Description: ${post.description}` : "",
    author ? `Author: ${author}` : "",
  ];
  return parts.filter(Boolean).join(". ");
};

/**
 * Split text into overlapping chunks of ~CHUNK_SIZE characters.
 * Tries to break on sentence boundaries when possible.
 */
export const splitIntoChunks = (text: string): string[] => {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    // Try to break at a sentence boundary (. ! ?) within the last 20% of the chunk
    if (end < text.length) {
      const lookback = Math.floor(CHUNK_SIZE * 0.2);
      const searchStart = end - lookback;
      const segment = text.slice(searchStart, end);
      const sentenceEnd = segment.search(/[.!?]\s/);
      if (sentenceEnd !== -1) {
        end = searchStart + sentenceEnd + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
    // Avoid infinite loop on tiny remaining text
    if (end >= text.length) break;
  }

  return chunks.filter((c) => c.length > 0);
};

// ── Embedding generation ────────────────────────────────────

/**
 * Call Gemini embedding API for a single text.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const result = await getGenAI().models.embedContent({ model: "gemini-embedding-001", contents: text });
    return result.embeddings?.[0]?.values ?? [];
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    const message = (err as { message?: string }).message ?? String(err);
    console.error(`[Embedding] generateEmbedding failed — status: ${status ?? "unknown"}, message: ${message}`);
    throw err;
  }
};

// ── Post embedding CRUD ─────────────────────────────────────

/**
 * Create or update all chunk embeddings for a post.
 * 1. Build text from post fields
 * 2. Split into chunks
 * 3. Generate embedding for each chunk
 * 4. Upsert each chunk, remove stale chunks
 */
export const upsertPostEmbedding = async (
  post: IPost & { owner?: { username?: string } | mongoose.Types.ObjectId }
): Promise<void> => {
  const text = buildPostText(post);
  const chunks = splitIntoChunks(text);

  // Generate embeddings for all chunks
  const embeddings = await Promise.all(chunks.map((chunk) => generateEmbedding(chunk)));

  // Upsert each chunk
  const ops = chunks.map((content, i) => ({
    updateOne: {
      filter: { post: post._id, chunkIndex: i },
      update: { content, embedding: embeddings[i] },
      upsert: true,
    },
  }));

  if (ops.length > 0) {
    await Embedding.bulkWrite(ops);
  }

  // Remove any stale chunks from a previous version that had more chunks
  await Embedding.deleteMany({ post: post._id, chunkIndex: { $gte: chunks.length } });
};

/**
 * Delete all embeddings for a post.
 */
export const deletePostEmbedding = async (
  postId: mongoose.Types.ObjectId | string
): Promise<void> => {
  await Embedding.deleteMany({ post: postId });
};

// ── Vector search ───────────────────────────────────────────

/**
 * Cosine similarity between two vectors.
 */
export const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

export interface ChunkMatch {
  postId: string;
  chunkIndex: number;
  content: string;
  score: number;
}

/**
 * Find the top-K most similar chunks to a query using cosine similarity.
 * Returns chunks sorted by descending similarity score.
 */
export const findSimilarChunks = async (
  queryText: string,
  limit = 5
): Promise<ChunkMatch[]> => {
  const queryEmbedding = await generateEmbedding(queryText);

  const allEmbeddings = await Embedding.find().lean();
  if (allEmbeddings.length === 0) return [];

  const scored: ChunkMatch[] = allEmbeddings.map((emb) => ({
    postId: emb.post.toString(),
    chunkIndex: emb.chunkIndex,
    content: emb.content,
    score: cosineSimilarity(queryEmbedding, emb.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
};

// ── Backfill / Reindex ──────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Generate embeddings for all posts that don't have one yet.
 * Processes sequentially with delays to respect API rate limits.
 */
export const reindexAllPosts = async (): Promise<{ indexed: number; skipped: number; errors: number }> => {
  const posts = await Post.find().populate("owner", "username profileImage").lean();
  const existingPostIds = new Set(
    (await Embedding.distinct("post")).map((id: mongoose.Types.ObjectId) => id.toString())
  );

  let indexed = 0;
  let skipped = 0;
  let errors = 0;

  for (const post of posts) {
    if (existingPostIds.has(post._id.toString())) {
      skipped++;
      continue;
    }
    try {
      await upsertPostEmbedding(post as unknown as IPost & { owner?: { username?: string } });
      indexed++;
      console.log(`[Embedding] Indexed post ${post._id} (${post.dishName})`);
      // Wait 3 seconds between posts to stay within free-tier rate limits
      await delay(3000);
    } catch (err) {
      errors++;
      console.error(`[Embedding] Failed to index post ${post._id}:`, err);
      // On rate limit, wait longer before retrying next post
      await delay(10000);
    }
  }

  return { indexed, skipped, errors };
};
