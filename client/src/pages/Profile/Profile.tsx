import { useNavigate } from "react-router-dom";
import "./Profile.css";
import AppNavbar from "../../components/AppNavbar/AppNavbar";
import Toast from "../../components/Toast/Toast";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { useProfile } from "../../features/profile/useProfile";
import ProfileHeader from "../../features/profile/ProfileHeader";
import ProfilePosts from "../../features/profile/ProfilePosts";

const Profile = () => {
  const navigate = useNavigate();
  const {
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
    handleToggleLike,
  } = useProfile();

  if (loading) return <LoadingSpinner message="Loading profile..." />;

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

  if (!profile) return null;

  return (
    <div className="min-vh-100 bg-light">
      <Toast toast={toast} />
      <AppNavbar showBack />

      <main className="container" style={{ maxWidth: 700 }}>
        {error && (
          <div className="alert alert-danger py-2 small mt-3 d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle"></i>{error}
            <button className="btn-close btn-close-sm ms-auto" onClick={() => setError("")}></button>
          </div>
        )}

        <ProfileHeader
          profile={profile}
          postCount={posts.length}
          isOwnProfile={isOwnProfile}
          isEditing={isEditing}
          profileEdit={profileEdit}
          saving={saving}
          fileInputRef={fileInputRef}
          onEditStart={handleEditStart}
          onEditCancel={handleEditCancel}
          onEditSave={handleEditSave}
          onUsernameChange={(v) => setProfileEdit((prev) => ({ ...prev, username: v }))}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
        />

        <ProfilePosts
          posts={posts}
          profile={profile}
          isOwnProfile={isOwnProfile}
          showNewPost={showNewPost}
          loadingMore={loadingMore}
          page={page}
          totalPages={totalPages}
          sentinelRef={sentinelRef}
          onShowNewPost={() => setShowNewPost(true)}
          onCreatePost={handleCreatePost}
          onCancelNewPost={() => setShowNewPost(false)}
          onEditPostSave={handleEditPostSave}
          onDeletePost={handleDeletePost}
          onToggleLike={handleToggleLike}
        />
      </main>
    </div>
  );
};

export default Profile;