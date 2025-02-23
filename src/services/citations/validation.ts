
import { Citation } from '@/types/research';
import { toast } from "@/hooks/use-toast";

export const validateCitation = (citation: Partial<Citation>): boolean => {
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
