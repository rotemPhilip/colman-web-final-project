export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const getImageUrl = (img?: string): string => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${API_URL}${img}`;
};
