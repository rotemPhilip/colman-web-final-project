import type { ChangeEvent, RefObject } from "react";
import type { UserProfile } from "../../services/user.service";
import { getImageUrl } from "../../utils/image";

interface ProfileEditState {
  username: string;
  preview: string;
  removeImage: boolean;
}

interface ProfileHeaderProps {
  profile: UserProfile;
  postCount: number;
  isOwnProfile: boolean;
  isEditing: boolean;
  profileEdit: ProfileEditState;
  saving: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onUsernameChange: (value: string) => void;
  onImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

const avatarStyle = { border: "6px solid white", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" };

const ProfileHeader = ({
  profile,
  postCount,
  isOwnProfile,
  isEditing,
  profileEdit,
  saving,
  fileInputRef,
  onEditStart,
  onEditCancel,
  onEditSave,
  onUsernameChange,
  onImageChange,
  onRemoveImage,
}: ProfileHeaderProps) => {
  const avatarSrc = profileEdit.preview || (!profileEdit.removeImage ? getImageUrl(profile.profileImage) : "");

  const avatarImg = (src: string, alt: string) => (
    <img src={src} alt={alt} className="avatar-circle-lg bg-white" style={avatarStyle} />
  );

  const avatarPlaceholder = (letter: string) => (
    <div className="avatar-placeholder avatar-placeholder-lg" style={avatarStyle}>
      {letter}
    </div>
  );

  const displayAvatar = avatarSrc
    ? avatarImg(avatarSrc, "Profile")
    : avatarPlaceholder(profile.username.charAt(0).toUpperCase());

  const viewAvatar = profile.profileImage
    ? avatarImg(getImageUrl(profile.profileImage), profile.username)
    : avatarPlaceholder(profile.username.charAt(0).toUpperCase());

  return (
    <div className="card border-0 shadow-sm mt-4 overflow-hidden">
      <div className="profile-banner" />
      <div className="card-body p-5 text-center">

        {/* Avatar */}
        <div className="d-flex justify-content-center" style={{ marginTop: -75 }}>
          <div className="profile-avatar-wrapper">
            {isEditing ? (
              <div className="text-center">
                <div
                  className="position-relative cursor-pointer d-inline-block"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {displayAvatar}
                  <div
                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, border: "2px solid white" }}
                  >
                    <i className="bi bi-camera-fill" style={{ fontSize: "0.85rem" }} />
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageChange} hidden />
                </div>
                {(profileEdit.preview || (!profileEdit.removeImage && profile.profileImage)) && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger text-decoration-none mt-1 p-0 d-block mx-auto"
                    onClick={onRemoveImage}
                  >
                    <i className="bi bi-x-circle me-1" />Remove
                  </button>
                )}
              </div>
            ) : viewAvatar}
          </div>
        </div>

        {/* Profile info */}
        <div className="mt-3">
          {isEditing ? (
            <div className="animate-fade-in" style={{ maxWidth: 320, margin: "0 auto" }}>
              <input
                type="text"
                value={profileEdit.username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className="form-control mb-2"
                placeholder="Username"
              />
              <div className="d-flex gap-2 justify-content-center">
                <button onClick={onEditSave} className="btn btn-primary btn-sm px-3" disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</>
                    : <><i className="bi bi-check-lg me-1" />Save</>}
                </button>
                <button onClick={onEditCancel} className="btn btn-light btn-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="fw-bold mb-1" style={{ fontSize: "1.75rem" }}>{profile.username}</h3>
              <p className="text-muted mb-2" style={{ fontSize: "0.875rem" }}>
                <i className="bi bi-envelope me-1" />{profile.email}
              </p>
              <p className="mb-3" style={{ fontSize: "0.95rem" }}>
                <strong className="text-primary" style={{ fontSize: "1.2rem" }}>{postCount}</strong>{" "}
                <span className="text-muted">{postCount === 1 ? "post" : "posts"}</span>
              </p>
              {isOwnProfile && (
                <button onClick={onEditStart} className="btn btn-primary px-4 py-2">
                  <i className="bi bi-pencil-square me-2" />Edit Profile
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;

