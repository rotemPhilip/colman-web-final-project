import type { RefObject } from "react";
import type { Post } from "../../services/post.service";
import type { UserProfile } from "../../services/user.service";
import type { PostFormData } from "./useProfile";
import PostCard from "../feed/PostCard";
import PostForm from "../../components/PostForm/PostForm";

interface ProfilePostsProps {
  posts: Post[];
  profile: UserProfile;
  isOwnProfile: boolean;
  showNewPost: boolean;
  loadingMore: boolean;
  page: number;
  totalPages: number;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onShowNewPost: () => void;
  onCreatePost: (data: PostFormData) => Promise<void>;
  onCancelNewPost: () => void;
  onEditPostSave: (postId: string, data: PostFormData) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
}

const ProfilePosts = ({
  posts,
  profile,
  isOwnProfile,
  showNewPost,
  loadingMore,
  page,
  totalPages,
  sentinelRef,
  onShowNewPost,
  onCreatePost,
  onCancelNewPost,
  onEditPostSave,
  onDeletePost,
}: ProfilePostsProps) => {
  return (
    <div className="mt-4 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">
          {isOwnProfile ? "My Posts" : `${profile.username}'s Posts`}
        </h5>
        {isOwnProfile && posts.length > 0 && !showNewPost && (
          <button className="btn btn-primary btn-sm" onClick={onShowNewPost}>
            <i className="bi bi-plus-lg me-1"></i>New Post
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="card border-0 shadow-sm text-center empty-state animate-fade-in">
          <div className="empty-state-icon"><i className="bi bi-camera"></i></div>
          <h5 className="fw-bold mb-2">No posts yet</h5>
          <p className="text-muted mb-2">
            {isOwnProfile ? "Share your first dining experience!" : `${profile.username} hasn't posted yet.`}
          </p>
          {isOwnProfile && !showNewPost && (
            <>
              <p className="text-muted small mb-3">Share your first dining experience!</p>
              <div>
                <button className="btn btn-primary" onClick={onShowNewPost}>
                  <i className="bi bi-plus-lg me-1"></i>Add Post
                </button>
              </div>
            </>
          )}
          {isOwnProfile && showNewPost && (
            <div className="animate-fade-in mt-3 text-start">
              <PostForm
                submitLabel="Post"
                submittingLabel="Posting..."
                onSubmit={onCreatePost}
                onCancel={onCancelNewPost}
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {isOwnProfile && showNewPost && (
            <div className="card border-0 shadow-sm mb-3 animate-slide-down">
              <div className="card-body">
                <h6 className="card-title mb-3">
                  <i className="bi bi-plus-circle me-1 text-primary"></i>Share a dining experience
                </h6>
                <PostForm
                  submitLabel="Post"
                  submittingLabel="Posting..."
                  onSubmit={onCreatePost}
                  onCancel={onCancelNewPost}
                />
              </div>
            </div>
          )}

          <div className="d-flex flex-column gap-3">
            {posts.map((post, index) => (
              <PostCard
                key={post._id}
                post={post}
                isOwn={isOwnProfile}
                onSave={(data) => onEditPostSave(post._id, data)}
                onDelete={() => onDeletePost(post._id)}
                animationDelay={`${index * 0.05}s`}
              />
            ))}
          </div>

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
  );
};

export default ProfilePosts;
