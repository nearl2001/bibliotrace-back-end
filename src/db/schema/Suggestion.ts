interface Suggestion {
  suggestion_id?: number;
  timestamp?: string | null; // generated by MySQL if not provided
  content: string;
  campus_id: number;
}

export type { Suggestion };
