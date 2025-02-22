
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types/research';
import { Database } from '@/integrations/supabase/types';

// Define types for the database citation
type DbCitation = Database['public']['Tables']['citations']['Row'];
type InsertDbCitation = Database['public']['Tables']['citations']['Insert'];
type UpdateDbCitation = Database['public']['Tables']['citations']['Update'];

// Transform function to convert database citation to application citation
const toAppCitation = (dbCitation: DbCitation, sessionId: string): Citation => ({
  id: dbCitation.id,
  message_id: dbCitation.message_id,
  source_url: dbCitation.source_url,
  source_title: dbCitation.source_title,
  citation_text: dbCitation.citation_text,
  created_at: dbCitation.created_at,
  session_id: sessionId
});

// Transform function to convert application citation to database citation
const toDbCitation = (citation: Partial<Citation>): Partial<InsertDbCitation> => {
  // Exclude session_id as it doesn't exist in the database
  const { session_id, ...dbCitation } = citation;
  return dbCitation;
};

export const citationService = {
  async fetchCitations(sessionId: string): Promise<Citation[]> {
    const { data, error } = await supabase
      .from('citations')
      .select('id, message_id, source_url, source_title, citation_text, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform database citations to application citations
    return (data || []).map(dbCitation => toAppCitation(dbCitation, sessionId));
  },

  async updateCitation(id: string, citation: Partial<Citation>): Promise<void> {
    const dbCitation = toDbCitation(citation);
    
    const { error } = await supabase
      .from('citations')
      .update(dbCitation)
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async createCitation(citation: Partial<Citation>): Promise<void> {
    const dbCitation = toDbCitation(citation);
    
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
