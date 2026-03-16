import { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { type CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/useAuth";
import AuthCard from "../../components/AuthCard/AuthCard";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    profileImage: null as File | null,
    preview: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, profileImage: file, preview: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const formData = new FormData();
    formData.append("username", form.username);
    formData.append("email", form.email);
    formData.append("password", form.password);
    if (form.profileImage) {
      formData.append("profileImage", form.profileImage);
    }

    setIsLoading(true);
    try {
      await register(formData);
      navigate("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Registration failed.");
      } else {
        setError("Registration failed. Please try again.");
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
    <AuthCard subtitle="Create your account to start sharing">
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* Profile image upload */}
            <div className="d-flex justify-content-center mb-3">
              <label htmlFor="profileImage" className="cursor-pointer">
                {form.preview ? (
                  <div className="position-relative">
                    <img src={form.preview} alt="Preview" className="avatar-circle-lg" />
                    <div
                      className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 28, height: 28 }}
                    >
                      <i className="bi bi-camera-fill" style={{ fontSize: "0.8rem" }}></i>
                    </div>
                  </div>
                ) : (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center rounded-circle"
                    style={{
                      width: 100,
                      height: 100,
                      border: "2px dashed #ccc",
                      background: "linear-gradient(135deg, #fff3ee, #fff)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <i className="bi bi-camera fs-4 text-primary"></i>
                    <span className="text-muted" style={{ fontSize: "0.65rem" }}>Add Photo</span>
                  </div>
                )}
              </label>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </div>

            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className="form-control border-start-0"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control border-start-0 border-end-0"
                placeholder="Password (min 6 characters)"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
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
                  Creating account...
                </>
              ) : (
                "Create Account"
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
            Already have an account? <Link to="/login" className="fw-semibold text-decoration-none">Sign in</Link>
          </p>
    </AuthCard>
  );
};

export default Register;
