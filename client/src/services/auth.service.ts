import api from "./api";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    username: string;
    email: string;
    profileImage: string;
  };
}

export const registerUser = async (formData: FormData): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/api/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  return data;
};

export const googleLoginUser = async (
  credential: string
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/api/auth/google", {
    credential,
  });
  return data;
};

export const logoutUser = async (): Promise<void> => {
  const refreshToken = localStorage.getItem("refreshToken");
  await api.post("/api/auth/logout", { refreshToken });
};

export const getMe = async () => {
  const { data } = await api.get("/api/auth/me");
  return data;
};
