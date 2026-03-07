import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>🍽️ BiteShare</h1>
        <div className="home-user">
          <button
            onClick={() => navigate(`/profile/${user?._id}`)}
            className="profile-link-btn"
          >
            👤 My Profile
          </button>
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      <main className="home-main">
        <p>Feed coming soon...</p>
      </main>
    </div>
  );
};

export default Home;
