import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user";
import { AuthRequest } from "../middleware/auth";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate tokens
const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRATION || "15m") as string,
  } as jwt.SignOptions);
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRATION || "7d") as string,
  } as jwt.SignOptions);
};

// Register
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: "All fields are required." });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "Email already in use." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const profileImage = req.file
      ? `/uploads/${req.file.filename}`
      : "";

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      profileImage,
    });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokens = [refreshToken];
    await user.save();

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: "Username and password are required." });
      return;
    }

    const user = await User.findOne({ username });
    if (!user || !user.password) {
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Google Sign-In
export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { credential } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ message: "Invalid Google token." });
      return;
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        username: payload.name || payload.email,
        email: payload.email,
        profileImage: payload.picture || "",
        googleId: payload.sub,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      await user.save();
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokens.push(refreshToken);
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Refresh Token
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ message: "Refresh token is required." });
      return;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET as string
      ) as { userId: string };
    } catch {
      res.status(403).json({ message: "Invalid refresh token." });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(token)) {
      // possible token theft — clear all refresh tokens
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }
      res.status(403).json({ message: "Invalid refresh token." });
      return;
    }

    // Remove old token and issue new pair
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ message: "Refresh token is required." });
      return;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET as string
      ) as { userId: string };
    } catch {
      // Even if token is expired, try to find and remove it
      res.status(200).json({ message: "Logged out." });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
      await user.save();
    }

    res.json({ message: "Logged out." });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get current user
export const getMe = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("-password -refreshTokens");
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
