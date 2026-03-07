import { Response } from "express";
import Post from "../models/post";
import { AuthRequest } from "../middleware/auth";

// Create a post
export const createPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { dishName, restaurant, description } = req.body;

    if (!dishName || !restaurant || !description) {
      res.status(400).json({ message: "Dish name, restaurant, and description are required." });
      return;
    }

    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const post = await Post.create({
      dishName,
      restaurant,
      description,
      image,
      owner: req.userId,
    });

    const populated = await post.populate("owner", "username profileImage");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get posts by user ID
export const getPostsByUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ owner: userId })
      .populate("owner", "username profileImage")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Get posts by user error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get all posts
export const getAllPosts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const posts = await Post.find()
      .populate("owner", "username profileImage")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Get all posts error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Update a post
export const updatePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { dishName, restaurant, description } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ message: "Post not found." });
      return;
    }

    if (post.owner.toString() !== req.userId) {
      res.status(403).json({ message: "Not authorized." });
      return;
    }

    if (dishName) post.dishName = dishName;
    if (restaurant) post.restaurant = restaurant;
    if (description) post.description = description;
    if (req.file) post.image = `/uploads/${req.file.filename}`;

    await post.save();
    const populated = await post.populate("owner", "username profileImage");

    res.json(populated);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Delete a post
export const deletePost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ message: "Post not found." });
      return;
    }

    if (post.owner.toString() !== req.userId) {
      res.status(403).json({ message: "Not authorized." });
      return;
    }

    await post.deleteOne();
    res.json({ message: "Post deleted." });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
