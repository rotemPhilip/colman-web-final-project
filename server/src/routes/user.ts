import { Router } from "express";
import { getUserById, updateProfile } from "../controllers/user";
import authMiddleware from "../middleware/auth";
import upload from "../middleware/upload";

const router = Router();

router.get("/:id", authMiddleware, getUserById);
router.put("/profile", authMiddleware, upload.single("profileImage"), updateProfile);

export default router;
