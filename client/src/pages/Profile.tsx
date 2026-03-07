import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
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
  type Post,
} from "../services/post.service";
import "./Profile.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const isOwnProfile = user?._id === id;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const [userData, userPosts] = await Promise.all([
          getUserById(id),
          getPostsByUser(id),
        ]);
        setProfile(userData);
        setPosts(userPosts);
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
    } catch {
      setError("Failed to update profile.");
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
    if (!newDishName.trim() || !newRestaurant.trim() || !newDescription.trim()) return;

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
    } catch {
      setError("Failed to create post.");
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

  if (loading) {
    return (
      <div className="profile-loading">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-loading">
        <p className="profile-error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <h1 className="profile-header-title" onClick={() => navigate("/")}>
          🍽️ BiteShare
        </h1>
        <div className="profile-header-actions">
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Profile Card */}
      <div className="profile-card">
        {error && <div className="profile-error">{error}</div>}

        <div className="profile-info">
          <div className="profile-avatar-section">
            {isEditing ? (
              <div className="profile-avatar-edit-section">
                <div
                  className="profile-avatar-edit"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {(editPreview || (!removeImage && getImageUrl(profile?.profileImage))) ? (
                    <img
                      src={editPreview || getImageUrl(profile?.profileImage)}
                      alt="Profile"
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar-edit-placeholder">
                      {profile?.username?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="profile-avatar-overlay">📷</div>
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
                    className="profile-remove-image-btn"
                    onClick={handleRemoveImage}
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            ) : (
              <div className="profile-avatar-wrapper">
                {profile?.profileImage ? (
                  <img
                    src={getImageUrl(profile.profileImage)}
                    alt={profile.username}
                    className="profile-avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (
                        e.target as HTMLImageElement
                      ).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`profile-avatar-placeholder ${
                    profile?.profileImage ? "hidden" : ""
                  }`}
                >
                  {profile?.username?.charAt(0).toUpperCase() || "?"}
                </div>
              </div>
            )}
          </div>

          <div className="profile-details">
            {isEditing ? (
              <div className="profile-edit-form">
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="profile-edit-input"
                  placeholder="Username"
                />
                <div className="profile-edit-actions">
                  <button
                    onClick={handleEditSave}
                    className="profile-save-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="profile-cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="profile-username">{profile?.username}</h2>
                <p className="profile-email">{profile?.email}</p>
                <p className="profile-stats">{posts.length} posts</p>
                {isOwnProfile && (
                  <button
                    onClick={handleEditStart}
                    className="profile-edit-btn"
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="profile-posts-section">
        <h3 className="profile-posts-title">
          {isOwnProfile ? "My Posts" : `${profile?.username}'s Posts`}
        </h3>

        {posts.length === 0 ? (
          <div className="profile-no-posts">
            <p>No posts yet</p>
            {isOwnProfile && !showNewPost && (
              <>
                <p className="profile-no-posts-hint">Share your first dining experience!</p>
                <button
                  className="profile-create-first-btn"
                  onClick={() => setShowNewPost(true)}
                >
                  + Add Post
                </button>
              </>
            )}
            {isOwnProfile && showNewPost && (
              <form onSubmit={handleCreatePost} className="profile-new-post-form">
                <input
                  type="text"
                  placeholder="Dish name"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="profile-new-post-input"
                />
                <input
                  type="text"
                  placeholder="Restaurant name"
                  value={newRestaurant}
                  onChange={(e) => setNewRestaurant(e.target.value)}
                  className="profile-new-post-input"
                />
                <textarea
                  placeholder="Describe your experience..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="profile-new-post-textarea"
                  rows={3}
                />
                <div className="profile-new-post-image-section">
                  {newPostPreview && (
                    <img src={newPostPreview} alt="Preview" className="profile-new-post-preview" />
                  )}
                  <button
                    type="button"
                    className="profile-new-post-image-btn"
                    onClick={() => newPostImageRef.current?.click()}
                  >
                    📷 {newPostImage ? "Change Photo" : "Add Photo"}
                  </button>
                  <input
                    ref={newPostImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleNewPostImageChange}
                    hidden
                  />
                </div>
                <div className="profile-new-post-actions">
                  <button
                    type="submit"
                    className="profile-save-btn"
                    disabled={creatingPost || !newDishName.trim() || !newRestaurant.trim() || !newDescription.trim()}
                  >
                    {creatingPost ? "Posting..." : "Post"}
                  </button>
                  <button
                    type="button"
                    className="profile-cancel-btn"
                    onClick={handleCancelNewPost}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map((post) => (
              <div key={post._id} className="profile-post-card">
                {post.image && (
                  <img
                    src={getImageUrl(post.image)}
                    alt={post.dishName}
                    className="profile-post-image"
                  />
                )}
                <div className="profile-post-content">
                  <h4 className="profile-post-title">{post.dishName}</h4>
                  <p className="profile-post-restaurant">🎽 {post.restaurant}</p>
                  <p className="profile-post-text">{post.description}</p>
                  <span className="profile-post-date">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
