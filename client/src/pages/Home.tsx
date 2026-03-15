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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const PAGE_SIZE = 6;

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  const [showCreate, setShowCreate] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newRestaurant, setNewRestaurant] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState("");
  const [creating, setCreating] = useState(false);
  const newImageRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDishName, setEditDishName] = useState("");
  const [editRestaurant, setEditRestaurant] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const editImageRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    setPage(1);
    setPosts([]);
    setInitialLoad(true);
    fetchPosts(1, false);
  }, [filter, fetchPosts]);

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

  const handleNewImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim() || !newRestaurant.trim()) return;
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
      showToast("Post shared successfully!");
    } catch {
      setError("Failed to create post.");
      showToast("Failed to create post.", "error");
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
    if (!editDishName.trim() || !editRestaurant.trim()) return;
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

  const handleDelete = async (postId: string) => {
    setDeletingId(null);
    setError("");
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast("Post deleted.");
    } catch {
      setError("Failed to delete post.");
      showToast("Failed to delete post.", "error");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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
          <span
            className="navbar-brand fw-bold text-primary mb-0 h1 fs-4 cursor-pointer d-flex align-items-center"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img src="/favicon.svg" alt="" width="30" height="30" className="me-2" />
            BiteShare
          </span>
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center gap-2 cursor-pointer"
              onClick={() => navigate(`/profile/${user?._id}`)}
              title="My Profile"
            >
              {user?.profileImage ? (
                <img
                  src={getImageUrl(user.profileImage)}
                  alt={user.username}
                  className="avatar-circle-sm"
                />
              ) : (
                <div className="avatar-placeholder avatar-placeholder-sm">
                  {user?.username?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <span className="fw-semibold small d-none d-md-inline">{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 640 }}>
        <div className="py-4">
          {/* Toolbar */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="btn-group" role="group">
              <button
                className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setFilter("all")}
              >
                <i className="bi bi-globe2 me-1"></i>All Posts
              </button>
              <button
                className={`btn btn-sm ${filter === "mine" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setFilter("mine")}
              >
                <i className="bi bi-person me-1"></i>My Posts
              </button>
            </div>
            {!showCreate && (
              <button
                className="btn btn-sm btn-primary d-none d-sm-inline-flex"
                onClick={() => setShowCreate(true)}
              >
                <i className="bi bi-plus-lg me-1"></i>New Post
              </button>
            )}
          </div>

          {error && (
            <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 animate-fade-in">
              <i className="bi bi-exclamation-triangle"></i>
              {error}
              <button className="btn-close btn-close-sm ms-auto" onClick={() => setError("")}></button>
            </div>
          )}

          {/* Create Form */}
          {showCreate && (
            <div className="card border-0 shadow-sm mb-4 animate-slide-down">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  {user?.profileImage ? (
                    <img src={getImageUrl(user.profileImage)} alt="" className="avatar-circle-sm" />
                  ) : (
                    <div className="avatar-placeholder avatar-placeholder-sm">
                      {user?.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <h6 className="mb-0 fw-bold">Share a dining experience</h6>
                </div>
                <form onSubmit={handleCreate}>
                  <div className="row g-2 mb-2">
                    <div className="col-sm-6">
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-fork-knife"></i></span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Dish name"
                          value={newDishName}
                          onChange={(e) => setNewDishName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-geo-alt"></i></span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Restaurant name"
                          value={newRestaurant}
                          onChange={(e) => setNewRestaurant(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <textarea
                    className="form-control mb-3"
                    placeholder="Tell us about your experience..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                  />
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      {newImagePreview ? (
                        <div className="position-relative">
                          <img
                            src={newImagePreview}
                            alt="Preview"
                            className="rounded-3"
                            style={{ width: 64, height: 64, objectFit: "cover" }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm position-absolute top-0 end-0 p-0 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 20, height: 20, marginTop: -6, marginRight: -6 }}
                            onClick={() => { setNewImage(null); setNewImagePreview(""); }}
                          >
                            <i className="bi bi-x" style={{ fontSize: "0.7rem" }}></i>
                          </button>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => newImageRef.current?.click()}
                      >
                        <i className="bi bi-camera me-1"></i>
                        {newImage ? "Change Photo" : "Add Photo"}
                      </button>
                      <input ref={newImageRef} type="file" accept="image/*" onChange={handleNewImageChange} hidden />
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-light btn-sm" onClick={resetCreateForm}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm px-3"
                        disabled={creating || !newDishName.trim() || !newRestaurant.trim()}
                      >
                        {creating ? (
                          <><span className="spinner-border spinner-border-sm me-1"></span>Posting...</>
                        ) : (
                          <><i className="bi bi-send me-1"></i>Post</>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Feed */}
          {initialLoad ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted small mt-2">Loading feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="card border-0 shadow-sm text-center empty-state animate-fade-in">
              <div className="empty-state-icon">
                {filter === "mine" ? (
                  <i className="bi bi-journal-text"></i>
                ) : (
                  <i className="bi bi-fork-knife"></i>
                )}
              </div>
              <h5 className="fw-bold mb-2">
                {filter === "mine" ? "No posts yet" : "Feed is empty"}
              </h5>
              <p className="text-muted mb-3">
                {filter === "mine"
                  ? "Share your first dining experience!"
                  : "Be the first to share a delicious experience!"}
              </p>
              {!showCreate && (
                <div>
                  <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Create Post
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {posts.map((post, index) => (
                <div
                  key={post._id}
                  className="card border-0 shadow-sm overflow-hidden feed-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Card Header */}
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
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </small>
                      </div>
                    </div>
                    {user?._id === post.owner._id && editingId !== post._id && (
                      <div className="dropdown">
                        <button className="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                          <i className="bi bi-three-dots"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button className="dropdown-item" onClick={() => startEdit(post)}>
                              <i className="bi bi-pencil me-2"></i>Edit
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => setDeletingId(post._id)}
                            >
                              <i className="bi bi-trash me-2"></i>Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Delete confirmation */}
                  {deletingId === post._id && (
                    <div className="delete-confirm-overlay d-flex justify-content-between align-items-center mx-3 mt-2">
                      <span className="text-danger small fw-semibold">
                        <i className="bi bi-exclamation-triangle me-1"></i>Delete this post?
                      </span>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-danger px-3" onClick={() => handleDelete(post._id)}>
                          Delete
                        </button>
                        <button className="btn btn-sm btn-light" onClick={() => setDeletingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Editing mode */}
                  {editingId === post._id ? (
                    <div className="card-body animate-fade-in">
                      <div className="row g-2 mb-2">
                        <div className="col-sm-6">
                          <input
                            type="text"
                            className="form-control"
                            value={editDishName}
                            onChange={(e) => setEditDishName(e.target.value)}
                            placeholder="Dish name"
                          />
                        </div>
                        <div className="col-sm-6">
                          <input
                            type="text"
                            className="form-control"
                            value={editRestaurant}
                            onChange={(e) => setEditRestaurant(e.target.value)}
                            placeholder="Restaurant name"
                          />
                        </div>
                      </div>
                      <textarea
                        className="form-control mb-3"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        rows={3}
                      />
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          {editImagePreview && (
                            <img
                              src={editImagePreview}
                              alt="Preview"
                              className="rounded-3"
                              style={{ width: 64, height: 64, objectFit: "cover" }}
                            />
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => editImageRef.current?.click()}
                          >
                            <i className="bi bi-camera me-1"></i>
                            {editImage ? "Change Photo" : "Add Photo"}
                          </button>
                          <input ref={editImageRef} type="file" accept="image/*" onChange={handleEditImageChange} hidden />
                        </div>
                        <div className="d-flex gap-2">
                          <button className="btn btn-light btn-sm" onClick={cancelEdit}>
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary btn-sm px-3"
                            disabled={saving}
                            onClick={() => handleEditSave(post._id)}
                          >
                            {saving ? (
                              <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                            ) : (
                              <><i className="bi bi-check-lg me-1"></i>Save</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.image && (
                        <div className="overflow-hidden cursor-pointer" onClick={() => navigate(`/post/${post._id}`)}>
                          <img
                            src={getImageUrl(post.image)}
                            alt={post.dishName}
                            className="card-img-top"
                            style={{ maxHeight: 400, objectFit: "cover" }}
                          />
                        </div>
                      )}
                      <div className="card-body cursor-pointer" onClick={() => navigate(`/post/${post._id}`)}>
                        <h6 className="card-title fw-bold mb-1">{post.dishName}</h6>
                        <p className="text-primary small fw-semibold mb-2">
                          <i className="bi bi-geo-alt-fill me-1"></i>{post.restaurant}
                        </p>
                        <p className="card-text text-muted small mb-0">{post.description}</p>
                      </div>

                      <div className="card-footer bg-white border-top py-2 px-3 d-flex justify-content-between align-items-center">
                        <button
                          className="btn btn-link text-muted text-decoration-none btn-sm p-0 d-flex align-items-center gap-1"
                          onClick={() => navigate(`/post/${post._id}`)}
                        >
                          <i className="bi bi-chat-dots"></i>
                          <span>{post.commentCount || 0} Comments</span>
                        </button>
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </small>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Sentinel */}
              <div ref={sentinelRef} className="text-center py-3">
                {loadingFeed && (
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
                {!loadingFeed && page >= totalPages && posts.length > 0 && (
                  <small className="text-muted">You've seen all posts!</small>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      {!showCreate && (
        <button
          className="fab btn btn-primary d-sm-none"
          onClick={() => setShowCreate(true)}
          title="Create new post"
        >
          <i className="bi bi-plus-lg"></i>
        </button>
      )}
    </div>
  );
};

export default Home;
