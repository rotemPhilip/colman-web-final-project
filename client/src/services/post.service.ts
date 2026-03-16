import api from "./api";

export interface Post {
  _id: string;
  dishName: string;
  restaurant: string;
  description: string;
  image: string;
  owner: {
    _id: string;
    username: string;
    profileImage: string;
  };
  commentCount: number;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPosts {
  posts: Post[];
  total: number;
  page: number;
  pages: number;
}

export const getPostById = async (id: string): Promise<Post> => {
  const { data } = await api.get<Post>(`/api/posts/${id}`);
  return data;
};

export const getPostsByUser = async (
  userId: string,
  page = 1,
  limit = 10
): Promise<PaginatedPosts> => {
  const { data } = await api.get<PaginatedPosts>(
    `/api/posts/user/${userId}?page=${page}&limit=${limit}`
  );
  return data;
};

export const getAllPosts = async (
  page = 1,
  limit = 10
): Promise<PaginatedPosts> => {
  const { data } = await api.get<PaginatedPosts>(
    `/api/posts?page=${page}&limit=${limit}`
  );
  return data;
};

export const createPost = async (formData: FormData): Promise<Post> => {
  const { data } = await api.post<Post>("/api/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updatePost = async (
  id: string,
  formData: FormData
): Promise<Post> => {
  const { data } = await api.put<Post>(`/api/posts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/api/posts/${id}`);
};

export const toggleLike = async (id: string): Promise<{ likesCount: number; isLikedByCurrentUser: boolean }> => {
  const { data } = await api.post(`/api/posts/${id}/like`);
  return data;
};
