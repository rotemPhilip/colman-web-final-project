import { useNavigate } from "react-router-dom";
import "./PostDetail.css";
import AppNavbar from "../../components/AppNavbar/AppNavbar";
import Avatar from "../../components/Avatar/Avatar";
import Toast from "../../components/Toast/Toast";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { getImageUrl } from "../../utils/image";
import { usePostDetail } from "../../features/post/usePostDetail";
import CommentItem from "../../features/post/CommentItem";
import NewCommentForm from "../../features/post/NewCommentForm";

const PostDetail = () => {
  const navigate = useNavigate();
  const {
    user,
    post,
    loadingPost,
    comments,
    page,
    totalPages,
    loadingComments,
    initialLoad,
    newComment,
    submitting,
    commentEdit,
    deletingId,
    error,
    toast,
    sentinelRef,
    setNewComment,
    setDeletingId,
    handleSubmitComment,
    startEdit,
    cancelEdit,
    handleSaveEdit,
    handleDeleteComment,
  } = usePostDetail();

  if (loadingPost) return <LoadingSpinner message="Loading post..." />;

  if (!post) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-light gap-3 animate-fade-in">
        <i className="bi bi-file-earmark-x text-muted" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
        <p className="text-danger">{error || "Post not found."}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          <i className="bi bi-arrow-left me-1"></i>Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Toast toast={toast} />
      <AppNavbar showBack />

      <main className="container pb-5" style={{ maxWidth: 640 }}>
        <div className="py-4">
          {/* Post Card */}
          <div className="card border-0 shadow-sm overflow-hidden mb-4 animate-fade-in">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-2 px-3">
              <div
                className="d-flex align-items-center gap-2 cursor-pointer"
                onClick={() => navigate(`/profile/${post.owner._id}`)}
              >
                <Avatar
                  username={post.owner.username}
                  profileImage={post.owner.profileImage}
                  onClick={() => navigate(`/profile/${post.owner._id}`)}
                />
                <div>
                  <span className="fw-semibold small d-block">{post.owner.username}</span>
                  <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </small>
                </div>
              </div>
            </div>

            {post.image && (
              <img
                src={getImageUrl(post.image)}
                alt={post.dishName}
                className="card-img-top"
                style={{ maxHeight: 450, objectFit: "cover" }}
              />
            )}
            <div className="card-body">
              <h5 className="card-title fw-bold mb-1">{post.dishName}</h5>
              <p className="text-primary small fw-semibold mb-2">
                <i className="bi bi-geo-alt-fill me-1"></i>{post.restaurant}
              </p>
              <p className="card-text text-muted">{post.description}</p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="card border-0 shadow-sm animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="card-header bg-white px-3">
              <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-chat-dots text-primary"></i>
                Comments ({post.commentCount || 0})
              </h6>
            </div>

            <div className="card-body px-3">
              <NewCommentForm
                username={user?.username}
                profileImage={user?.profileImage}
                value={newComment}
                onChange={setNewComment}
                onSubmit={handleSubmitComment}
                submitting={submitting}
              />

              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              {initialLoad ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-chat text-muted" style={{ fontSize: "2rem", opacity: 0.3 }}></i>
                  <p className="text-muted small mt-2 mb-0">No comments yet. Start the conversation!</p>
                </div>
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

                  <div ref={sentinelRef} className="text-center py-2">
                    {loadingComments && (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    )}
                    {!loadingComments && page >= totalPages && comments.length > 0 && (
                      <small className="text-muted">All comments loaded</small>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;