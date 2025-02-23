
import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, ChevronDown, Send, Save, Download, Pin, Edit, Star, Brain, MonitorSmartphone, BarChart3, Code, Quote, List } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SessionManager } from '@/components/SessionManager';
import { ScreenshotCapture } from '@/components/ScreenshotCapture';
import { ResearchSession } from '@/types/research';
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Json } from '@/integrations/supabase/types';

interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

type JsonTokenMetrics = {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

interface MessageMetadata {
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  model?: string;
  timestamp?: string;
  tokenMetrics?: JsonTokenMetrics;
  sentiment?: number;
  complexity?: number;
  [key: string]: Json | undefined;
}

interface ModelOption {
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  costPer1kTokens: number;
  maxTokens: number;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: MessageMetadata;
}

const modelOptions: ModelOption[] = [
  {
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Latest GPT-4 model with enhanced capabilities',
    capabilities: ['Text Generation', 'Code Analysis', 'Complex Reasoning'],
    costPer1kTokens: 0.03,
    maxTokens: 8192
  },
  {
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most capable Claude model',
    capabilities: ['Long Context', 'Technical Analysis', 'Research'],
    costPer1kTokens: 0.02,
    maxTokens: 100000
  },
  {
    name: 'DeepSeek-MoE',
    provider: 'DeepSeek',
    description: 'Mixture of Experts architecture',
    capabilities: ['Code Generation', 'Technical Writing', 'Problem Solving'],
    costPer1kTokens: 0.01,
    maxTokens: 16384
  },
  {
    name: 'Gemini Ultra',
    provider: 'Google',
    description: 'Most capable Gemini model',
    capabilities: ['Multimodal', 'Complex Tasks', 'Creative Writing'],
    costPer1kTokens: 0.025,
    maxTokens: 32768
  },
];

const ChatInterface = () => {
  const [selectedModel, setSelectedModel] = useState(modelOptions[3]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [totalTokens, setTotalTokens] = useState<TokenMetrics>({
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0
  });
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

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
            status: 'active',
            is_shared: false
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

  const saveMessage = async (conversationId: string, message: Message): Promise<string | undefined> => {
    try {
      const messageId = uuidv4();
      const messageData = {
        id: messageId,
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        model_name: selectedModel.name,
        metadata: message.metadata as Json
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      
      return messageId;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Warning",
        description: "Message saved locally but failed to sync",
        variant: "default",
      });
      return undefined;
    }
  };

  const calculateTokenMetrics = (text: string): TokenMetrics => {
    const estimatedTokens = Math.ceil(text.length / 4);
    const cost = (estimatedTokens / 1000) * selectedModel.costPer1kTokens;
    return {
      inputTokens: estimatedTokens,
      outputTokens: 0,
      totalCost: cost
    };
  };

  const handleSelectSession = async (session: ResearchSession) => {
    try {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('session_id', session.id)
        .single();

      if (convError) throw convError;

      const { data: messageData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at');

      if (messagesError) throw messagesError;

      setCurrentSession(session);
      const typedMessages: Message[] = (messageData || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        metadata: msg.metadata as MessageMetadata
      }));
      setMessages(typedMessages);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Error",
        description: "Failed to load research session",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setIsStreaming(true);
      const inputMetrics = calculateTokenMetrics(input);
      
      const userMessage: Message = {
        role: 'user',
        content: input,
        metadata: {
          timestamp: new Date().toISOString(),
          tokenMetrics: {
            inputTokens: inputMetrics.inputTokens,
            outputTokens: inputMetrics.outputTokens,
            totalCost: inputMetrics.totalCost
          }
        }
      };

      const { data: conversation } = await supabase
        .from('conversations')
        .select()
        .eq('session_id', currentSession?.id)
        .single();

      const messageId = await saveMessage(conversation.id, userMessage);
      userMessage.id = messageId;

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setStreamingContent('');

      const response = await fetch('/api/chat-with-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let accumulatedContent = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        accumulatedContent += chunk;
        setStreamingContent(accumulatedContent);
      }

      const outputMetrics = calculateTokenMetrics(accumulatedContent);
      const newTotalMetrics = {
        inputTokens: totalTokens.inputTokens + inputMetrics.inputTokens,
        outputTokens: totalTokens.outputTokens + outputMetrics.inputTokens,
        totalCost: totalTokens.totalCost + inputMetrics.totalCost + outputMetrics.totalCost
      };

      setTotalTokens(newTotalMetrics);

      const assistantMessage: Message = {
        role: 'assistant',
        content: accumulatedContent,
        metadata: {
          model: selectedModel.name,
          timestamp: new Date().toISOString(),
          tokenMetrics: {
            inputTokens: outputMetrics.inputTokens,
            outputTokens: outputMetrics.outputTokens,
            totalCost: outputMetrics.totalCost
          },
          sentiment: Math.random() * 100,
          complexity: Math.random() * 100
        }
      };

      const assistantMessageId = await saveMessage(conversation.id, assistantMessage);
      assistantMessage.id = assistantMessageId;

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to process message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
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

  const handleScreenshotAnalysis = (analysis: string) => {
    const assistantMessage = {
      role: 'assistant' as const,
      content: `📸 Screenshot Analysis:\n\n${analysis}`,
      metadata: { type: 'screenshot_analysis', timestamp: new Date().toISOString() }
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    if (currentSession) {
      supabase
        .from('conversations')
        .select()
        .eq('session_id', currentSession.id)
        .single()
        .then(({ data: conversation }) => {
          if (conversation) {
            saveMessage(conversation.id, assistantMessage);
          }
        });
    }
  };

  const handleMessageAction = async (messageId: string | undefined, action: 'pin' | 'edit' | 'save') => {
    if (!messageId) {
      toast({
        title: "Error",
        description: "Message ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) {
        toast({
          title: "Error",
          description: "Message not found",
          variant: "destructive",
        });
        return;
      }

      const message = messages[messageIndex];

      switch (action) {
        case 'pin':
          const updatedMetadata: MessageMetadata = {
            ...message.metadata,
            isPinned: !message.metadata?.isPinned
          };
          
          const { error: pinError } = await supabase
            .from('messages')
            .update({
              metadata: updatedMetadata as Json
            })
            .eq('id', messageId);

          if (pinError) throw pinError;
          
          const updatedMessage = {
            ...message,
            metadata: updatedMetadata
          };
          
          const newMessages = [...messages];
          newMessages[messageIndex] = updatedMessage;
          setMessages(newMessages);
          
          toast({
            title: updatedMessage.metadata?.isPinned ? "Message pinned" : "Message unpinned",
            description: "The message has been updated",
          });
          break;

        case 'edit':
          if (!message) return;
          setEditingMessageId(messageId);
          setEditContent(message.content);
          break;

        case 'save':
          if (!editContent.trim()) return;

          const editedMetadata: MessageMetadata = {
            ...message.metadata,
            isEdited: true,
            editedAt: new Date().toISOString()
          };

          const { error: saveError } = await supabase
            .from('messages')
            .update({
              content: editContent,
              metadata: editedMetadata as Json
            })
            .eq('id', messageId);

          if (saveError) throw saveError;

          const editedMessage = {
            ...message,
            content: editContent,
            metadata: editedMetadata
          };

          const updatedMessages = [...messages];
          updatedMessages[messageIndex] = editedMessage;
          setMessages(updatedMessages);
          setEditingMessageId(null);
          setEditContent('');

          toast({
            title: "Message updated",
            description: "Your changes have been saved",
          });
          break;
      }
    } catch (error) {
      console.error('Error handling message action:', error);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  const renderMessage = (message: Message, index: number) => (
    <div
      key={index}
      className={`chat-bubble relative ${
        message.role === 'assistant' 
          ? 'bg-primary/10 border border-primary/20' 
          : 'ml-auto bg-secondary/20'
      } p-4 rounded-lg max-w-[80%] ${message.metadata?.isPinned ? 'border-l-4 border-primary' : ''} animate-fade-in`}
    >
      {message.role === 'assistant' && (
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <Brain className="w-3 h-3" />
            {message.metadata?.model}
          </Badge>
          {message.metadata?.tokenMetrics && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <MonitorSmartphone className="w-3 h-3" />
                {message.metadata.tokenMetrics.inputTokens + message.metadata.tokenMetrics.outputTokens} tokens
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BarChart3 className="w-3 h-3" />
                ${message.metadata.tokenMetrics.totalCost.toFixed(4)}
              </Badge>
            </div>
          )}
        </div>
      )}

      {editingMessageId === message.id ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[100px] p-2 rounded bg-background/50 border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingMessageId(null);
                setEditContent('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleMessageAction(message.id, 'save')}
            >
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <>
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
              p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4">
                  {children}
                </blockquote>
              ),
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <div className="relative group">
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children))}
                      className="absolute right-2 top-2 p-1 rounded bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy code"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                    <SyntaxHighlighter
                      {...props}
                      style={materialDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg !mt-2 !mb-4"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code {...props} className="bg-primary/10 rounded px-1.5 py-0.5">
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.metadata?.isEdited && (
            <div className="text-xs text-muted-foreground mt-2">
              Edited {new Date(message.metadata.editedAt!).toLocaleDateString()}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r border-border bg-background overflow-y-auto p-4">
        <SessionManager
          onSelectSession={handleSelectSession}
          currentSessionId={currentSession?.id}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="glass-morphism p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Research Assistant</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <ScreenshotCapture onAnalysisComplete={handleScreenshotAnalysis} />
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
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.map((message, index) => renderMessage(message, index))}
          {isStreaming && streamingContent && (
            <div className="chat-bubble relative bg-primary/10 border border-primary/20 p-4 rounded-lg max-w-[80%] animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="gap-1">
                  <Brain className="w-3 h-3" />
                  {selectedModel.name}
                </Badge>
                <div className="animate-pulse">Generating...</div>
              </div>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <div className="relative group">
                        <button
                          onClick={() => navigator.clipboard.writeText(String(children))}
                          className="absolute right-2 top-2 p-1 rounded bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy code"
                        >
                          <Code className="w-4 h-4" />
                        </button>
                        <SyntaxHighlighter
                          {...props}
                          style={materialDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg !mt-2 !mb-4"
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code {...props} className="bg-primary/10 rounded px-1.5 py-0.5">
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {streamingContent}
              </ReactMarkdown>
            </div>
          )}
        </ScrollArea>
        
        <div className="glass-morphism p-4 border-t">
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
              <span>•</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Cost: ${selectedModel.costPer1kTokens}/1k tokens</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your research query..."
                className="flex-1 bg-background/50 rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none"
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
    </div>
  );
};

export default ChatInterface;
