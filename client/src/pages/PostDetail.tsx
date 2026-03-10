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
import "./PostDetail.css";

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

  const sentinelRef = useRef<HTMLDivElement>(null);

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
    } catch {
      setError("Failed to post comment.");
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
    } catch {
      setError("Failed to delete comment.");
    }
  };

  if (loadingPost) {
    return (
      <div className="postdetail-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="postdetail-loading">
        <p className="postdetail-error-text">{error || "Post not found."}</p>
        <button className="postdetail-back-btn" onClick={() => navigate("/")}>
          ← Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="postdetail-container">
      {/* Header */}
      <header className="postdetail-header">
        <button className="postdetail-back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="postdetail-header-title">🍽️ BiteShare</h1>
        <div style={{ width: 70 }} />
      </header>

      <main className="postdetail-main">
        {/* Post Card */}
        <div className="postdetail-post-card">
          <div className="postdetail-post-header">
            <div
              className="postdetail-post-author"
              onClick={() => navigate(`/profile/${post.owner._id}`)}
            >
              {post.owner.profileImage ? (
                <img
                  src={getImageUrl(post.owner.profileImage)}
                  alt={post.owner.username}
                  className="postdetail-author-avatar"
                />
              ) : (
                <div className="postdetail-author-avatar-placeholder">
                  {post.owner.username?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span className="postdetail-author-name">
                {post.owner.username}
              </span>
            </div>
            <span className="postdetail-post-date">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>

          {post.image && (
            <img
              src={getImageUrl(post.image)}
              alt={post.dishName}
              className="postdetail-post-image"
            />
          )}

          <div className="postdetail-post-body">
            <h2 className="postdetail-post-dish">{post.dishName}</h2>
            <p className="postdetail-post-restaurant">📍 {post.restaurant}</p>
            <p className="postdetail-post-desc">{post.description}</p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="postdetail-comments-section">
          <h3 className="postdetail-comments-title">
            💬 Comments ({post.commentCount || 0})
          </h3>

          {/* New Comment Form */}
          <form
            className="postdetail-comment-form"
            onSubmit={handleSubmitComment}
          >
            <div className="postdetail-comment-input-row">
              {user?.profileImage ? (
                <img
                  src={getImageUrl(user.profileImage)}
                  alt={user.username}
                  className="postdetail-comment-avatar"
                />
              ) : (
                <div className="postdetail-comment-avatar-placeholder">
                  {user?.username?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="postdetail-comment-input"
              />
              <button
                type="submit"
                className="postdetail-comment-submit"
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? "..." : "Post"}
              </button>
            </div>
          </form>

          {error && <div className="postdetail-error">{error}</div>}

          {/* Comments List */}
          {initialLoad ? (
            <div className="postdetail-comments-loading">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="postdetail-no-comments">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="postdetail-comments-list">
              {comments.map((comment) => (
                <div key={comment._id} className="postdetail-comment-card">
                  <div className="postdetail-comment-header">
                    <div
                      className="postdetail-comment-author"
                      onClick={() => navigate(`/profile/${comment.owner._id}`)}
                    >
                      {comment.owner.profileImage ? (
                        <img
                          src={getImageUrl(comment.owner.profileImage)}
                          alt={comment.owner.username}
                          className="postdetail-comment-avatar"
                        />
                      ) : (
                        <div className="postdetail-comment-avatar-placeholder">
                          {comment.owner.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <span className="postdetail-comment-author-name">
                        {comment.owner.username}
                      </span>
                    </div>
                    <span className="postdetail-comment-date">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {editingId === comment._id ? (
                    <div className="postdetail-comment-edit">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="postdetail-comment-edit-input"
                      />
                      <div className="postdetail-comment-edit-actions">
                        <button
                          className="postdetail-comment-save-btn"
                          disabled={savingEdit || !editContent.trim()}
                          onClick={() => handleSaveEdit(comment._id)}
                        >
                          {savingEdit ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="postdetail-comment-cancel-btn"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="postdetail-comment-content">
                        {comment.content}
                      </p>

                      {user?._id === comment.owner._id && (
                        <div className="postdetail-comment-actions">
                          <button
                            className="postdetail-comment-action edit"
                            onClick={() => startEdit(comment)}
                          >
                            ✏️ Edit
                          </button>
                          {deletingId === comment._id ? (
                            <div className="postdetail-comment-delete-confirm">
                              <span>Delete?</span>
                              <button
                                className="postdetail-comment-action confirm-yes"
                                onClick={() => handleDelete(comment._id)}
                              >
                                Yes
                              </button>
                              <button
                                className="postdetail-comment-action confirm-no"
                                onClick={() => setDeletingId(null)}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              className="postdetail-comment-action delete"
                              onClick={() => setDeletingId(comment._id)}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="postdetail-sentinel">
                {loadingComments && (
                  <p className="postdetail-loading-more">Loading more...</p>
                )}
                {!loadingComments && page >= totalPages && comments.length > 0 && (
                  <p className="postdetail-end">All comments loaded</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PostDetail;
