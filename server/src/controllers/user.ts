import { Response } from "express";
import User from "../models/user";
import { AuthRequest } from "../middleware/auth";

// Get user profile by ID
export const getUserById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password -refreshTokens");
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Update profile (username + profile image only)
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const { username, removeImage } = req.body;

    if (username && username.trim()) {
      user.username = username.trim();
    }

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    } else if (removeImage === "true") {
      user.profileImage = "";
    }

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
