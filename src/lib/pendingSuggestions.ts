import type { Category } from "./types";

export type PendingSuggestion = {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  submittedAt: string;
};

export function toPendingSuggestion(input: {
  id: string;
  name: string;
  category: Category;
  lat: number;
  lng: number;
  createdAt: string;
}): PendingSuggestion {
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    lat: input.lat,
    lng: input.lng,
    submittedAt: input.createdAt,
  };
}
