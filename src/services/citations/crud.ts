
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types/research';
import { toast } from "@/hooks/use-toast";
import { toAppCitation, toDbCitation } from './transformers';
import { validateCitation } from './validation';

export const fetchCitations = async (sessionId: string): Promise<Citation[]> => {
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
};

export const updateCitation = async (id: string, citation: Partial<Citation>): Promise<void> => {
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
};

export const createCitation = async (citation: Partial<Citation>): Promise<void> => {
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
};

export const deleteCitation = async (id: string): Promise<void> => {
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
};

export const bookmarkCitation = async (messageId: string | null, sourceTitle: string | null): Promise<void> => {
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
};
