
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types/research';
import { Database } from '@/integrations/supabase/types';

type DbCitation = Database['public']['Tables']['citations']['Row'];

export const citationService = {
  async fetchCitations(sessionId: string): Promise<Citation[]> {
    const { data, error } = await supabase
      .from('citations')
      .select('id, message_id, source_url, source_title, citation_text, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform database citations to match the Citation type
    return (data || []).map((citation: DbCitation) => ({
      ...citation,
      session_id: sessionId
    }));
  },

  async updateCitation(id: string, citation: Partial<Citation>): Promise<void> {
    // Remove session_id from the update payload since it doesn't exist in the DB
    const { session_id, ...dbCitation } = citation;
    
    const { error } = await supabase
      .from('citations')
      .update(dbCitation)
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async createCitation(citation: Partial<Citation>): Promise<void> {
    // Remove session_id from the update payload since it doesn't exist in the DB
    const { session_id, ...dbCitation } = citation;
    
    const { error } = await supabase
      .from('citations')
      .insert([dbCitation]);

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
