import { Router } from "express";
import { aiSearch, reindex } from "../controllers/ai";
import authMiddleware from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/ai/search:
 *   post:
 *     summary: AI-powered RAG search for posts
 *     description: |
 *       Uses Retrieval-Augmented Generation (RAG) to answer natural-language questions based on the app's data.
 *       1. Converts the query to an embedding.
 *       2. Retrieves the top-5 most relevant chunks via cosine similarity.
 *       3. Sends retrieved context + question to Gemini (low temperature) for a grounded answer.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Natural language question about food posts
 *                 example: "What are the best pizza places?"
 *     responses:
 *       200:
 *         description: RAG search result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *                   description: AI-generated answer based only on retrieved context
 *                 sources:
 *                   type: array
 *                   description: Posts that were used to generate the answer
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: string
 *                       dishName:
 *                         type: string
 *                       restaurant:
 *                         type: string
 *       400:
 *         description: Missing query
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: AI search failed
 */
router.post("/search", authMiddleware, aiSearch);

/**
 * @swagger
 * /api/ai/reindex:
 *   post:
 *     summary: Generate embeddings for all existing posts
 *     description: Backfills embeddings for posts that don't have them yet. Processes sequentially to respect API rate limits.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reindex results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 indexed:
 *                   type: number
 *                 skipped:
 *                   type: number
 *                 errors:
 *                   type: number
 *       500:
 *         description: Reindex failed
 */
router.post("/reindex", authMiddleware, reindex);

export default router;
