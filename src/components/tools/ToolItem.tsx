
import React from 'react';
import { Button } from "@/components/ui/button";

interface ToolItemProps {
  name: string;
  description: string;
  isActive?: boolean;
  onClick: () => void;
  icon?: React.ComponentType;
}

export const ToolItem = ({ name, description, isActive, onClick, icon: Icon }: ToolItemProps) => {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start text-left"
      onClick={onClick}
    >
      {Icon && <Icon />}
      <div className="flex flex-col items-start ml-2">
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </Button>
  );
};
