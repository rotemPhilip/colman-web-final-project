import { Router } from "express";
import {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
} from "../controllers/auth";
import authMiddleware from "../middleware/auth";
import upload from "../middleware/upload";

const router = Router();

router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", authMiddleware, getMe);

export default router;
