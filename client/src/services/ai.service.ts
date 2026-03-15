import api from "./api";

export interface AISearchResult {
  post: {
    _id: string;
    dishName: string;
    restaurant: string;
    description?: string;
    image?: string;
    owner: {
      _id: string;
      username: string;
      profileImage?: string;
    };
    createdAt: string;
    commentCount?: number;
  };
  relevance: string;
}

export interface AISearchResponse {
  results: AISearchResult[];
  summary: string;
}

export const aiSearch = async (query: string): Promise<AISearchResponse> => {
  const { data } = await api.post<AISearchResponse>("/api/ai/search", { query });
  return data;
};
