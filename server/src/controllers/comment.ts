import { Response } from "express";
import Comment from "../models/comment";
import Post from "../models/post";
import { AuthRequest } from "../middleware/auth";

// Create a comment on a post
export const createComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ message: "Comment content is required." });
      return;
    }

    // Verify the post exists
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found." });
      return;
    }

    const comment = await Comment.create({
      content: content.trim(),
      post: postId,
      owner: req.userId,
    });

    const populated = await comment.populate("owner", "username profileImage");

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Get comments for a post (with pagination)
export const getCommentsByPost = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ post: postId })
        .populate("owner", "username profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ post: postId }),
    ]);

    res.json({ comments, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Update a comment (only owner)
export const updateComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ message: "Comment content is required." });
      return;
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found." });
      return;
    }

    if (comment.owner.toString() !== req.userId) {
      res.status(403).json({ message: "Not authorized." });
      return;
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await comment.populate("owner", "username profileImage");

    res.json(populated);
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Delete a comment (only owner)
export const deleteComment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found." });
      return;
    }

    if (comment.owner.toString() !== req.userId) {
      res.status(403).json({ message: "Not authorized." });
      return;
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted." });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "Server error." });
  }
};
