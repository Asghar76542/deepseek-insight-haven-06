
import { supabase } from "@/integrations/supabase/client";
import { Message, TokenMetrics, RuntimeMessageMetadata, StorageMessageMetadata } from "@/types/chat";
import { v4 as uuidv4 } from 'uuid';
import { Json } from '@/integrations/supabase/types';

const convertTokenMetricsForStorage = (metrics: TokenMetrics) => ({
  input_tokens: metrics.inputTokens,
  output_tokens: metrics.outputTokens,
  total_cost: metrics.totalCost
});

const analyzeMessage = async (content: string) => {
  try {
    const response = await fetch(
      'https://sqxyqqupoifcxejykntn.supabase.co/functions/v1/analyze-message',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ content })
      }
    );

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const analysis = await response.json();
    return analysis;
  } catch (error) {
    console.error('Error analyzing message:', error);
    return {
      sentiment: 0.5,
      complexity: 0.5,
      keyTerms: []
    };
  }
};

export const saveMessage = async (conversationId: string, message: Message): Promise<string | undefined> => {
  try {
    const messageId = uuidv4();
    const analysis = await analyzeMessage(message.content);
    
    // Prepare storage metadata
    const storageMetadata: StorageMessageMetadata = {
      ...message.metadata,
      sentiment: analysis.sentiment,
      complexity: analysis.complexity,
      keyTerms: analysis.keyTerms,
    };

    // Add token metrics if they exist
    if (message.metadata?.tokenMetrics) {
      storageMetadata.token_metrics = convertTokenMetricsForStorage(message.metadata.tokenMetrics);
    }

    const messageData = {
      id: messageId,
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      model_name: message.metadata?.model || '',
      metadata: storageMetadata as unknown as Json
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;
    
    return messageId;
  } catch (error) {
    console.error('Error saving message:', error);
    return undefined;
  }
};

export const calculateTokenMetrics = (text: string): TokenMetrics => {
  const estimatedTokens = Math.ceil(text.length / 4);
  const cost = (estimatedTokens / 1000) * 0.03; // Using default cost
  return {
    inputTokens: estimatedTokens,
    outputTokens: 0,
    totalCost: cost
  };
};

export const updateMessage = async (messageId: string, content: string, metadata: RuntimeMessageMetadata) => {
  const analysis = await analyzeMessage(content);
  
  // Prepare storage metadata
  const storageMetadata: StorageMessageMetadata = {
    ...metadata,
    sentiment: analysis.sentiment,
    complexity: analysis.complexity,
    keyTerms: analysis.keyTerms,
  };

  // Add token metrics if they exist
  if (metadata.tokenMetrics) {
    storageMetadata.token_metrics = convertTokenMetricsForStorage(metadata.tokenMetrics);
  }

  const { error } = await supabase
    .from('messages')
    .update({
      content,
      metadata: storageMetadata as unknown as Json
    })
    .eq('id', messageId);

  if (error) throw error;
};
