import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../../components/Avatar/Avatar";
import DeleteConfirm from "../../components/DeleteConfirm/DeleteConfirm";
import PostForm from "../../components/PostForm/PostForm";
import { getImageUrl } from "../../utils/image";
import type { Post } from "../../services/post.service";
import type { PostFormData } from "./useFeed";

interface PostCardProps {
  post: Post;
  isOwn: boolean;
  onSave: (data: PostFormData) => Promise<void>;
  onDelete: () => Promise<void>;
  animationDelay?: string;
}

const PostCard = ({ post, isOwn, onSave, onDelete, animationDelay }: PostCardProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditSave = async (data: PostFormData) => {
    await onSave(data);
    setIsEditing(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(false);
    await onDelete();
  };

  return (
    <div className="card border-0 shadow-sm overflow-hidden feed-card" style={{ animationDelay }}>
      {/* Card Header */}
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <div
          className="d-flex align-items-center gap-2 cursor-pointer"
          onClick={() => navigate(`/profile/${post.owner._id}`)}
        >
          <Avatar username={post.owner.username} profileImage={post.owner.profileImage} />
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
        {isOwn && !isEditing && (
          <div className="dropdown">
            <button className="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
              <i className="bi bi-three-dots"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button className="dropdown-item" onClick={() => setIsEditing(true)}>
                  <i className="bi bi-pencil me-2"></i>Edit
                </button>
              </li>
              <li>
                <button className="dropdown-item text-danger" onClick={() => setIsDeleting(true)}>
                  <i className="bi bi-trash me-2"></i>Delete
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {isDeleting && (
        <div className="delete-confirm-overlay d-flex justify-content-between align-items-center mx-3 mt-2">
          <DeleteConfirm
            message="Delete this post?"
            onConfirm={handleDeleteConfirm}
            onCancel={() => setIsDeleting(false)}
          />
        </div>
      )}

      {isEditing ? (
        <div className="card-body animate-fade-in">
          <PostForm
            initialDishName={post.dishName}
            initialRestaurant={post.restaurant}
            initialDescription={post.description}
            initialImagePreview={post.image ? getImageUrl(post.image) : ""}
            submitLabel="Save"
            submittingLabel="Saving..."
            onSubmit={handleEditSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <>
          {post.image && (
            <img
              src={getImageUrl(post.image)}
              alt={post.dishName}
              className="w-100 object-fit-cover cursor-pointer"
              style={{ aspectRatio: "16/9", display: "block" }}
              onClick={() => navigate(`/post/${post._id}`)}
            />
          )}
          <div className="card-body px-4 pt-3 pb-2">
            <h5
              className="fw-bold mb-2 cursor-pointer"
              style={{ fontSize: "1.1rem" }}
              onClick={() => navigate(`/post/${post._id}`)}
            >{post.dishName}</h5>
            <p className="mb-2">
              <span className="badge rounded-pill bg-secondary bg-opacity-10 text-primary fw-semibold px-3 py-2">
                <i className="bi bi-geo-alt-fill me-1"></i>{post.restaurant}
              </span>
            </p>
            <p className="card-text text-muted small mb-0">{post.description}</p>
          </div>
          <div className="card-footer bg-white border-top py-2 px-4 d-flex justify-content-between align-items-center">
            <button
              className="btn btn-link text-decoration-none btn-sm p-0 d-flex align-items-center gap-1 text-muted"
              onClick={() => navigate(`/post/${post._id}`)}
            >
              <i className="bi bi-chat-dots"></i>
              <span>{post.commentCount} Comments</span>
            </button>
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </small>
          </div>
        </>
      )}
    </div>
  );
};

export default PostCard;