import { useAuth } from "../../context/useAuth";
import Avatar from "../../components/Avatar/Avatar";
import PostForm from "../../components/PostForm/PostForm";
import PostCard from "./PostCard";
import AISearch from "../../components/AISearch/AISearch";
import type { Post } from "../../services/post.service";
import type { PostFormData } from "./useFeed";

interface FeedProps {
  posts: Post[];
  page: number;
  totalPages: number;
  loadingFeed: boolean;
  initialLoad: boolean;
  filter: "all" | "mine";
  showCreate: boolean;
  error: string;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  setShowCreate: (v: boolean) => void;
  setError: (v: string) => void;
  handleCreate: (data: PostFormData) => Promise<void>;
  handleEditSave: (postId: string, data: PostFormData) => Promise<void>;
  handleDelete: (postId: string) => Promise<void>;
  handleToggleLike: (postId: string) => Promise<{ likesCount: number; isLikedByCurrentUser: boolean }>;
}

const Feed = ({
  posts, page, totalPages, loadingFeed, initialLoad, filter,
  showCreate, error, sentinelRef, setShowCreate, setError,
  handleCreate, handleEditSave, handleDelete, handleToggleLike,
}: FeedProps) => {
  const { user } = useAuth();

  const emptyState = (
    <div className="card border-0 shadow-sm text-center empty-state animate-fade-in">
      <div className="empty-state-icon">
        {filter === "mine" ? <i className="bi bi-journal-text"></i> : <i className="bi bi-fork-knife"></i>}
      </div>
      <h5 className="fw-bold mb-2">{filter === "mine" ? "No posts yet" : "Feed is empty"}</h5>
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
  );

  return (
    <>
      <main className="container py-4" style={{ maxWidth: 680 }}>
        <AISearch />

        {error && (
          <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 animate-fade-in">
            <i className="bi bi-exclamation-triangle"></i>
            {error}
            <button className="btn-close btn-close-sm ms-auto" onClick={() => setError("")}></button>
          </div>
        )}

        {showCreate && (
          <div className="card border-0 shadow-sm mb-4 animate-slide-down">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Avatar username={user?.username} profileImage={user?.profileImage} />
                <h6 className="mb-0 fw-bold">Share a dining experience</h6>
              </div>
              <PostForm
                submitLabel="Post"
                submittingLabel="Posting..."
                onSubmit={handleCreate}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          </div>
        )}

        {initialLoad ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted small mt-2">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? emptyState : (
          <div className="d-flex flex-column gap-3">
            {posts.map((post, index) => (
              <PostCard
                key={post._id}
                post={post}
                isOwn={user?._id === post.owner._id}
                onSave={(data) => handleEditSave(post._id, data)}
                onDelete={() => handleDelete(post._id)}
                onToggleLike={() => handleToggleLike(post._id)}
                animationDelay={`${index * 0.05}s`}
              />
            ))}

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
      </main>

      {!showCreate && (
        <button className="biteshare-fab" onClick={() => setShowCreate(true)} title="New Post">
          <i className="bi bi-plus-lg"></i>
        </button>
      )}
    </>
  );
};

export default Feed;
