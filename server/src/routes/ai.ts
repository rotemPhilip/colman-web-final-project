import { Router } from "express";
import { aiSearch } from "../controllers/ai";
import authMiddleware from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/ai/search:
 *   post:
 *     summary: AI-powered smart search for posts
 *     description: Uses Google Gemini to find and rank posts relevant to a free-text query. Supports natural language in any language.
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
 *                 description: Free-text search query
 *                 example: "best pasta in town"
 *     responses:
 *       200:
 *         description: AI search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       post:
 *                         $ref: '#/components/schemas/Post'
 *                       relevance:
 *                         type: string
 *                         description: AI explanation of why this post matches
 *                 summary:
 *                   type: string
 *                   description: AI-generated summary of the search results
 *       400:
 *         description: Missing query
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: AI search failed
 */
router.post("/search", authMiddleware, aiSearch);

export default router;
