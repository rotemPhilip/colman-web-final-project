import { createContext } from "react";

export interface User {
  _id: string;
  username: string;
  email: string;
  profileImage: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (formData: FormData) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
