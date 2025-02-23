
import { Citation } from '@/types/research';
import { Database } from '@/integrations/supabase/types';

// Define types for the database citation
export type DbCitation = Database['public']['Tables']['citations']['Row'];
export type InsertDbCitation = Database['public']['Tables']['citations']['Insert'];
export type UpdateDbCitation = Database['public']['Tables']['citations']['Update'];

// Transform function to convert database citation to application citation
export const toAppCitation = (dbCitation: DbCitation, sessionId: string): Citation => ({
  id: dbCitation.id,
  message_id: dbCitation.message_id,
  source_url: dbCitation.source_url,
  source_title: dbCitation.source_title,
  citation_text: dbCitation.citation_text,
  created_at: dbCitation.created_at,
  session_id: sessionId
});

// Transform function to convert application citation to database citation
export const toDbCitation = (citation: Partial<Citation>): Partial<InsertDbCitation> => {
  // Exclude session_id as it doesn't exist in the database
  const { session_id, ...dbCitation } = citation;
  return dbCitation;
};
