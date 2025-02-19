
import React, { useState } from 'react';
import { MessageSquare, Settings, ChevronDown, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const modelOptions = [
  { name: 'GPT-4o', provider: 'OpenAI', description: 'Latest GPT-4 model with enhanced capabilities' },
  { name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most capable Claude model' },
  { name: 'DeepSeek-MoE', provider: 'DeepSeek', description: 'Mixture of Experts architecture' },
  { name: 'Gemini Ultra', provider: 'Google', description: 'Most capable Gemini model' },
];

const ChatInterface = () => {
  const [selectedModel, setSelectedModel] = useState(modelOptions[3]); // Default to Gemini
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `How can I help with your research today? I'm using ${modelOptions[3].name} from ${modelOptions[3].provider}.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const userMessage = { role: 'user' as const, content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: { prompt: input }
      });

      if (error) throw error;

      const assistantMessage = { 
        role: 'assistant' as const, 
        content: data.generatedText 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error processing your request. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-bubble ${
              message.role === 'assistant' ? 'bg-primary/20' : 'ml-auto bg-secondary/20'
            }`}
          >
            <p>{message.content}</p>
          </div>
        ))}
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your research query..."
              className="flex-1 bg-background/50 rounded-lg px-4 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isLoading}
            />
            <Button 
              className="glass-morphism hover:bg-primary/20"
              onClick={handleSend}
              disabled={isLoading}
            >
              {isLoading ? 'Thinking...' : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
