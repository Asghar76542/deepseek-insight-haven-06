
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types/research';
import { Database } from '@/integrations/supabase/types';

type CitationRow = Database['public']['Tables']['citations']['Row'];

export const citationService = {
  async fetchCitations(sessionId: string) {
    const { data, error } = await supabase
      .from('citations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .returns<CitationRow[]>();

    if (error) {
      throw error;
    }

    return (data || []) as Citation[];
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
