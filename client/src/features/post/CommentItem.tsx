import { useState, useEffect } from "react";
import Avatar from "../../components/Avatar/Avatar";
import DeleteConfirm from "../../components/DeleteConfirm/DeleteConfirm";
import type { Comment } from "../../services/comment.service";

interface CommentItemProps {
  comment: Comment;
  isOwn: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  savingEdit: boolean;
  onStartEdit: () => void;
  onSave: (commentId: string, content: string) => void;
  onCancelEdit: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onNavigate: (userId: string) => void;
}

const CommentItem = ({
  comment,
  isOwn,
  isEditing,
  isDeleting,
  savingEdit,
  onStartEdit,
  onSave,
  onCancelEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onNavigate,
}: CommentItemProps) => {
  const [editText, setEditText] = useState(comment.content);

  // Sync local edit text whenever this comment enters edit mode
  useEffect(() => {
    if (isEditing) setEditText(comment.content);
  }, [isEditing, comment.content]);

  return (
    <div className="d-flex gap-2 animate-fade-in">
      <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate(comment.owner._id)}>
        <Avatar
          username={comment.owner.username}
          profileImage={comment.owner.profileImage}
          onClick={() => onNavigate(comment.owner._id)}
        />
      </div>
      <div className="flex-grow-1">
        <div className={`comment-bubble ${isOwn ? "own-comment" : ""}`}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span
              className="fw-semibold small cursor-pointer"
              onClick={() => onNavigate(comment.owner._id)}
            >
              {comment.owner.username}
            </span>
            <small className="text-muted" style={{ fontSize: "0.7rem" }}>
              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </small>
          </div>

          {isEditing ? (
            <div className="animate-fade-in">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="form-control form-control-sm mb-2"
                autoFocus
              />
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary btn-sm py-0 px-2"
                  disabled={savingEdit || !editText.trim()}
                  onClick={() => onSave(comment._id, editText)}
                >
                  {savingEdit ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <><i className="bi bi-check-lg me-1"></i>Save</>
                  )}
                </button>
                <button className="btn btn-light btn-sm py-0 px-2" onClick={onCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mb-0 small">{comment.content}</p>
          )}
        </div>

        {isOwn && !isEditing && (
          <div className="d-flex gap-3 mt-1 ms-2">
            <button
              className="btn btn-link btn-sm text-muted text-decoration-none p-0"
              style={{ fontSize: "0.75rem" }}
              onClick={onStartEdit}
            >
              <i className="bi bi-pencil me-1"></i>Edit
            </button>
            {isDeleting ? (
              <div className="d-flex align-items-center gap-2 animate-fade-in">
                <DeleteConfirm
                  message="Delete?"
                  onConfirm={onDeleteConfirm}
                  onCancel={onDeleteCancel}
                />
              </div>
            ) : (
              <button
                className="btn btn-link btn-sm text-danger text-decoration-none p-0"
                style={{ fontSize: "0.75rem" }}
                onClick={onDeleteRequest}
              >
                <i className="bi bi-trash me-1"></i>Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
