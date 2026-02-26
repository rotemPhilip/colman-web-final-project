import { useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { type CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/useAuth";
import "./Auth.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState("");
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    if (profileImage) {
      formData.append("profileImage", profileImage);
    }

    try {
      await register(formData);
      navigate("/");
    } catch {
      setError("Registration failed. Email may already be in use.");
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (response.credential) {
      try {
        await googleLogin(response.credential);
        navigate("/");
      } catch {
        setError("Google login failed.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🍽️ BiteShare</h1>
        <p className="auth-subtitle">Create your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="image-upload">
            <label htmlFor="profileImage" className="image-upload-label">
              {preview ? (
                <img src={preview} alt="Preview" className="image-preview" />
              ) : (
                <div className="image-placeholder">📷 Add Photo</div>
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

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" className="auth-btn">
            Register
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed.")}
          />
        </div>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
