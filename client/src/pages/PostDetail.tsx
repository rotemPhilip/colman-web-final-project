import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from "../services/comment.service";
import { getPostById, type Post } from "../services/post.service";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const COMMENTS_PAGE_SIZE = 20;

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Post data
  const [post, setPost] = useState<Post | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingComments, setLoadingComments] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // New comment
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit comment
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getImageUrl = (img?: string) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `${API_URL}${img}`;
  };

  // Load the post
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

  // Load comments
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

  useEffect(() => {
    fetchComments(1, false);
  }, [fetchComments]);

  // Infinite scroll for comments
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

  // Submit new comment
  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;
    setSubmitting(true);
    setError("");
    try {
      const comment = await createComment(postId, newComment.trim());
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      // Update local comment count
      setPost((prev) => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
      showToast("Comment posted!");
    } catch {
      setError("Failed to post comment.");
      showToast("Failed to post comment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const startEdit = (comment: Comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    setSavingEdit(true);
    setError("");
    try {
      const updated = await updateComment(commentId, editContent.trim());
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updated : c))
      );
      cancelEdit();
    } catch {
      setError("Failed to update comment.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete comment
  const handleDelete = async (commentId: string) => {
    setDeletingId(null);
    setError("");
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      // Update local comment count
      setPost((prev) => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 1) - 1) } : prev);
      showToast("Comment deleted.");
    } catch {
      setError("Failed to delete comment.");
      showToast("Failed to delete comment.", "error");
    }
  };

  if (loadingPost) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted small mt-2">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light gap-3 animate-fade-in">
        <i className="bi bi-file-earmark-x text-muted" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
        <p className="text-danger">{error || "Post not found."}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          <i className="bi bi-arrow-left me-1"></i>Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Toast */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <i className={`bi ${toast.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"} me-2`}></i>
          {toast.message}
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar navbar-expand navbar-light bg-white shadow-sm sticky-top">
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)} title="Go back">
              <i className="bi bi-arrow-left"></i>
            </button>
            <span className="navbar-brand fw-bold text-primary mb-0 h1 fs-4 cursor-pointer d-flex align-items-center" onClick={() => navigate("/")}>
              <img src="/favicon.svg" alt="" width="28" height="28" className="me-2" />
              BiteShare
            </span>
          </div>
          <div style={{ width: 1 }} />
        </div>
      </nav>

      <main className="container pb-5" style={{ maxWidth: 640 }}>
        <div className="py-4">
          {/* Post Card */}
          <div className="card border-0 shadow-sm overflow-hidden mb-4 animate-fade-in">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-2 px-3">
              <div
                className="d-flex align-items-center gap-2 cursor-pointer"
                onClick={() => navigate(`/profile/${post.owner._id}`)}
              >
                {post.owner.profileImage ? (
                  <img
                    src={getImageUrl(post.owner.profileImage)}
                    alt={post.owner.username}
                    className="avatar-circle-sm"
                  />
                ) : (
                  <div className="avatar-placeholder avatar-placeholder-sm">
                    {post.owner.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <span className="fw-semibold small d-block">{post.owner.username}</span>
                  <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </small>
                </div>
              </div>
            </div>

            {post.image && (
              <img
                src={getImageUrl(post.image)}
                alt={post.dishName}
                className="card-img-top"
                style={{ maxHeight: 450, objectFit: "cover" }}
              />
            )}

            <div className="card-body">
              <h5 className="card-title fw-bold mb-1">{post.dishName}</h5>
              <p className="text-primary small fw-semibold mb-2">
                <i className="bi bi-geo-alt-fill me-1"></i>{post.restaurant}
              </p>
              <p className="card-text text-muted">{post.description}</p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="card border-0 shadow-sm animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="card-header bg-white px-3">
              <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots text-primary"></i>
                Comments ({post.commentCount || 0})
              </h6>
            </div>

            <div className="card-body px-3">
              {/* New Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-4">
                <div className="d-flex gap-2">
                  {user?.profileImage ? (
                    <img
                      src={getImageUrl(user.profileImage)}
                      alt={user.username}
                      className="avatar-circle-sm flex-shrink-0 mt-1"
                    />
                  ) : (
                    <div className="avatar-placeholder avatar-placeholder-sm flex-shrink-0 mt-1">
                      {user?.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-grow-1">
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="form-control"
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting || !newComment.trim()}
                      >
                        {submitting ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="bi bi-send"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              {/* Comments List */}
              {initialLoad ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-chat text-muted" style={{ fontSize: "2rem", opacity: 0.3 }}></i>
                  <p className="text-muted small mt-2 mb-0">No comments yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {comments.map((comment) => {
                    const isOwn = user?._id === comment.owner._id;
                    return (
                      <div key={comment._id} className="d-flex gap-2 animate-fade-in">
                        <div
                          className="flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/profile/${comment.owner._id}`)}
                        >
                          {comment.owner.profileImage ? (
                            <img
                              src={getImageUrl(comment.owner.profileImage)}
                              alt={comment.owner.username}
                              className="avatar-circle-sm"
                            />
                          ) : (
                            <div className="avatar-placeholder avatar-placeholder-sm">
                              {comment.owner.username?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className={`comment-bubble ${isOwn ? "own-comment" : ""}`}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span
                                className="fw-semibold small cursor-pointer"
                                onClick={() => navigate(`/profile/${comment.owner._id}`)}
                              >
                                {comment.owner.username}
                              </span>
                              <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </small>
                            </div>

                            {editingId === comment._id ? (
                              <div className="animate-fade-in">
                                <input
                                  type="text"
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="form-control form-control-sm mb-2"
                                  autoFocus
                                />
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-primary btn-sm py-0 px-2"
                                    disabled={savingEdit || !editContent.trim()}
                                    onClick={() => handleSaveEdit(comment._id)}
                                  >
                                    {savingEdit ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      <><i className="bi bi-check-lg me-1"></i>Save</>
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-light btn-sm py-0 px-2"
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="mb-0 small">{comment.content}</p>
                            )}
                          </div>

                          {/* Action buttons below bubble */}
                          {isOwn && editingId !== comment._id && (
                            <div className="d-flex gap-3 mt-1 ms-2">
                              <button
                                className="btn btn-link btn-sm text-muted text-decoration-none p-0"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => startEdit(comment)}
                              >
                                <i className="bi bi-pencil me-1"></i>Edit
                              </button>
                              {deletingId === comment._id ? (
                                <div className="d-flex align-items-center gap-2 animate-fade-in">
                                  <span className="text-danger" style={{ fontSize: "0.75rem" }}>Delete?</span>
                                  <button
                                    className="btn btn-danger btn-sm py-0 px-2"
                                    style={{ fontSize: "0.75rem" }}
                                    onClick={() => handleDelete(comment._id)}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    className="btn btn-light btn-sm py-0 px-2"
                                    style={{ fontSize: "0.75rem" }}
                                    onClick={() => setDeletingId(null)}
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn btn-link btn-sm text-danger text-decoration-none p-0"
                                  style={{ fontSize: "0.75rem" }}
                                  onClick={() => setDeletingId(comment._id)}
                                >
                                  <i className="bi bi-trash me-1"></i>Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Sentinel for infinite scroll */}
                  <div ref={sentinelRef} className="text-center py-2">
                    {loadingComments && (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    )}
                    {!loadingComments && page >= totalPages && comments.length > 0 && (
                      <small className="text-muted">All comments loaded</small>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;
