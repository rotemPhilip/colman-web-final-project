import {
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  loginUser,
  registerUser,
  googleLoginUser,
  logoutUser,
  getMe,
  type AuthResponse,
} from "../services/auth.service";
import { AuthContext, type User } from "./authTypes";

const saveTokens = (data: AuthResponse) => {
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if user is already logged in (remember user)
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch {
          localStorage.clear();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginUser(email, password);
    saveTokens(data);
    setUser(data.user);
  };

  const register = async (formData: FormData) => {
    const data = await registerUser(formData);
    saveTokens(data);
    setUser(data.user);
  };

  const googleLogin = async (credential: string) => {
    const data = await googleLoginUser(credential);
    saveTokens(data);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
