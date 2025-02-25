
import { Json } from '@/integrations/supabase/types';

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

// These are the raw types we use in the application
export interface MessageMetadata {
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  model?: string;
  timestamp?: string;
  sentiment?: number;
  complexity?: number;
  keyTerms?: string[];
}

// This interface extends MessageMetadata to include runtime-only properties
export interface RuntimeMessageMetadata extends MessageMetadata {
  tokenMetrics?: TokenMetrics;
}

// This interface represents how we store the data in Supabase
export interface StorageMessageMetadata extends MessageMetadata {
  token_metrics?: {
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
  };
  [key: string]: Json | undefined;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: RuntimeMessageMetadata;
}

export interface ModelOption {
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  costPer1kTokens: number;
  maxTokens: number;
}
