
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
}

export interface Citation {
  id: string;
  message_id: string;
  source_url?: string;
  source_title?: string;
  citation_text: string;
  created_at?: string;
}

export interface Bookmark {
  id: string;
  message_id: string;
  note?: string;
  created_at?: string;
}

export interface ConversationSettings {
  model_temperature?: number;
  max_tokens?: number;
  context_window?: number;
  custom_instructions?: string;
}
