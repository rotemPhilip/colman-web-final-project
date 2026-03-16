import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import Avatar from "../Avatar/Avatar";

interface AppNavbarProps {
  filter?: "all" | "mine";
  onFilterChange?: (f: "all" | "mine") => void;
  showBack?: boolean;
  showLogout?: boolean;
}

const AppNavbar = ({
  filter,
  onFilterChange,
  showBack = false,
  showLogout = true,
}: AppNavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-light bg-white sticky-top border-bottom">
      <div className="container-fluid d-flex justify-content-between align-items-center px-4 py-2">

        {/* Left: back button (optional) + logo */}
        <div className="d-flex align-items-center gap-2">
          {showBack && (
            <button
              className="btn btn-sm border-0 text-secondary p-1"
              onClick={() => navigate(-1)}
              title="Go back"
            >
              <i className="bi bi-arrow-left fs-5"></i>
            </button>
          )}
          <span
            className="navbar-brand fw-bold text-primary mb-0 fs-5 cursor-pointer d-flex align-items-center gap-2"
            onClick={() => navigate("/")}
          >
            <img src="/favicon.svg" alt="" width="28" height="28" />
            BiteShare
          </span>
        </div>

        {/* Center: filter chips (home only) */}
        {onFilterChange && (
          <div className="d-flex gap-2">
            <button
              className={`biteshare-chip ${filter === "all" ? "biteshare-chip-active" : "biteshare-chip-inactive"}`}
              onClick={() => onFilterChange("all")}
            >
              <i className="bi bi-globe me-1"></i>All Posts
            </button>
            <button
              className={`biteshare-chip ${filter === "mine" ? "biteshare-chip-active" : "biteshare-chip-inactive"}`}
              onClick={() => onFilterChange("mine")}
            >
              <i className="bi bi-person me-1"></i>My Posts
            </button>
          </div>
        )}

        {/* Right: profile area + divider + logout */}
        <div className="d-flex align-items-center">
          <button
            className="btn btn-sm border-0 d-flex align-items-center gap-2 fw-semibold text-dark px-2"
            onClick={() => navigate(`/profile/${user?._id}`)}
            title="My Profile"
          >
            <Avatar
              username={user?.username}
              profileImage={user?.profileImage}
              size="sm"
            />
            <span className="small">{user?.username}</span>
          </button>

          {showLogout && (
            <>
              <div className="vr mx-2 opacity-25"></div>
              <button
                className="btn btn-sm border-0 text-secondary px-2"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
