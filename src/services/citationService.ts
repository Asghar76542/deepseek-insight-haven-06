
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types/research';
import { Database } from '@/integrations/supabase/types';
import { toast } from "@/hooks/use-toast";
import { RealtimeChannel } from '@supabase/supabase-js';

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

// Validation function for citations
const validateCitation = (citation: Partial<Citation>): boolean => {
  if (!citation.citation_text?.trim()) {
    toast({
      title: "Validation Error",
      description: "Citation text is required",
      variant: "destructive",
    });
    return false;
  }
  return true;
};

let citationSubscription: RealtimeChannel | null = null;

export const citationService = {
  async fetchCitations(sessionId: string): Promise<Citation[]> {
    try {
      const { data, error } = await supabase
        .from('citations')
        .select('id, message_id, source_url, source_title, citation_text, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch citations: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      return (data || []).map(dbCitation => toAppCitation(dbCitation, sessionId));
    } catch (error) {
      console.error('Error in fetchCitations:', error);
      throw error;
    }
  },

  async updateCitation(id: string, citation: Partial<Citation>): Promise<void> {
    if (!validateCitation(citation)) return;

    try {
      const dbCitation = toDbCitation(citation);
      
      const { error } = await supabase
        .from('citations')
        .update(dbCitation)
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update citation: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Success",
        description: "Citation updated successfully",
      });
    } catch (error) {
      console.error('Error in updateCitation:', error);
      throw error;
    }
  },

  async createCitation(citation: Partial<Citation>): Promise<void> {
    if (!validateCitation(citation)) return;

    try {
      const dbCitation = toDbCitation(citation);
      
      const { error } = await supabase
        .from('citations')
        .insert([dbCitation]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create citation: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Success",
        description: "Citation created successfully",
      });
    } catch (error) {
      console.error('Error in createCitation:', error);
      throw error;
    }
  },

  async deleteCitation(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('citations')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete citation: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Success",
        description: "Citation deleted successfully",
      });
    } catch (error) {
      console.error('Error in deleteCitation:', error);
      throw error;
    }
  },

  async bookmarkCitation(messageId: string | null, sourceTitle: string | null): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          message_id: messageId,
          note: `Citation from: ${sourceTitle || 'Unknown source'}`
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to bookmark citation: " + error.message,
          variant: "destructive",
        });
        throw error;
      }

      toast({
        title: "Success",
        description: "Citation bookmarked successfully",
      });
    } catch (error) {
      console.error('Error in bookmarkCitation:', error);
      throw error;
    }
  },

  subscribeToChanges(sessionId: string, onUpdate: (citations: Citation[]) => void): void {
    // Clean up existing subscription if any
    if (citationSubscription) {
      citationSubscription.unsubscribe();
    }

    citationSubscription = supabase
      .channel('citations-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'citations' },
        async () => {
          // Fetch updated citations when changes occur
          const citations = await this.fetchCitations(sessionId);
          onUpdate(citations);
        }
      )
      .subscribe();
  },

  unsubscribeFromChanges(): void {
    if (citationSubscription) {
      citationSubscription.unsubscribe();
      citationSubscription = null;
    }
  }
};

