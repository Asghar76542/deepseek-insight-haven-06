
import React from 'react';
import { Button } from "@/components/ui/button";
import { LucideIcon } from 'lucide-react';

interface ToolItemProps {
  name: string;
  description: string;
  isActive?: boolean;
  onClick: () => void;
  icon?: LucideIcon;
}

export const ToolItem = ({ name, description, isActive, onClick, icon: Icon }: ToolItemProps) => {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start text-left"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        <div className="flex flex-col items-start">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </div>
    </Button>
  );
};
