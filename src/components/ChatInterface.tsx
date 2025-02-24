
import React, { useState, useEffect } from 'react';
import { MessageSquare, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { SessionManager } from '@/components/SessionManager';
import { ScreenshotCapture } from '@/components/ScreenshotCapture';
import { ResearchSession } from '@/types/research';
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { ModelSelector } from './chat/ModelSelector';
import { ChatMessage } from './chat/ChatMessage';
import { Message, ModelOption, TokenMetrics } from '@/types/chat';
import { saveMessage, calculateTokenMetrics, updateMessage } from '@/services/chat/chatService';

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
        metadata: msg.metadata as Message['metadata']
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
      if (messageIndex === -1) return;

      const message = messages[messageIndex];

      switch (action) {
        case 'pin':
          const updatedMetadata = {
            ...message.metadata,
            isPinned: !message.metadata?.isPinned
          };
          
          await updateMessage(messageId, message.content, updatedMetadata);
          
          setMessages(prevMessages => 
            prevMessages.map(m => 
              m.id === messageId 
                ? { ...m, metadata: updatedMetadata }
                : m
            )
          );
          break;

        case 'edit':
          setEditingMessageId(messageId);
          setEditContent(message.content);
          break;

        case 'save':
          if (!editContent.trim()) return;

          const editedMetadata = {
            ...message.metadata,
            isEdited: true,
            editedAt: new Date().toISOString()
          };

          await updateMessage(messageId, editContent, editedMetadata);

          setMessages(prevMessages => 
            prevMessages.map(m => 
              m.id === messageId 
                ? { ...m, content: editContent, metadata: editedMetadata }
                : m
            )
          );
          
          setEditingMessageId(null);
          setEditContent('');
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
              <ScreenshotCapture onAnalysisComplete={(analysis) => {
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
              }} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
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
                }}
                title="Export Conversation"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <ModelSelector
                selectedModel={selectedModel}
                modelOptions={modelOptions}
                onModelSelect={setSelectedModel}
                totalTokens={totalTokens}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              isEditing={editingMessageId === message.id}
              editContent={editContent}
              onEditChange={setEditContent}
              onSaveEdit={() => handleMessageAction(message.id, 'save')}
              onCancelEdit={() => {
                setEditingMessageId(null);
                setEditContent('');
              }}
            />
          ))}
          {isStreaming && streamingContent && (
            <ChatMessage
              message={{
                role: 'assistant',
                content: streamingContent,
                metadata: {
                  model: selectedModel.name,
                  timestamp: new Date().toISOString()
                }
              }}
              isEditing={false}
              editContent=""
              onEditChange={() => {}}
              onSaveEdit={() => {}}
              onCancelEdit={() => {}}
            />
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
                {isLoading ? 'Thinking...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
