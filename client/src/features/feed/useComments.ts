import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { useAuth } from "../../context/useAuth";
import {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from "../../services/comment.service";
import { useToast } from "../../hooks/useToast";

const PAGE_SIZE = 20;

export const useComments = (
  postId: string,
  open: boolean,
  onCountChange?: (delta: number) => void
) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentEdit, setCommentEdit] = useState<{ id: string | null; saving: boolean }>({
    id: null,
    saving: false,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  const fetchComments = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      try {
        const result = await getCommentsByPost(postId, pageNum, PAGE_SIZE);
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
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [postId]
  );

  // Lazy load — only fetch on first open
  useEffect(() => {
    if (open && !hasLoaded.current) {
      hasLoaded.current = true;
      fetchComments(1, false);
    }
  }, [open, fetchComments]);

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !open) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages) {
          fetchComments(page + 1, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, page, totalPages, loading, fetchComments]);

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const comment = await createComment(postId, newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      onCountChange?.(1);
      showToast("Comment posted!");
    } catch {
      setError("Failed to post comment.");
      showToast("Failed to post comment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment: Comment) =>
    setCommentEdit({ id: comment._id, saving: false });

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
      onCountChange?.(-1);
      showToast("Comment deleted.");
    } catch {
      setError("Failed to delete comment.");
      showToast("Failed to delete comment.", "error");
    }
  };

  return {
    user,
    comments,
    page,
    totalPages,
    loading,
    initialLoad,
    newComment,
    submitting,
    commentEdit,
    deletingId,
    error,
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
