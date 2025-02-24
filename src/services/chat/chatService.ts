
import { supabase } from "@/integrations/supabase/client";
import { Message, TokenMetrics, TokenMetricsJson } from "@/types/chat";
import { v4 as uuidv4 } from 'uuid';
import { Json } from '@/integrations/supabase/types';

const convertTokenMetricsToJson = (metrics: TokenMetrics): TokenMetricsJson => ({
  input_tokens: metrics.inputTokens,
  output_tokens: metrics.outputTokens,
  total_cost: metrics.totalCost
});

export const saveMessage = async (conversationId: string, message: Message): Promise<string | undefined> => {
  try {
    const messageId = uuidv4();
    const messageData = {
      id: messageId,
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      model_name: message.metadata?.model || '',
      metadata: {
        ...message.metadata,
        tokenMetricsJson: message.metadata?.tokenMetrics 
          ? convertTokenMetricsToJson(message.metadata.tokenMetrics)
          : undefined
      } as Json
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

export const updateMessage = async (messageId: string, content: string, metadata: MessageMetadata) => {
  const { error } = await supabase
    .from('messages')
    .update({
      content,
      metadata: {
        ...metadata,
        tokenMetricsJson: metadata.tokenMetrics 
          ? convertTokenMetricsToJson(metadata.tokenMetrics)
          : undefined
      } as Json
    })
    .eq('id', messageId);

  if (error) throw error;
};
