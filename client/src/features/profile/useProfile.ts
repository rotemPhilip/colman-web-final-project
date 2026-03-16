import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  getUserById,
  updateProfile,
  type UserProfile,
} from "../../services/user.service";
import {
  getPostsByUser,
  createPost,
  updatePost,
  deletePost,
  type Post,
} from "../../services/post.service";
import { useToast } from "../../hooks/useToast";

export type PostFormData = {
  dishName: string;
  restaurant: string;
  description: string;
  image: File | null;
};

export const useProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [profileEdit, setProfileEdit] = useState({
    username: "",
    image: null as File | null,
    preview: "",
    removeImage: false,
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showNewPost, setShowNewPost] = useState(false);

  const { toast, showToast } = useToast();
  const isOwnProfile = user?._id === id;

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

  const fetchMorePosts = useCallback(async () => {
    if (!id || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const result = await getPostsByUser(id, page + 1, 6);
      setPosts((prev) => [...prev, ...result.posts]);
      setTotalPages(result.pages);
      setPage(page + 1);
    } catch {
      // silent fail for load-more
    } finally {
      setLoadingMore(false);
    }
  }, [id, page, totalPages, loadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchMorePosts(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMorePosts]);

  const handleEditStart = () => {
    if (!profile) return;
    setProfileEdit({ username: profile.username, image: null, preview: "", removeImage: false });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setProfileEdit({ username: "", image: null, preview: "", removeImage: false });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileEdit((prev) => ({ ...prev, image: file, preview: URL.createObjectURL(file), removeImage: false }));
    }
  };

  const handleRemoveImage = () => {
    setProfileEdit((prev) => ({ ...prev, image: null, preview: "", removeImage: true }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditSave = async () => {
    if (!profileEdit.username.trim()) return;
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", profileEdit.username.trim());
      if (profileEdit.image) formData.append("profileImage", profileEdit.image);
      if (profileEdit.removeImage) formData.append("removeImage", "true");
      const updated = await updateProfile(formData);
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      updateUser({ username: updated.username, profileImage: updated.profileImage });
      setIsEditing(false);
      setProfileEdit({ username: "", image: null, preview: "", removeImage: false });
      showToast("Profile updated!");
    } catch {
      setError("Failed to update profile.");
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePost = async (data: PostFormData) => {
    const formData = new FormData();
    formData.append("dishName", data.dishName.trim());
    formData.append("restaurant", data.restaurant.trim());
    formData.append("description", data.description.trim());
    if (data.image) formData.append("image", data.image);
    try {
      const post = await createPost(formData);
      setPosts((prev) => [post, ...prev]);
      setShowNewPost(false);
      showToast("Post shared!");
    } catch {
      showToast("Failed to create post.", "error");
      throw new Error("create failed");
    }
  };

  const handleEditPostSave = async (postId: string, data: PostFormData) => {
    try {
      const fd = new FormData();
      fd.append("dishName", data.dishName.trim());
      fd.append("restaurant", data.restaurant.trim());
      fd.append("description", data.description.trim());
      if (data.image) fd.append("image", data.image);
      const updated = await updatePost(postId, fd);
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
    } catch {
      showToast("Failed to update post.", "error");
      throw new Error("update failed");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast("Post deleted.");
    } catch {
      showToast("Failed to delete post.", "error");
    }
  };

  return {
    profile,
    posts,
    loading,
    error,
    page,
    totalPages,
    loadingMore,
    sentinelRef,
    isOwnProfile,
    isEditing,
    profileEdit,
    saving,
    fileInputRef,
    showNewPost,
    toast,
    setError,
    setShowNewPost,
    handleEditStart,
    handleEditCancel,
    handleImageChange,
    handleRemoveImage,
    handleEditSave,
    setProfileEdit,
    handleCreatePost,
    handleEditPostSave,
    handleDeletePost,
  };
};
