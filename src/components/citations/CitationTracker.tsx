
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CitationItem } from './CitationItem';
import { CitationForm } from './CitationForm';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from '@/integrations/supabase/types';

interface CitationTrackerProps {
  sessionId: string;
}

type Citation = Database['public']['Tables']['citations']['Row'];
type CitationInput = Omit<Citation, 'id' | 'created_at'>;

export const CitationTracker = ({ sessionId }: CitationTrackerProps) => {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCitation, setEditingCitation] = useState<Citation | null>(null);

  const fetchCitations = async () => {
    const { data, error } = await supabase
      .from('citations')
      .select()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching citations:', error);
      toast({
        title: "Error",
        description: "Failed to load citations",
        variant: "destructive",
      });
      return;
    }

    setCitations(data || []);
  };

  useEffect(() => {
    fetchCitations();
  }, [sessionId]);

  const handleSubmit = async (citationData: Partial<CitationInput>) => {
    try {
      if (editingCitation?.id) {
        const { error } = await supabase
          .from('citations')
          .update({
            citation_text: citationData.citation_text,
            source_title: citationData.source_title,
            source_url: citationData.source_url,
            message_id: citationData.message_id
          })
          .eq('id', editingCitation.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Citation updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('citations')
          .insert([{
            citation_text: citationData.citation_text,
            source_title: citationData.source_title,
            source_url: citationData.source_url,
            message_id: citationData.message_id,
            session_id: sessionId
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Citation added successfully",
        });
      }

      setIsFormOpen(false);
      setEditingCitation(null);
      fetchCitations();
    } catch (error) {
      console.error('Error saving citation:', error);
      toast({
        title: "Error",
        description: "Failed to save citation",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('citations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Citation deleted successfully",
      });

      fetchCitations();
    } catch (error) {
      console.error('Error deleting citation:', error);
      toast({
        title: "Error",
        description: "Failed to delete citation",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async (citation: Citation) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          message_id: citation.message_id,
          note: `Citation from: ${citation.source_title || 'Unknown source'}`
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Citation bookmarked successfully",
      });
    } catch (error) {
      console.error('Error bookmarking citation:', error);
      toast({
        title: "Error",
        description: "Failed to bookmark citation",
        variant: "destructive",
      });
    }
  };

  const filteredCitations = citations.filter(citation =>
    citation.citation_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    citation.source_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search citations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={() => {
          setEditingCitation(null);
          setIsFormOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Citation
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredCitations.map((citation) => (
          <CitationItem
            key={citation.id}
            citation={citation}
            onEdit={(citation) => {
              setEditingCitation(citation);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            onBookmark={handleBookmark}
          />
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCitation ? 'Edit Citation' : 'Add New Citation'}
            </DialogTitle>
          </DialogHeader>
          <CitationForm
            citation={editingCitation || {}}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingCitation(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
