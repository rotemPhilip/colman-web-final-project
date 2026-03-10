import { Response } from "express";
import Post from "../models/post";
import Comment from "../models/comment";
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

// Get a single post by ID
export const getPostById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate("owner", "username profileImage");
    if (!post) {
      res.status(404).json({ message: "Post not found." });
      return;
    }
    const commentCount = await Comment.countDocuments({ post: post._id });
    res.json({ ...post.toObject(), commentCount });
  } catch (err) {
    console.error("Get post by id error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get posts by user ID (with pagination)
export const getPostsByUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ owner: userId })
        .populate("owner", "username profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ owner: userId }),
    ]);

    // Attach comment counts
    const postIds = posts.map((p) => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));
    const postsWithComments = posts.map((p) => ({
      ...p.toObject(),
      commentCount: countMap.get(p._id.toString()) || 0,
    }));

    res.json({ posts: postsWithComments, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Get posts by user error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get all posts (with pagination)
export const getAllPosts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .populate("owner", "username profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(),
    ]);

    // Attach comment counts
    const postIds = posts.map((p) => p._id);
    const commentCounts = await Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(commentCounts.map((c) => [c._id.toString(), c.count]));
    const postsWithComments = posts.map((p) => ({
      ...p.toObject(),
      commentCount: countMap.get(p._id.toString()) || 0,
    }));

    res.json({ posts: postsWithComments, total, page, pages: Math.ceil(total / limit) });
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

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();
    res.json({ message: "Post deleted." });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
