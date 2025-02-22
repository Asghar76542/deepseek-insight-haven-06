
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types/research';

type DbResponse<T> = {
  data: T | null;
  error: Error | null;
};

export const citationService = {
  async fetchCitations(sessionId: string): Promise<Citation[]> {
    const result: DbResponse<Citation[]> = await supabase
      .from('citations')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (result.error) {
      throw result.error;
    }

    return result.data || [];
  },

  async updateCitation(id: string, citation: Partial<Citation>): Promise<void> {
    const { error } = await supabase
      .from('citations')
      .update(citation)
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async createCitation(citation: Partial<Citation>): Promise<void> {
    const { error } = await supabase
      .from('citations')
      .insert([citation]);

    if (error) {
      throw error;
    }
  },

  async deleteCitation(id: string): Promise<void> {
    const { error } = await supabase
      .from('citations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async bookmarkCitation(messageId: string | null, sourceTitle: string | null): Promise<void> {
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        message_id: messageId,
        note: `Citation from: ${sourceTitle || 'Unknown source'}`
      });

    if (error) {
      throw error;
    }
  }
};
