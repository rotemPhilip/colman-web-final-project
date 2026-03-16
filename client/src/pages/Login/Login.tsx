import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { type CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/useAuth";
import AuthCard from "../../components/AuthCard/AuthCard";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!credentials.username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!credentials.password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(credentials.username, credentials.password);
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
    <AuthCard subtitle="Sign in to share your dining experiences">
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Username or Email"
                value={credentials.username}
                onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
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
                value={credentials.password}
                onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
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
    </AuthCard>
  );
};

export default Login;
