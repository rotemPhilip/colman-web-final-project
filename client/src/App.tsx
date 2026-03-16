import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Register />}
      />
      <Route
        path="/"
        element={user ? <Home /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile/:id"
        element={user ? <Profile /> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;
