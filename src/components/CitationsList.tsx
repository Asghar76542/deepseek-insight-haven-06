
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ExternalLink } from 'lucide-react';

interface Citation {
  id: string;
  source_title?: string | null;
  source_url?: string | null;
  citation_text?: string | null;
}

interface CitationsListProps {
  citations: Citation[];
}

export const CitationsList = ({ citations }: CitationsListProps) => {
  if (citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold mb-2">Citations</h3>
      <ScrollArea className="h-[200px] rounded-md border">
        <div className="p-4">
          {citations.map((citation) => (
            <Card key={citation.id} className="p-4 mb-3 last:mb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {citation.source_title && (
                    <h4 className="text-sm font-medium">{citation.source_title}</h4>
                  )}
                  {citation.citation_text && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {citation.citation_text}
                    </p>
                  )}
                </div>
                {citation.source_url && (
                  <a
                    href={citation.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-500 hover:text-blue-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
