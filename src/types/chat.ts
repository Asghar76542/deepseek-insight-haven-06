
import { Json } from '@/integrations/supabase/types';

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

// Convert TokenMetrics to a JSON-compatible format
export interface TokenMetricsJson {
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
}

export interface MessageMetadata {
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  model?: string;
  timestamp?: string;
  tokenMetricsJson?: TokenMetricsJson;
  sentiment?: number;
  complexity?: number;
  [key: string]: Json | undefined;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: MessageMetadata;
}

export interface ModelOption {
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  costPer1kTokens: number;
  maxTokens: number;
}
