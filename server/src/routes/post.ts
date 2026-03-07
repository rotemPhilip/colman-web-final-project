import { Router } from "express";
import {
  createPost,
  getAllPosts,
  getPostsByUser,
  updatePost,
  deletePost,
} from "../controllers/post";
import authMiddleware from "../middleware/auth";
import upload from "../middleware/upload";

const router = Router();

router.post("/", authMiddleware, upload.single("image"), createPost);
router.get("/", authMiddleware, getAllPosts);
router.get("/user/:userId", authMiddleware, getPostsByUser);
router.put("/:id", authMiddleware, upload.single("image"), updatePost);
router.delete("/:id", authMiddleware, deletePost);

export default router;
