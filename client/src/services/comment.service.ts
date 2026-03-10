import api from "./api";

export interface Comment {
  _id: string;
  content: string;
  post: string;
  owner: {
    _id: string;
    username: string;
    profileImage: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedComments {
  comments: Comment[];
  total: number;
  page: number;
  pages: number;
}

export const getCommentsByPost = async (
  postId: string,
  page = 1,
  limit = 20
): Promise<PaginatedComments> => {
  const { data } = await api.get<PaginatedComments>(
    `/api/comments/${postId}?page=${page}&limit=${limit}`
  );
  return data;
};

export const createComment = async (
  postId: string,
  content: string
): Promise<Comment> => {
  const { data } = await api.post<Comment>(`/api/comments/${postId}`, {
    content,
  });
  return data;
};

export const updateComment = async (
  commentId: string,
  content: string
): Promise<Comment> => {
  const { data } = await api.put<Comment>(`/api/comments/${commentId}`, {
    content,
  });
  return data;
};

export const deleteComment = async (commentId: string): Promise<void> => {
  await api.delete(`/api/comments/${commentId}`);
};
