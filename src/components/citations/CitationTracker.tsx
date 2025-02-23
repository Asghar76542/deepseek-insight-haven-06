
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, SortAsc } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CitationItem } from './CitationItem';
import { CitationForm } from './CitationForm';
import { FilterDialog } from './FilterDialog';
import { toast } from "@/hooks/use-toast";
import { Citation } from '@/types/research';
import { 
  fetchCitations,
  createCitation,
  updateCitation,
  deleteCitation,
  bookmarkCitation 
} from '@/services/citations/crud';

interface CitationTrackerProps {
  sessionId: string;
}

type CitationInput = Omit<Citation, 'id' | 'created_at'>;

type SortField = 'created_at' | 'source_title' | 'citation_text';
type SortOrder = 'asc' | 'desc';

interface FilterState {
  dateRange?: { from: Date | null; to: Date | null };
  sources: string[];
  hasUrl: boolean | null;
}

export const CitationTracker = ({ sessionId }: CitationTrackerProps) => {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingCitation, setEditingCitation] = useState<Citation | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: null, to: null },
    sources: [],
    hasUrl: null
  });

  const loadCitations = async () => {
    try {
      const data = await fetchCitations(sessionId);
      setCitations(data);
    } catch (error) {
      console.error('Error fetching citations:', error);
      toast({
        title: "Error",
        description: "Failed to load citations",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadCitations();
  }, [sessionId]);

  const handleSubmit = async (citationData: Partial<CitationInput>) => {
    try {
      if (editingCitation?.id) {
        await updateCitation(editingCitation.id, citationData);
        toast({
          title: "Success",
          description: "Citation updated successfully",
        });
      } else {
        await createCitation({
          ...citationData,
          session_id: sessionId
        });
        toast({
          title: "Success",
          description: "Citation added successfully",
        });
      }

      setIsFormOpen(false);
      setEditingCitation(null);
      loadCitations();
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
      await deleteCitation(id);
      toast({
        title: "Success",
        description: "Citation deleted successfully",
      });
      loadCitations();
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
      await bookmarkCitation(citation.message_id, citation.source_title);
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

  const handleSort = (field: SortField) => {
    setSortField(field);
    setSortOrder(currentOrder => currentOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const filteredAndSortedCitations = citations
    .filter(citation => {
      // Text search
      const matchesSearch = !searchTerm || 
        citation.citation_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citation.source_title?.toLowerCase().includes(searchTerm.toLowerCase());

      // Source filter
      const matchesSource = filters.sources.length === 0 || 
        (citation.source_title && filters.sources.includes(citation.source_title));

      // URL filter
      const matchesUrl = filters.hasUrl === null || 
        (filters.hasUrl ? !!citation.source_url : !citation.source_url);

      // Date range filter
      const matchesDateRange = !filters.dateRange?.from && !filters.dateRange?.to || 
        (citation.created_at && 
          (!filters.dateRange.from || new Date(citation.created_at) >= filters.dateRange.from) &&
          (!filters.dateRange.to || new Date(citation.created_at) <= filters.dateRange.to));

      return matchesSearch && matchesSource && matchesUrl && matchesDateRange;
    })
    .sort((a, b) => {
      if (!a[sortField] || !b[sortField]) return 0;
      const comparison = String(a[sortField]).localeCompare(String(b[sortField]));
      return sortOrder === 'asc' ? comparison : -comparison;
    });

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
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <SortAsc className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSort('created_at')}>
                Sort by Date {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('source_title')}>
                Sort by Source {sortField === 'source_title' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('citation_text')}>
                Sort by Text {sortField === 'citation_text' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        {filteredAndSortedCitations.map((citation) => (
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

      <FilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onApplyFilters={handleFilterChange}
        availableSources={Array.from(new Set(citations.map(c => c.source_title).filter(Boolean) as string[]))}
      />
    </div>
  );
};

