import { useNavigate } from "react-router-dom";
import { useComments } from "./useComments";
import CommentItem from "../post/CommentItem";
import NewCommentForm from "../post/NewCommentForm";

interface PostCommentsProps {
  postId: string;
  open: boolean;
  onCountChange: (delta: number) => void;
}

const PostComments = ({ postId, open, onCountChange }: PostCommentsProps) => {
  const navigate = useNavigate();
  const {
    user,
    comments,
    page,
    totalPages,
    loading,
    initialLoad,
    newComment,
    submitting,
    commentEdit,
    deletingId,
    error,
    sentinelRef,
    setNewComment,
    setDeletingId,
    handleSubmitComment,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    handleDeleteComment,
  } = useComments(postId, open, onCountChange);

  if (!open) return null;

  return (
    <div className="border-top px-3 py-3 bg-white animate-fade-in">
      <NewCommentForm
        username={user?.username}
        profileImage={user?.profileImage}
        value={newComment}
        onChange={setNewComment}
        onSubmit={handleSubmitComment}
        submitting={submitting}
      />

      {error && (
        <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-2">
          <i className="bi bi-exclamation-triangle"></i>{error}
        </div>
      )}

      {initialLoad ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted small text-center mb-0 py-2">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              isOwn={user?._id === comment.owner._id}
              isEditing={commentEdit.id === comment._id}
              isDeleting={deletingId === comment._id}
              savingEdit={commentEdit.saving}
              onStartEdit={() => startEdit(comment)}
              onSave={handleSaveEdit}
              onCancelEdit={cancelEdit}
              onDeleteRequest={() => setDeletingId(comment._id)}
              onDeleteConfirm={() => handleDeleteComment(comment._id)}
              onDeleteCancel={() => setDeletingId(null)}
              onNavigate={(userId) => navigate(`/profile/${userId}`)}
            />
          ))}

          <div ref={sentinelRef} className="text-center py-1">
            {loading && (
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
            {!loading && page >= totalPages && comments.length > 0 && (
              <small className="text-muted">All comments loaded</small>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostComments;
