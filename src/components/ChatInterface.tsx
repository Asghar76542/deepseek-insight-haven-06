
import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, ChevronDown, Send, Save, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
}

interface ResearchSession {
  id: string;
  title: string;
  description?: string;
}

const modelOptions = [
  { name: 'GPT-4', provider: 'OpenAI', description: 'Latest GPT-4 model with enhanced capabilities' },
  { name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most capable Claude model' },
  { name: 'DeepSeek-MoE', provider: 'DeepSeek', description: 'Mixture of Experts architecture' },
  { name: 'Gemini Ultra', provider: 'Google', description: 'Most capable Gemini model' },
];

const ChatInterface = () => {
  const [selectedModel, setSelectedModel] = useState(modelOptions[3]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const sessionId = uuidv4();
      const { data: session, error: sessionError } = await supabase
        .from('research_sessions')
        .insert([
          {
            id: sessionId,
            title: 'New Research Session',
            description: 'Research session started with ' + selectedModel.name,
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert([
          {
            session_id: sessionId,
            model: selectedModel.name,
            provider: selectedModel.provider,
          },
        ])
        .select()
        .single();

      if (convError) throw convError;

      setCurrentSession(session);

      const initialMessage = {
        role: 'assistant' as const,
        content: `How can I help with your research today? I'm using ${selectedModel.name} from ${selectedModel.provider}.`,
      };
      
      await saveMessage(conversation.id, initialMessage);
      setMessages([initialMessage]);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize research session",
        variant: "destructive",
      });
    }
  };

  const saveMessage = async (conversationId: string, message: Message) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            role: message.role,
            content: message.content,
            model_name: selectedModel.name,
            metadata: message.metadata || {},
          },
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Warning",
        description: "Message saved locally but failed to sync",
        variant: "default",
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const userMessage = { role: 'user' as const, content: input };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const { data: conversation } = await supabase
        .from('conversations')
        .select()
        .eq('session_id', currentSession?.id)
        .single();

      await saveMessage(conversation.id, userMessage);

      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: { prompt: input }
      });

      if (error) throw error;

      const assistantMessage = { 
        role: 'assistant' as const, 
        content: data.generatedText,
        metadata: { model: selectedModel.name, timestamp: new Date().toISOString() }
      };

      await saveMessage(conversation.id, assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to process message",
        variant: "destructive",
      });
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

  const exportConversation = () => {
    const exportData = {
      session: currentSession,
      model: selectedModel,
      messages: messages,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-session-${currentSession?.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="glass-morphism p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Research Assistant</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={exportConversation}
              title="Export Conversation"
            >
              <Download className="w-4 h-4" />
            </Button>
            
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
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-bubble ${
              message.role === 'assistant' ? 'bg-primary/20' : 'ml-auto bg-secondary/20'
            } p-4 rounded-lg max-w-[80%]`}
          >
            <ReactMarkdown
              components={{
                code({className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <SyntaxHighlighter
                      {...props}
                      style={materialDark}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code {...props} className={className}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
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
