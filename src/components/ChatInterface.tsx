
import React, { useState } from 'react';
import { MessageSquare, Settings, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const modelOptions = [
  { name: 'GPT-4o', provider: 'OpenAI', description: 'Latest GPT-4 model with enhanced capabilities' },
  { name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most capable Claude model' },
  { name: 'DeepSeek-MoE', provider: 'DeepSeek', description: 'Mixture of Experts architecture' },
  { name: 'Gemini Ultra', provider: 'Google', description: 'Most capable Gemini model' },
];

const ChatInterface = () => {
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);

  return (
    <div className="flex flex-col h-full">
      <div className="glass-morphism p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Research Assistant</h2>
          </div>
          
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
                  onClick={() => setSelectedModel(model)}
                  className="flex flex-col items-start py-2 gap-1"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.provider}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="chat-bubble ml-auto bg-primary/20">
          <p>How can I help with your research today? I'm using {selectedModel.name} from {selectedModel.provider}.</p>
        </div>
      </div>
      
      <div className="glass-morphism p-4 rounded-b-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Model: {selectedModel.name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Provider: {selectedModel.provider}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your research query..."
              className="flex-1 bg-background/50 rounded-lg px-4 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button className="glass-morphism hover:bg-primary/20">
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
