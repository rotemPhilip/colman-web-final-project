import { useState, useEffect, useRef, useCallback, type ChangeEvent, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  getUserById,
  updateProfile,
  type UserProfile,
} from "../services/user.service";
import {
  getPostsByUser,
  createPost,
  updatePost,
  deletePost,
  type Post,
} from "../services/post.service";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New post state
  const [showNewPost, setShowNewPost] = useState(false);
  const [newDishName, setNewDishName] = useState("");
  const [newRestaurant, setNewRestaurant] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostPreview, setNewPostPreview] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);
  const newPostImageRef = useRef<HTMLInputElement>(null);

  // Edit post state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostDishName, setEditPostDishName] = useState("");
  const [editPostRestaurant, setEditPostRestaurant] = useState("");
  const [editPostDescription, setEditPostDescription] = useState("");
  const [editPostImage, setEditPostImage] = useState<File | null>(null);
  const [editPostPreview, setEditPostPreview] = useState("");
  const [savingPost, setSavingPost] = useState(false);
  const editPostImageRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isOwnProfile = user?._id === id;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const [userData, postData] = await Promise.all([
          getUserById(id),
          getPostsByUser(id, 1, 6),
        ]);
        setProfile(userData);
        setPosts(postData.posts);
        setTotalPages(postData.pages);
        setPage(1);
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch more posts for infinite scroll
  const fetchMorePosts = useCallback(async () => {
    if (!id || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const result = await getPostsByUser(id, page + 1, 6);
      setPosts((prev) => [...prev, ...result.posts]);
      setTotalPages(result.pages);
      setPage(page + 1);
    } catch {
      // silent fail for load more
    } finally {
      setLoadingMore(false);
    }
  }, [id, page, totalPages, loadingMore]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMorePosts();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMorePosts]);

  const handleEditStart = () => {
    if (!profile) return;
    setEditUsername(profile.username);
    setEditImage(null);
    setEditPreview("");
    setRemoveImage(false);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditImage(null);
    setEditPreview("");
    setRemoveImage(false);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setEditPreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setEditImage(null);
    setEditPreview("");
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditSave = async () => {
    if (!editUsername.trim()) return;
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", editUsername.trim());
      if (editImage) {
        formData.append("profileImage", editImage);
      }
      if (removeImage) {
        formData.append("removeImage", "true");
      }
      const updated = await updateProfile(formData);
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      updateUser({ username: updated.username, profileImage: updated.profileImage });
      setIsEditing(false);
      setEditImage(null);
      setEditPreview("");
      setRemoveImage(false);
      showToast("Profile updated!");
    } catch {
      setError("Failed to update profile.");
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getImageUrl = (img?: string) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    return `${API_URL}${img}`;
  };

  const handleNewPostImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostImage(file);
      setNewPostPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim() || !newRestaurant.trim()) return;

    setCreatingPost(true);
    try {
      const formData = new FormData();
      formData.append("dishName", newDishName.trim());
      formData.append("restaurant", newRestaurant.trim());
      formData.append("description", newDescription.trim());
      if (newPostImage) {
        formData.append("image", newPostImage);
      }
      const post = await createPost(formData);
      setPosts((prev) => [post, ...prev]);
      setNewDishName("");
      setNewRestaurant("");
      setNewDescription("");
      setNewPostImage(null);
      setNewPostPreview("");
      setShowNewPost(false);
      showToast("Post shared!");
    } catch {
      setError("Failed to create post.");
      showToast("Failed to create post.", "error");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleCancelNewPost = () => {
    setShowNewPost(false);
    setNewDishName("");
    setNewRestaurant("");
    setNewDescription("");
    setNewPostImage(null);
    setNewPostPreview("");
  };

  // ---- Edit Post ----
  const startEditPost = (post: Post) => {
    setEditingPostId(post._id);
    setEditPostDishName(post.dishName);
    setEditPostRestaurant(post.restaurant);
    setEditPostDescription(post.description);
    setEditPostImage(null);
    setEditPostPreview(post.image ? getImageUrl(post.image) : "");
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditPostImage(null);
    setEditPostPreview("");
  };

  const handleEditPostImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPostImage(file);
      setEditPostPreview(URL.createObjectURL(file));
    }
  };

  const handleEditPostSave = async (postId: string) => {
    if (!editPostDishName.trim() || !editPostRestaurant.trim()) return;
    setSavingPost(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("dishName", editPostDishName.trim());
      fd.append("restaurant", editPostRestaurant.trim());
      fd.append("description", editPostDescription.trim());
      if (editPostImage) fd.append("image", editPostImage);
      const updated = await updatePost(postId, fd);
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
      cancelEditPost();
    } catch {
      setError("Failed to update post.");
    } finally {
      setSavingPost(false);
    }
  };

  // ---- Delete Post ----
  const handleDeletePost = async (postId: string) => {
    setDeletingPostId(null);
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

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted small mt-2">Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light gap-3 animate-fade-in">
        <i className="bi bi-person-x text-muted" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
        <p className="text-danger">{error}</p>
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
        <div className="container" style={{ maxWidth: 740 }}>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)} title="Go back">
              <i className="bi bi-arrow-left"></i>
            </button>
            <span
              className="navbar-brand fw-bold text-primary mb-0 h1 fs-4 cursor-pointer d-flex align-items-center"
              onClick={() => navigate("/")}
            >
              <img src="/favicon.svg" alt="" width="28" height="28" className="me-2" />
              BiteShare
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {isOwnProfile && (
              <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm">
                <i className="bi bi-box-arrow-right me-1"></i>Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="container" style={{ maxWidth: 700 }}>
        {/* Profile Card with Banner */}
        <div className="card border-0 shadow-sm mt-4 overflow-hidden">
          {/* Banner */}
          <div className="profile-banner"></div>

          <div className="card-body p-4 pt-0 text-center">
            {error && <div className="alert alert-danger py-2 small mt-3">{error}</div>}

            {/* Avatar centered */}
            <div className="d-flex justify-content-center" style={{ marginTop: -55 }}>
              <div className="profile-avatar-wrapper" style={{ marginTop: 0 }}>
                {isEditing ? (
                  <div className="text-center">
                    <div
                      className="position-relative cursor-pointer d-inline-block"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {(editPreview || (!removeImage && getImageUrl(profile?.profileImage))) ? (
                        <img
                          src={editPreview || getImageUrl(profile?.profileImage)}
                          alt="Profile"
                          className="avatar-circle-lg bg-white"
                          style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                        />
                      ) : (
                        <div className="avatar-placeholder avatar-placeholder-lg" style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                          {profile?.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div
                        className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 32, height: 32, border: "2px solid white" }}
                      >
                        <i className="bi bi-camera-fill" style={{ fontSize: "0.85rem" }}></i>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                      />
                    </div>
                    {(editPreview || (!removeImage && profile?.profileImage)) && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-danger text-decoration-none mt-1 p-0 d-block mx-auto"
                        onClick={handleRemoveImage}
                      >
                        <i className="bi bi-x-circle me-1"></i>Remove
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {profile?.profileImage ? (
                      <img
                        src={getImageUrl(profile.profileImage)}
                        alt={profile.username}
                        className="avatar-circle-lg bg-white"
                        style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("d-none");
                        }}
                      />
                    ) : null}
                    <div
                      className={`avatar-placeholder avatar-placeholder-lg ${profile?.profileImage ? "d-none" : ""}`}
                      style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                    >
                      {profile?.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Details centered below avatar */}
            <div className="mt-3">
              {isEditing ? (
                <div className="animate-fade-in" style={{ maxWidth: 320, margin: "0 auto" }}>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="form-control mb-2"
                    placeholder="Username"
                  />
                  <div className="d-flex gap-2 justify-content-center">
                    <button
                      onClick={handleEditSave}
                      className="btn btn-primary btn-sm px-3"
                      disabled={saving}
                    >
                      {saving ? (
                        <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                      ) : (
                        <><i className="bi bi-check-lg me-1"></i>Save</>
                      )}
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="btn btn-light btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="fw-bold mb-1">{profile?.username}</h4>
                  <p className="text-muted small mb-1">
                    <i className="bi bi-envelope me-1"></i>{profile?.email}
                  </p>
                  <p className="small mb-2">
                    <strong className="text-primary">{posts.length}</strong>{" "}
                    <span className="text-muted">posts</span>
                  </p>
                  {isOwnProfile && (
                    <button
                      onClick={handleEditStart}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-pencil me-1"></i>Edit Profile
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mt-4 pb-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">
              {isOwnProfile ? "My Posts" : `${profile?.username}'s Posts`}
            </h5>
            {isOwnProfile && posts.length > 0 && !showNewPost && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowNewPost(true)}
              >
                <i className="bi bi-plus-lg me-1"></i>New Post
              </button>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="card border-0 shadow-sm text-center empty-state animate-fade-in">
              <div className="empty-state-icon">
                <i className="bi bi-camera"></i>
              </div>
              <h5 className="fw-bold mb-2">No posts yet</h5>
              <p className="text-muted mb-2">
                {isOwnProfile ? "Share your first dining experience!" : `${profile?.username} hasn't posted yet.`}
              </p>
              {isOwnProfile && !showNewPost && (
                <>
                  <p className="text-muted small mb-3">Share your first dining experience!</p>
                  <div>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowNewPost(true)}
                    >
                      <i className="bi bi-plus-lg me-1"></i>Add Post
                    </button>
                  </div>
                </>
              )}
              {isOwnProfile && showNewPost && (
                <form onSubmit={handleCreatePost} className="text-start mt-3 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Dish name"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    className="form-control mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Restaurant name"
                    value={newRestaurant}
                    onChange={(e) => setNewRestaurant(e.target.value)}
                    className="form-control mb-2"
                  />
                  <textarea
                    placeholder="Describe your experience..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="form-control mb-2"
                    rows={3}
                  />
                  <div className="d-flex align-items-center gap-2 mb-3">
                    {newPostPreview && (
                      <img
                        src={newPostPreview}
                        alt="Preview"
                        className="rounded"
                        style={{ width: 80, height: 80, objectFit: "cover" }}
                      />
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => newPostImageRef.current?.click()}
                    >
                      <i className="bi bi-camera me-1"></i>
                      {newPostImage ? "Change Photo" : "Add Photo"}
                    </button>
                    <input
                      ref={newPostImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleNewPostImageChange}
                      hidden
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={creatingPost || !newDishName.trim() || !newRestaurant.trim()}
                    >
                      {creatingPost ? "Posting..." : "Post"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      onClick={handleCancelNewPost}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* New Post Form (when posts exist) */}
              {isOwnProfile && showNewPost && (
                <div className="card border-0 shadow-sm mb-3 animate-slide-down">
                  <div className="card-body">
                    <h6 className="card-title mb-3">
                      <i className="bi bi-plus-circle me-1 text-primary"></i>Share a dining experience
                    </h6>
                    <form onSubmit={handleCreatePost}>
                      <input
                        type="text"
                        placeholder="Dish name"
                        value={newDishName}
                        onChange={(e) => setNewDishName(e.target.value)}
                        className="form-control mb-2"
                      />
                      <input
                        type="text"
                        placeholder="Restaurant name"
                        value={newRestaurant}
                        onChange={(e) => setNewRestaurant(e.target.value)}
                        className="form-control mb-2"
                      />
                      <textarea
                        placeholder="Describe your experience..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="form-control mb-2"
                        rows={3}
                      />
                      <div className="d-flex align-items-center gap-2 mb-3">
                        {newPostPreview && (
                          <img
                            src={newPostPreview}
                            alt="Preview"
                            className="rounded"
                            style={{ width: 80, height: 80, objectFit: "cover" }}
                          />
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => newPostImageRef.current?.click()}
                        >
                          <i className="bi bi-camera me-1"></i>
                          {newPostImage ? "Change Photo" : "Add Photo"}
                        </button>
                        <input
                          ref={newPostImageRef}
                          type="file"
                          accept="image/*"
                          onChange={handleNewPostImageChange}
                          hidden
                        />
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={creatingPost || !newDishName.trim() || !newRestaurant.trim()}
                        >
                          {creatingPost ? (
                            <><span className="spinner-border spinner-border-sm me-1"></span>Posting...</>
                          ) : (
                            "Post"
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={handleCancelNewPost}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Posts Grid */}
              <div className="d-flex flex-column gap-3">
                {posts.map((post, index) => (
                  <div key={post._id} className="card border-0 shadow-sm overflow-hidden feed-card" style={{ animationDelay: `${index * 0.05}s` }}>
                    {editingPostId === post._id ? (
                      <div className="card-body">
                        <input
                          type="text"
                          value={editPostDishName}
                          onChange={(e) => setEditPostDishName(e.target.value)}
                          className="form-control mb-2"
                          placeholder="Dish name"
                        />
                        <input
                          type="text"
                          value={editPostRestaurant}
                          onChange={(e) => setEditPostRestaurant(e.target.value)}
                          className="form-control mb-2"
                          placeholder="Restaurant name"
                        />
                        <textarea
                          value={editPostDescription}
                          onChange={(e) => setEditPostDescription(e.target.value)}
                          className="form-control mb-2"
                          placeholder="Description"
                          rows={3}
                        />
                        <div className="d-flex align-items-center gap-2 mb-3">
                          {editPostPreview && (
                            <img
                              src={editPostPreview}
                              alt="Preview"
                              className="rounded"
                              style={{ width: 80, height: 80, objectFit: "cover" }}
                            />
                          )}
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => editPostImageRef.current?.click()}
                          >
                            <i className="bi bi-camera me-1"></i>
                            {editPostImage ? "Change Photo" : "Update Photo"}
                          </button>
                          <input
                            ref={editPostImageRef}
                            type="file"
                            accept="image/*"
                            onChange={handleEditPostImageChange}
                            hidden
                          />
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={savingPost}
                            onClick={() => handleEditPostSave(post._id)}
                          >
                            {savingPost ? "Saving..." : "Save"}
                          </button>
                          <button className="btn btn-light btn-sm" onClick={cancelEditPost}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {post.image && (
                          <img
                            src={getImageUrl(post.image)}
                            alt={post.dishName}
                            className="card-img-top"
                            style={{ maxHeight: 300, objectFit: "cover" }}
                          />
                        )}
                        <div className="card-body">
                          <h6 className="card-title fw-bold mb-1">{post.dishName}</h6>
                          <p className="text-primary small fw-semibold mb-2">
                            <i className="bi bi-geo-alt-fill me-1"></i>{post.restaurant}
                          </p>
                          <p className="card-text text-muted small">{post.description}</p>
                        </div>
                        <div className="card-footer bg-white border-top py-2 px-3 d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </small>
                            <button
                              className="btn btn-link text-muted text-decoration-none btn-sm p-0 d-flex align-items-center gap-1"
                              onClick={() => navigate(`/post/${post._id}`)}
                            >
                              <i className="bi bi-chat-dots"></i>
                              <span>{post.commentCount || 0}</span>
                            </button>
                          </div>
                          {isOwnProfile && (
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-outline-primary btn-sm py-0 px-2"
                                onClick={() => startEditPost(post)}
                                title="Edit post"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              {deletingPostId === post._id ? (
                                <div className="delete-confirm-overlay d-flex align-items-center gap-2">
                                  <span className="text-danger small fw-semibold">Delete?</span>
                                  <button
                                    className="btn btn-danger btn-sm py-0 px-2"
                                    onClick={() => handleDeletePost(post._id)}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    className="btn btn-light btn-sm py-0 px-2"
                                    onClick={() => setDeletingPostId(null)}
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn btn-outline-danger btn-sm py-0 px-2"
                                  onClick={() => setDeletingPostId(post._id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="text-center py-3">
                {loadingMore && (
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
                {!loadingMore && page >= totalPages && posts.length > 0 && (
                  <small className="text-muted">All posts loaded</small>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
