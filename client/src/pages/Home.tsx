import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import {
  getAllPosts,
  getPostsByUser,
  createPost,
  updatePost,
  deletePost,
  type Post,
} from "../services/post.service";
import "./Home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const PAGE_SIZE = 6;

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Filter: "all" or "mine"
  const [filter, setFilter] = useState<"all" | "mine">("all");

  // Create post
  const [showCreate, setShowCreate] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newRestaurant, setNewRestaurant] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState("");
  const [creating, setCreating] = useState(false);
  const newImageRef = useRef<HTMLInputElement>(null);

  // Edit post
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDishName, setEditDishName] = useState("");
  const [editRestaurant, setEditRestaurant] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const editImageRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Error
  const [error, setError] = useState("");

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  const getImageUrl = (img?: string) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `${API_URL}${img}`;
  };

  // Fetch posts
  const fetchPosts = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoadingFeed(true);
      setError("");
      try {
        const result =
          filter === "mine" && user
            ? await getPostsByUser(user._id, pageNum, PAGE_SIZE)
            : await getAllPosts(pageNum, PAGE_SIZE);

        if (append) {
          setPosts((prev) => [...prev, ...result.posts]);
        } else {
          setPosts(result.posts);
        }
        setTotalPages(result.pages);
        setPage(pageNum);
      } catch {
        setError("Failed to load posts.");
      } finally {
        setLoadingFeed(false);
        setInitialLoad(false);
      }
    },
    [filter, user]
  );

  // Initial load & filter change
  useEffect(() => {
    setPage(1);
    setPosts([]);
    setInitialLoad(true);
    fetchPosts(1, false);
  }, [filter, fetchPosts]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingFeed && page < totalPages) {
          fetchPosts(page + 1, true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loadingFeed, fetchPosts]);

  // ---- Create Post ----
  const handleNewImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim() || !newRestaurant.trim() || !newDescription.trim())
      return;
    setCreating(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("dishName", newDishName.trim());
      fd.append("restaurant", newRestaurant.trim());
      fd.append("description", newDescription.trim());
      if (newImage) fd.append("image", newImage);
      const post = await createPost(fd);
      setPosts((prev) => [post, ...prev]);
      resetCreateForm();
    } catch {
      setError("Failed to create post.");
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setShowCreate(false);
    setNewDishName("");
    setNewRestaurant("");
    setNewDescription("");
    setNewImage(null);
    setNewImagePreview("");
  };

  // ---- Edit Post ----
  const startEdit = (post: Post) => {
    setEditingId(post._id);
    setEditDishName(post.dishName);
    setEditRestaurant(post.restaurant);
    setEditDescription(post.description);
    setEditImage(null);
    setEditImagePreview(post.image ? getImageUrl(post.image) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditImage(null);
    setEditImagePreview("");
  };

  const handleEditImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditSave = async (postId: string) => {
    if (!editDishName.trim() || !editRestaurant.trim() || !editDescription.trim())
      return;
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("dishName", editDishName.trim());
      fd.append("restaurant", editRestaurant.trim());
      fd.append("description", editDescription.trim());
      if (editImage) fd.append("image", editImage);
      const updated = await updatePost(postId, fd);
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
      cancelEdit();
    } catch {
      setError("Failed to update post.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete Post ----
  const handleDelete = async (postId: string) => {
    setDeletingId(null);
    setError("");
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      setError("Failed to delete post.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <h1>🍽️ BiteShare</h1>
        <div className="home-user">
          <button
            onClick={() => navigate(`/profile/${user?._id}`)}
            className="profile-link-btn"
          >
            👤 My Profile
          </button>
          <span className="home-welcome">Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="home-main">
        {/* Toolbar: filter + create */}
        <div className="feed-toolbar">
          <div className="feed-filters">
            <button
              className={`feed-filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Posts
            </button>
            <button
              className={`feed-filter-btn ${filter === "mine" ? "active" : ""}`}
              onClick={() => setFilter("mine")}
            >
              My Posts
            </button>
          </div>
          <button
            className="feed-create-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "✕ Cancel" : "+ New Post"}
          </button>
        </div>

        {/* Error */}
        {error && <div className="feed-error">{error}</div>}

        {/* Create Post Form */}
        {showCreate && (
          <form className="feed-create-form" onSubmit={handleCreate}>
            <h3 className="feed-create-title">Share a dining experience</h3>
            <input
              type="text"
              placeholder="Dish name"
              value={newDishName}
              onChange={(e) => setNewDishName(e.target.value)}
              className="feed-input"
            />
            <input
              type="text"
              placeholder="Restaurant name"
              value={newRestaurant}
              onChange={(e) => setNewRestaurant(e.target.value)}
              className="feed-input"
            />
            <textarea
              placeholder="Describe your experience..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="feed-textarea"
              rows={3}
            />
            <div className="feed-image-section">
              {newImagePreview && (
                <img
                  src={newImagePreview}
                  alt="Preview"
                  className="feed-image-preview"
                />
              )}
              <button
                type="button"
                className="feed-image-btn"
                onClick={() => newImageRef.current?.click()}
              >
                📷 {newImage ? "Change Photo" : "Add Photo"}
              </button>
              <input
                ref={newImageRef}
                type="file"
                accept="image/*"
                onChange={handleNewImageChange}
                hidden
              />
            </div>
            <div className="feed-form-actions">
              <button
                type="submit"
                className="feed-submit-btn"
                disabled={
                  creating ||
                  !newDishName.trim() ||
                  !newRestaurant.trim() ||
                  !newDescription.trim()
                }
              >
                {creating ? "Posting..." : "Post"}
              </button>
              <button
                type="button"
                className="feed-cancel-btn"
                onClick={resetCreateForm}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Feed */}
        {initialLoad ? (
          <div className="feed-loading">Loading feed...</div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <p>
              {filter === "mine"
                ? "You haven't shared anything yet."
                : "No posts yet. Be the first to share!"}
            </p>
            {!showCreate && (
              <button
                className="feed-create-btn"
                onClick={() => setShowCreate(true)}
              >
                + Create Post
              </button>
            )}
          </div>
        ) : (
          <div className="feed-list">
            {posts.map((post) => (
              <div key={post._id} className="feed-card">
                {/* Card header - Owner info */}
                <div className="feed-card-header">
                  <div
                    className="feed-card-author"
                    onClick={() => navigate(`/profile/${post.owner._id}`)}
                  >
                    {post.owner.profileImage ? (
                      <img
                        src={getImageUrl(post.owner.profileImage)}
                        alt={post.owner.username}
                        className="feed-author-avatar"
                      />
                    ) : (
                      <div className="feed-author-avatar-placeholder">
                        {post.owner.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="feed-author-name">
                      {post.owner.username}
                    </span>
                  </div>
                  <span className="feed-card-date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Editing mode */}
                {editingId === post._id ? (
                  <div className="feed-card-edit">
                    <input
                      type="text"
                      value={editDishName}
                      onChange={(e) => setEditDishName(e.target.value)}
                      className="feed-input"
                      placeholder="Dish name"
                    />
                    <input
                      type="text"
                      value={editRestaurant}
                      onChange={(e) => setEditRestaurant(e.target.value)}
                      className="feed-input"
                      placeholder="Restaurant name"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="feed-textarea"
                      placeholder="Description"
                      rows={3}
                    />
                    <div className="feed-image-section">
                      {editImagePreview && (
                        <img
                          src={editImagePreview}
                          alt="Preview"
                          className="feed-image-preview"
                        />
                      )}
                      <button
                        type="button"
                        className="feed-image-btn"
                        onClick={() => editImageRef.current?.click()}
                      >
                        📷 {editImage ? "Change Photo" : "Update Photo"}
                      </button>
                      <input
                        ref={editImageRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        hidden
                      />
                    </div>
                    <div className="feed-form-actions">
                      <button
                        className="feed-submit-btn"
                        disabled={saving}
                        onClick={() => handleEditSave(post._id)}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button className="feed-cancel-btn" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Post image */}
                    {post.image && (
                      <img
                        src={getImageUrl(post.image)}
                        alt={post.dishName}
                        className="feed-card-image"
                      />
                    )}

                    {/* Post content */}
                    <div className="feed-card-body">
                      <h3 className="feed-card-dish">{post.dishName}</h3>
                      <p className="feed-card-restaurant">
                        📍 {post.restaurant}
                      </p>
                      <p className="feed-card-desc">{post.description}</p>
                    </div>

                    {/* Comment count link */}
                    <div className="feed-card-comments">
                      <button
                        className="feed-comments-btn"
                        onClick={() => navigate(`/post/${post._id}`)}
                      >
                        💬 {post.commentCount || 0} Comments
                      </button>
                    </div>

                    {/* Actions for owner */}
                    {user?._id === post.owner._id && (
                      <div className="feed-card-actions">
                        <button
                          className="feed-action-btn edit"
                          onClick={() => startEdit(post)}
                        >
                          ✏️ Edit
                        </button>
                        {deletingId === post._id ? (
                          <div className="feed-delete-confirm">
                            <span>Delete?</span>
                            <button
                              className="feed-action-btn confirm-yes"
                              onClick={() => handleDelete(post._id)}
                            >
                              Yes
                            </button>
                            <button
                              className="feed-action-btn confirm-no"
                              onClick={() => setDeletingId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className="feed-action-btn delete"
                            onClick={() => setDeletingId(post._id)}
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

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="feed-sentinel">
              {loadingFeed && <p className="feed-loading-more">Loading more...</p>}
              {!loadingFeed && page >= totalPages && posts.length > 0 && (
                <p className="feed-end">You've seen all posts!</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
