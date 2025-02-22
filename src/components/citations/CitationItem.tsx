
import React from 'react';
import { ExternalLink, Edit, Trash, BookmarkPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Citation } from '@/types/research';

interface CitationItemProps {
  citation: Citation;
  onEdit: (citation: Citation) => void;
  onDelete: (id: string) => void;
  onBookmark: (citation: Citation) => void;
}

export const CitationItem = ({ citation, onEdit, onDelete, onBookmark }: CitationItemProps) => {
  return (
    <div className="p-4 border border-border rounded-lg hover:bg-accent/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium">{citation.citation_text}</p>
          {citation.source_title && (
            <p className="text-sm text-muted-foreground mt-1">
              Source: {citation.source_title}
            </p>
          )}
          {citation.source_url && (
            <a
              href={citation.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              View Source
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBookmark(citation)}
            className="h-8 w-8"
          >
            <BookmarkPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(citation)}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(citation.id)}
            className="h-8 w-8 text-destructive"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
