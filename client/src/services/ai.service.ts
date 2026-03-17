import api from "./api";

export interface AISearchSource {
  postId: string;
  dishName: string;
  restaurant: string;
}

export interface AISearchResponse {
  answer: string;
  sources: AISearchSource[];
}

export const aiSearch = async (query: string): Promise<AISearchResponse> => {
  const { data } = await api.post<AISearchResponse>("/api/ai/search", { query });
  return data;
};
