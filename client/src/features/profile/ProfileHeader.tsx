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

  return (
    <div className="card border-0 shadow-sm mt-4 overflow-hidden">
      <div className="profile-banner"></div>
      <div className="card-body p-4 pt-0 text-center">
        {/* Avatar */}
        <div className="d-flex justify-content-center" style={{ marginTop: -55 }}>
          <div className="profile-avatar-wrapper">
            {isEditing ? (
              <div className="text-center">
                <div
                  className="position-relative cursor-pointer d-inline-block"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="avatar-circle-lg bg-white"
                      style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                    />
                  ) : (
                    <div
                      className="avatar-placeholder avatar-placeholder-lg"
                      style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                    >
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 32, height: 32, border: "2px solid white" }}
                  >
                    <i className="bi bi-camera-fill" style={{ fontSize: "0.85rem" }}></i>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageChange} hidden />
                </div>
                {(profileEdit.preview || (!profileEdit.removeImage && profile.profileImage)) && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger text-decoration-none mt-1 p-0 d-block mx-auto"
                    onClick={onRemoveImage}
                  >
                    <i className="bi bi-x-circle me-1"></i>Remove
                  </button>
                )}
              </div>
            ) : (
              profile.profileImage ? (
                <img
                  src={getImageUrl(profile.profileImage)}
                  alt={profile.username}
                  className="avatar-circle-lg bg-white"
                  style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                />
              ) : (
                <div
                  className="avatar-placeholder avatar-placeholder-lg"
                  style={{ border: "4px solid white", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
                >
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )
            )}
          </div>
        </div>

        {/* Profile Details */}
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
                  {saving ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
                  ) : (
                    <><i className="bi bi-check-lg me-1"></i>Save</>
                  )}
                </button>
                <button onClick={onEditCancel} className="btn btn-light btn-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="fw-bold mb-1">{profile.username}</h4>
              <p className="text-muted small mb-1">
                <i className="bi bi-envelope me-1"></i>{profile.email}
              </p>
              <p className="small mb-2">
                <strong className="text-primary">{postCount}</strong>{" "}
                <span className="text-muted">posts</span>
              </p>
              {isOwnProfile && (
                <button onClick={onEditStart} className="btn btn-outline-primary btn-sm">
                  <i className="bi bi-pencil me-1"></i>Edit Profile
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
