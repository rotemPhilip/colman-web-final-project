import request from "supertest";
import app from "../app";
import Embedding from "../models/embedding";
import { buildPostText, splitIntoChunks, cosineSimilarity } from "../services/embedding";

// Mock the Google Generative AI module
jest.mock("@google/generative-ai", () => {
  const mockGenerateContent = jest.fn();
  const mockEmbedContent = jest.fn();
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: ({ model }: { model: string }) => {
        if (model === "gemini-embedding-001") {
          return { embedContent: mockEmbedContent };
        }
        return { generateContent: mockGenerateContent };
      },
    })),
    __mockGenerateContent: mockGenerateContent,
    __mockEmbedContent: mockEmbedContent,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __mockGenerateContent, __mockEmbedContent } = require("@google/generative-ai");

// Helper: generate a deterministic fake embedding vector
function fakeEmbedding(seed: number): number[] {
  const vec = new Array(768).fill(0);
  vec[seed % 768] = 1;
  return vec;
}

let accessToken: string;

async function registerAndLogin(): Promise<{ accessToken: string; userId: string }> {
  const res = await request(app).post("/api/auth/register").send({
    username: "aiuser",
    email: "aiuser@example.com",
    password: "password123",
  });
  return { accessToken: res.body.accessToken, userId: res.body.user._id };
}

async function createPostWithEmbedding(
  token: string,
  dishName: string,
  restaurant: string,
  description: string,
  embeddingSeed: number
) {
  // Mock embedContent for the post creation (one chunk per short post)
  __mockEmbedContent.mockResolvedValueOnce({
    embedding: { values: fakeEmbedding(embeddingSeed) },
  });

  const res = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({ dishName, restaurant, description });

  // Wait for fire-and-forget embedding to complete
  await new Promise((r) => setTimeout(r, 200));

  return res.body;
}

// ─── UNIT TESTS: Embedding Service ──────────────────────────

describe("Embedding Service - Unit Tests", () => {
  describe("buildPostText", () => {
    it("should build text from post fields", () => {
      const text = buildPostText({
        dishName: "Pizza",
        restaurant: "Palace",
        description: "Great pizza",
        owner: { username: "john" },
      });
      expect(text).toContain("Dish: Pizza");
      expect(text).toContain("Restaurant: Palace");
      expect(text).toContain("Description: Great pizza");
      expect(text).toContain("Author: john");
    });

    it("should handle missing optional fields", () => {
      const text = buildPostText({
        dishName: "Burger",
        restaurant: "Grill",
      });
      expect(text).toContain("Dish: Burger");
      expect(text).toContain("Restaurant: Grill");
      expect(text).not.toContain("Description");
      expect(text).not.toContain("Author");
    });
  });

  describe("splitIntoChunks", () => {
    it("should return single chunk for short text", () => {
      const chunks = splitIntoChunks("Short text");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("Short text");
    });

    it("should split long text into multiple chunks", () => {
      const longText = "A".repeat(2000);
      const chunks = splitIntoChunks(longText);
      expect(chunks.length).toBeGreaterThan(1);
      // Each chunk should be ≤ 900 characters
      for (const chunk of chunks) {
        expect(chunk.length).toBeLessThanOrEqual(900);
      }
    });

    it("should produce overlapping chunks", () => {
      // Create text that is clearly more than one chunk
      const longText = "Word. ".repeat(200); // ~1200 chars
      const chunks = splitIntoChunks(longText);
      if (chunks.length >= 2) {
        // Last part of chunk 0 should appear in beginning of chunk 1
        const tail = chunks[0].slice(-50);
        expect(chunks[1]).toContain(tail.trim());
      }
    });
  });

  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const v = fakeEmbedding(1);
      expect(cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it("should return 0 for orthogonal vectors", () => {
      expect(cosineSimilarity(fakeEmbedding(1), fakeEmbedding(2))).toBeCloseTo(0);
    });

    it("should return 0 for zero vectors", () => {
      const zero = new Array(768).fill(0);
      expect(cosineSimilarity(zero, fakeEmbedding(1))).toBe(0);
    });
  });
});

// ─── INTEGRATION TESTS: AI Search API ───────────────────────

describe("AI Search API", () => {
  beforeEach(async () => {
    const auth = await registerAndLogin();
    accessToken = auth.accessToken;
    __mockGenerateContent.mockReset();
    __mockEmbedContent.mockReset();
  });

  // ─── AUTH ─────────────────────────────────────────────────

  describe("POST /api/ai/search - Authentication", () => {
    it("should return 401 without authentication", async () => {
      const res = await request(app)
        .post("/api/ai/search")
        .send({ query: "pizza" });

      expect(res.status).toBe(401);
    });
  });

  // ─── VALIDATION ───────────────────────────────────────────

  describe("POST /api/ai/search - Validation", () => {
    it("should return 400 if query is missing", async () => {
      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Search query is required.");
    });

    it("should return 400 if query is empty string", async () => {
      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: "   " });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Search query is required.");
    });
  });

  // ─── NO EMBEDDINGS ────────────────────────────────────────

  describe("POST /api/ai/search - No data", () => {
    it("should return empty answer when no embeddings exist", async () => {
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(0) },
      });

      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: "pizza" });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBe("No data available to search.");
      expect(res.body.sources).toEqual([]);
    });
  });

  // ─── EMBEDDING CRUD SYNC ─────────────────────────────────

  describe("Embedding sync on Post CRUD", () => {
    it("should create chunk embeddings when a post is created", async () => {
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(1) },
      });

      const postRes = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          dishName: "Pizza",
          restaurant: "Place",
          description: "Great pizza",
        });

      await new Promise((r) => setTimeout(r, 200));

      const emb = await Embedding.findOne({ post: postRes.body._id, chunkIndex: 0 });
      expect(emb).not.toBeNull();
      expect(emb!.embedding).toHaveLength(768);
      expect(emb!.content).toContain("Pizza");
      expect(emb!.chunkIndex).toBe(0);
    });

    it("should delete all chunk embeddings when post is deleted", async () => {
      const post = await createPostWithEmbedding(accessToken, "Sushi", "Tokyo", "Fresh sushi", 2);

      let count = await Embedding.countDocuments({ post: post._id });
      expect(count).toBeGreaterThan(0);

      await request(app)
        .delete(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      count = await Embedding.countDocuments({ post: post._id });
      expect(count).toBe(0);
    });

    it("should update embeddings when a post is updated", async () => {
      const post = await createPostWithEmbedding(accessToken, "Old Dish", "Old Place", "Old desc", 3);

      // Mock embedding for the update
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(4) },
      });

      await request(app)
        .put(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ dishName: "New Dish", description: "New description" });

      await new Promise((r) => setTimeout(r, 200));

      const emb = await Embedding.findOne({ post: post._id, chunkIndex: 0 });
      expect(emb).not.toBeNull();
      expect(emb!.content).toContain("New Dish");
    });
  });

  // ─── SUCCESSFUL RAG SEARCH ────────────────────────────────

  describe("POST /api/ai/search - Full RAG flow", () => {
    let postId: string;

    beforeEach(async () => {
      const post = await createPostWithEmbedding(
        accessToken, "Margherita Pizza", "Pizza Palace",
        "Amazing classic pizza with fresh mozzarella", 1
      );
      postId = post._id;

      await createPostWithEmbedding(
        accessToken, "Chocolate Cake", "Sweet Dreams Bakery",
        "Rich chocolate layer cake", 2
      );

      await createPostWithEmbedding(
        accessToken, "Caesar Salad", "Green Garden",
        "Fresh and crispy salad", 3
      );
    });

    it("should return structured { answer, sources } from RAG pipeline", async () => {
      // Mock query embedding — matches pizza post (seed 1)
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(1) },
      });

      __mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              answer: "Pizza Palace serves an amazing Margherita Pizza with fresh mozzarella.",
              sources: [1],
            }),
        },
      });

      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: "best pizza?" });

      expect(res.status).toBe(200);
      expect(res.body.answer).toContain("Pizza Palace");
      expect(res.body.sources).toHaveLength(1);
      expect(res.body.sources[0].postId).toBe(postId);
      expect(res.body.sources[0].dishName).toBe("Margherita Pizza");
      expect(res.body.sources[0].restaurant).toBe("Pizza Palace");
    });

    it("should return answer with no sources when AI finds no relevant data", async () => {
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(1) },
      });

      __mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              answer: "I couldn't find any sushi-related posts in the data.",
              sources: [],
            }),
        },
      });

      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: "sushi" });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.sources).toEqual([]);
    });

    it("should deduplicate sources from the same post", async () => {
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(1) },
      });

      __mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              answer: "Found relevant results.",
              sources: [1, 1], // duplicate source index
            }),
        },
      });

      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: "food" });

      expect(res.status).toBe(200);
      // Should be deduplicated
      const postIds = res.body.sources.map((s: { postId: string }) => s.postId);
      const unique = new Set(postIds);
      expect(postIds.length).toBe(unique.size);
    });
  });

  // ─── ERROR HANDLING ───────────────────────────────────────

  describe("POST /api/ai/search - Error handling", () => {
    beforeEach(async () => {
      await createPostWithEmbedding(accessToken, "Test Dish", "Test Place", "Test description", 5);
    });

    it("should handle unparseable AI response gracefully", async () => {
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(5) },
      });

      __mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => "This is not valid JSON at all",
        },
      });

      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: "unparseable test query" });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBe("Could not process search. Please try a different query.");
      expect(res.body.sources).toEqual([]);
    });

    it("should return 500 when AI service throws an error", async () => {
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(5) },
      });

      __mockGenerateContent.mockRejectedValueOnce(new Error("Service unavailable"));

      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: "error test query" });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("AI search failed. Please try again.");
    });

    it("should return 429 when AI service returns rate limit error", async () => {
      __mockEmbedContent.mockResolvedValueOnce({
        embedding: { values: fakeEmbedding(5) },
      });

      const error = new Error("Rate limited") as Error & { status: number };
      error.status = 429;
      __mockGenerateContent.mockRejectedValueOnce(error);

      const res = await request(app)
        .post("/api/ai/search")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ query: "rate limit test query" });

      expect(res.status).toBe(429);
      expect(res.body.message).toBe("AI is busy right now. Please wait a few seconds and try again.");
    });
  });
});
