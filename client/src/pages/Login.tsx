import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { type CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/useAuth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Login failed.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (response.credential) {
      setIsLoading(true);
      try {
        await googleLogin(response.credential);
        navigate("/");
      } catch {
        setError("Google login failed.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{
        background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 30%, #f7c59f 60%, #ffe8d6 100%)",
        backgroundSize: "200% 200%",
      }}
    >
      <div className="card shadow-lg border-0 p-4 animate-fade-in" style={{ maxWidth: 420, width: "100%", borderRadius: 24 }}>
        <div className="card-body text-center">
          <div className="mb-3">
            <img src="/favicon.svg" alt="BiteShare" width="56" height="56" style={{ filter: "drop-shadow(0 4px 12px rgba(255,107,53,0.3))" }} />
          </div>
          <h1 className="h3 fw-bold mb-1 text-primary">BiteShare</h1>
          <p className="text-muted small mb-4">Sign in to share your dining experiences</p>

          {error && (
            <div className="alert alert-danger py-2 small">{error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Username or Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control border-start-0 border-end-0"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-group-text bg-light border-start-0 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="d-flex align-items-center my-4">
            <hr className="flex-grow-1" />
            <span className="px-3 text-muted small text-uppercase">or continue with</span>
            <hr className="flex-grow-1" />
          </div>

          <div className="d-flex justify-content-center mb-3">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google login failed.")}
            />
          </div>

          <p className="text-muted small mb-0">
            Don't have an account? <Link to="/register" className="fw-semibold text-decoration-none">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
