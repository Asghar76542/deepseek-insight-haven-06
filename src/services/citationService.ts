
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types/research';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

type CitationRecord = {
  id: string;
  message_id: string | null;
  source_url: string | null;
  source_title: string | null;
  citation_text: string | null;
  created_at: string | null;
  session_id?: string;
}

export const citationService = {
  async fetchCitations(sessionId: string): Promise<Citation[]> {
    const { data, error }: PostgrestSingleResponse<CitationRecord[]> = await supabase
      .from('citations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
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
