
import React from 'react';
import { Citation } from '@/types/research';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CitationFormProps {
  citation: Partial<Citation>;
  onSubmit: (citation: Partial<Citation>) => void;
  onCancel: () => void;
}

export const CitationForm = ({ citation, onSubmit, onCancel }: CitationFormProps) => {
  const [formData, setFormData] = React.useState<Partial<Citation>>(citation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="citation_text">Citation Text</Label>
        <Textarea
          id="citation_text"
          value={formData.citation_text || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, citation_text: e.target.value }))}
          placeholder="Enter the citation text..."
          className="min-h-[100px]"
        />
      </div>
      <div>
        <Label htmlFor="source_title">Source Title</Label>
        <Input
          id="source_title"
          value={formData.source_title || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, source_title: e.target.value }))}
          placeholder="Enter the source title..."
        />
      </div>
      <div>
        <Label htmlFor="source_url">Source URL</Label>
        <Input
          id="source_url"
          type="url"
          value={formData.source_url || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
          placeholder="Enter the source URL..."
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {citation.id ? 'Update Citation' : 'Add Citation'}
        </Button>
      </div>
    </form>
  );
};
