import { Router } from "express";
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
} from "../controllers/comment";
import authMiddleware from "../middleware/auth";

const router = Router();

// POST   /api/comments/:postId        — create comment on a post
router.post("/:postId", authMiddleware, createComment);

// GET    /api/comments/:postId        — get comments for a post (paginated)
router.get("/:postId", authMiddleware, getCommentsByPost);

// PUT    /api/comments/:commentId     — update own comment
router.put("/:commentId", authMiddleware, updateComment);

// DELETE /api/comments/:commentId     — delete own comment
router.delete("/:commentId", authMiddleware, deleteComment);

export default router;
