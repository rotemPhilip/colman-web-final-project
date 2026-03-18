import { getImageUrl } from "../../utils/image";

interface AvatarProps {
  username?: string;
  profileImage?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: { img: "avatar-circle-sm", placeholder: "avatar-placeholder avatar-placeholder-sm" },
  md: { img: "avatar-circle",    placeholder: "avatar-placeholder" },
  lg: { img: "avatar-circle-lg", placeholder: "avatar-placeholder avatar-placeholder-lg" },
};

const Avatar = ({ username, profileImage, size = "sm", onClick, className = "" }: AvatarProps) => {
  const classes = sizeMap[size];
  const initial = username?.charAt(0).toUpperCase() || "?";

  if (profileImage) {
    return (
      <img
        src={getImageUrl(profileImage)}
        alt={username}
        className={`${classes.img} ${className}`}
        onClick={onClick}
        style={onClick ? { cursor: "pointer" } : undefined}
      />
    );
  }

  return (
    <div
      className={`${classes.placeholder} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {initial}
    </div>
  );
};

export default Avatar;
