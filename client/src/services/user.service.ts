import api from "./api";

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profileImage: string;
  createdAt: string;
}

export const getUserById = async (id: string): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>(`/api/users/${id}`);
  return data;
};

export const updateProfile = async (formData: FormData): Promise<UserProfile> => {
  const { data } = await api.put<UserProfile>("/api/users/profile", formData);
  return data;
};
