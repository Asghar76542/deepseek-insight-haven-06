
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ToolCategoryProps {
  name: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const ToolCategory = ({ name, isOpen, onToggle, children }: ToolCategoryProps) => {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-accent/50"
      >
        {name}
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen ? "transform rotate-180" : "")} />
      </button>
      {isOpen && (
        <div className="p-2 space-y-1 bg-background/50">
          {children}
        </div>
      )}
    </div>
  );
};
