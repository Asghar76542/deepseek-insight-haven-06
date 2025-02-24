
import React from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModelOption } from '@/types/chat';

interface ModelSelectorProps {
  selectedModel: ModelOption;
  modelOptions: ModelOption[];
  onModelSelect: (model: ModelOption) => void;
  totalTokens: { inputTokens: number; outputTokens: number; totalCost: number; };
}

export const ModelSelector = ({ selectedModel, modelOptions, onModelSelect, totalTokens }: ModelSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Settings className="w-4 h-4" />
          {selectedModel.name}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[300px]">
        {modelOptions.map((model) => (
          <DropdownMenuItem
            key={model.name}
            onClick={() => onModelSelect(model)}
            className="flex flex-col items-start py-2 gap-1"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{model.name}</span>
              <Badge variant="secondary">{model.provider}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{model.description}</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {model.capabilities.map((capability) => (
                <Badge key={capability} variant="outline" className="text-xs">
                  {capability}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ${model.costPer1kTokens}/1k tokens • Max {model.maxTokens} tokens
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground">
          <div className="flex justify-between mb-1">
            <span>Total Tokens Used:</span>
            <span>{totalTokens.inputTokens + totalTokens.outputTokens}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Cost:</span>
            <span>${totalTokens.totalCost.toFixed(4)}</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
