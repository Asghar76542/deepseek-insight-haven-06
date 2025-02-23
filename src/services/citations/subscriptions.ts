
import { supabase } from "@/integrations/supabase/client";
import { Citation } from '@/types/research';
import { RealtimeChannel } from '@supabase/supabase-js';
import { fetchCitations } from './crud';

let citationSubscription: RealtimeChannel | null = null;

export const subscribeToChanges = (sessionId: string, onUpdate: (citations: Citation[]) => void): void => {
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
        const citations = await fetchCitations(sessionId);
        onUpdate(citations);
      }
    )
    .subscribe();
};

export const unsubscribeFromChanges = (): void => {
  if (citationSubscription) {
    citationSubscription.unsubscribe();
    citationSubscription = null;
  }
};
