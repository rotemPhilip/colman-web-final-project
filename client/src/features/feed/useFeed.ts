import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/useAuth";
import {
  getAllPosts,
  getPostsByUser,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  type Post,
} from "../../services/post.service";
import { useToast } from "../../hooks/useToast";

const PAGE_SIZE = 6;

export type PostFormData = {
  dishName: string;
  restaurant: string;
  description: string;
  image: File | null;
};

export const useFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Refs to prevent race conditions between filter changes and IntersectionObserver
  const loadingRef = useRef(false);
  const fetchIdRef = useRef(0);

  const fetchPosts = useCallback(
    async (pageNum: number, append: boolean) => {
      const fetchId = ++fetchIdRef.current;
      loadingRef.current = true;
      setLoadingFeed(true);
      setError("");
      try {
        const isMineFilter = filter === "mine" && user;

        const result = isMineFilter
          ? await getPostsByUser(user._id, pageNum, PAGE_SIZE)
          : await getAllPosts(pageNum, PAGE_SIZE);

        // Discard stale responses from previous filter/fetch
        if (fetchIdRef.current !== fetchId) return;

        setPosts((prev) => append ? [...prev, ...result.posts] : result.posts);
        setTotalPages(result.pages);
        setPage(pageNum);
      } catch {
        if (fetchIdRef.current !== fetchId) return;
        setError("Failed to load posts.");
      } finally {
        if (fetchIdRef.current === fetchId) {
          loadingRef.current = false;
          setLoadingFeed(false);
          setInitialLoad(false);
        }
      }
    },
    [filter, user]
  );

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [filter, fetchPosts]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current && page < totalPages)
          fetchPosts(page + 1, true);
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [page, totalPages, loadingFeed, fetchPosts]);

  const toFormData = (data: PostFormData) => {
    const fd = new FormData();
    fd.append("dishName", data.dishName.trim());
    fd.append("restaurant", data.restaurant.trim());
    fd.append("description", data.description.trim());
    if (data.image) fd.append("image", data.image);
    return fd;
  };

  const handleCreate = async (data: PostFormData) => {
    try {
      const post = await createPost(toFormData(data));
      setPosts((prev) => [post, ...prev]);
      setShowCreate(false);
      showToast("Post shared successfully!");
    } catch {
      showToast("Failed to create post.", "error");
      throw new Error("create failed");
    }
  };

  const handleEditSave = async (postId: string, data: PostFormData) => {
    try {
      const updated = await updatePost(postId, toFormData(data));
      setPosts((prev) => prev.map((p) => (p._id === postId ? updated : p)));
    } catch {
      showToast("Failed to update post.", "error");
      throw new Error("update failed");
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      showToast("Post deleted.");
    } catch {
      showToast("Failed to delete post.", "error");
    }
  };

  const handleToggleLike = async (postId: string) => {
    return toggleLike(postId);
  };

  return {
    user,
    posts,
    page,
    totalPages,
    loadingFeed,
    initialLoad,
    filter,
    showCreate,
    error,
    toast,
    sentinelRef,
    setFilter,
    setShowCreate,
    setError,
    handleCreate,
    handleEditSave,
    handleDelete,
    handleToggleLike,
  };
};
