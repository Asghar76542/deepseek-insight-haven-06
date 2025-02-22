export type ResearchStatus = 'active' | 'archived' | 'completed';

export interface ResearchCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at?: string;
}

export interface ResearchTag {
  id: string;
  name: string;
  created_at?: string;
}

export interface ResearchSession {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  status: ResearchStatus;
  is_shared: boolean;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  tags?: ResearchTag[];
  category?: ResearchCategory;
  total_messages?: number;
  total_citations?: number;
}

export interface Citation {
  id: string;
  message_id: string | null;
  source_url: string | null;
  source_title: string | null;
  citation_text: string | null;
  created_at: string | null;
  session_id?: string;
}

export interface Bookmark {
  id: string;
  message_id: string | null;
  note: string | null;
  created_at: string | null;
}

export interface ConversationSettings {
  model_temperature?: number;
  max_tokens?: number;
  context_window?: number;
  custom_instructions?: string;
}

export interface SessionAnalytics {
  total_messages: number;
  total_citations: number;
  last_activity: string;
  topics: { name: string; count: number }[];
  most_cited_sources: { title: string; count: number }[];
}

export interface SearchFilters {
  categories?: string[];
  tags?: string[];
  status?: ResearchStatus[];
  dateRange?: { from: string; to: string };
  searchTerm?: string;
}
