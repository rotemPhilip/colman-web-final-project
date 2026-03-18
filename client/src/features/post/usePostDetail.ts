import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from "../../services/comment.service";
import { getPostById, type Post } from "../../services/post.service";
import { useToast } from "../../hooks/useToast";

const COMMENTS_PAGE_SIZE = 20;

export const usePostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingComments, setLoadingComments] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [commentEdit, setCommentEdit] = useState<{ id: string | null; saving: boolean }>({ id: null, saving: false });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      setLoadingPost(true);
      try {
        const found = await getPostById(postId);
        setPost(found);
      } catch {
        setError("Post not found.");
      } finally {
        setLoadingPost(false);
      }
    };
    fetchPost();
  }, [postId]);

  const fetchComments = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!postId) return;
      setLoadingComments(true);
      try {
        const result = await getCommentsByPost(postId, pageNum, COMMENTS_PAGE_SIZE);
        if (append) {
          setComments((prev) => [...prev, ...result.comments]);
        } else {
          setComments(result.comments);
        }
        setTotalPages(result.pages);
        setPage(pageNum);
      } catch {
        setError("Failed to load comments.");
      } finally {
        setLoadingComments(false);
        setInitialLoad(false);
      }
    },
    [postId]
  );

  useEffect(() => { fetchComments(1, false); }, [fetchComments]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingComments && page < totalPages) {
          fetchComments(page + 1, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loadingComments, fetchComments]);

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;
    setSubmitting(true);
    setError("");
    try {
      const comment = await createComment(postId, newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      setPost((prev) => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
      showToast("Comment posted!");
    } catch {
      setError("Failed to post comment.");
      showToast("Failed to post comment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment: Comment) => setCommentEdit({ id: comment._id, saving: false });

  const cancelEdit = () => setCommentEdit({ id: null, saving: false });

  const handleSaveEdit = async (commentId: string, content: string) => {
    if (!content.trim()) return;
    setCommentEdit((prev) => ({ ...prev, saving: true }));
    setError("");
    try {
      const updated = await updateComment(commentId, content.trim());
      setComments((prev) => prev.map((c) => (c._id === commentId ? updated : c)));
      cancelEdit();
    } catch {
      setError("Failed to update comment.");
    } finally {
      setCommentEdit((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(null);
    setError("");
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setPost((prev) =>
        prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 1) - 1) } : prev
      );
      showToast("Comment deleted.");
    } catch {
      setError("Failed to delete comment.");
      showToast("Failed to delete comment.", "error");
    }
  };

  return {
    user,
    post,
    loadingPost,
    comments,
    page,
    totalPages,
    loadingComments,
    initialLoad,
    newComment,
    submitting,
    commentEdit,
    deletingId,
    error,
    toast,
    sentinelRef,
    setNewComment,
    setDeletingId,
    handleSubmitComment,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    handleDeleteComment,
  };
};
