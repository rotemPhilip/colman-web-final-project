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
  createdAt: string;
  updatedAt: string;
}

export const getPostsByUser = async (userId: string): Promise<Post[]> => {
  const { data } = await api.get<Post[]>(`/api/posts/user/${userId}`);
  return data;
};

export const getAllPosts = async (): Promise<Post[]> => {
  const { data } = await api.get<Post[]>("/api/posts");
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
