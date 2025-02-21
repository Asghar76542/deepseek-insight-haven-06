import React, { useState, useEffect } from 'react';
import { MessageSquare, Settings, ChevronDown, Send, Save, Download, Pin, Edit, Star } from 'lucide-react';
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
import { SessionManager } from '@/components/SessionManager';
import { ScreenshotCapture } from '@/components/ScreenshotCapture';
import { ResearchSession } from '@/types/research';

interface MessageMetadata {
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  model?: string;
  timestamp?: string;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: MessageMetadata;
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

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
    if (!messageId) return;

    try {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];

      switch (action) {
        case 'pin':
          const updatedMessage = {
            ...message,
            metadata: {
              ...message.metadata,
              isPinned: !message.metadata?.isPinned
            }
          };
          
          const newMessages = [...messages];
          newMessages[messageIndex] = updatedMessage;
          setMessages(newMessages);
          
          // Update in database
          if (currentSession) {
            const { data: conversation } = await supabase
              .from('conversations')
              .select()
              .eq('session_id', currentSession.id)
              .single();

            if (conversation) {
              await supabase
                .from('messages')
                .update({
                  metadata: updatedMessage.metadata
                })
                .eq('id', messageId);
            }
          }
          
          toast({
            title: updatedMessage.metadata?.isPinned ? "Message pinned" : "Message unpinned",
            description: "The message has been updated",
          });
          break;

        case 'edit':
          setEditingMessageId(messageId);
          setEditContent(message.content);
          break;

        case 'save':
          if (!editContent.trim()) return;

          const editedMessage = {
            ...message,
            content: editContent,
            metadata: {
              ...message.metadata,
              isEdited: true,
              editedAt: new Date().toISOString()
            }
          };

          const updatedMessages = [...messages];
          updatedMessages[messageIndex] = editedMessage;
          setMessages(updatedMessages);
          setEditingMessageId(null);
          setEditContent('');

          // Update in database
          if (currentSession) {
            const { data: conversation } = await supabase
              .from('conversations')
              .select()
              .eq('session_id', currentSession.id)
              .single();

            if (conversation) {
              await supabase
                .from('messages')
                .update({
                  content: editContent,
                  metadata: editedMessage.metadata
                })
                .eq('id', messageId);
            }
          }

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

  return (
    <div className="flex h-screen">
      {/* Left sidebar */}
      <div className="w-80 border-r border-border bg-background overflow-y-auto p-4">
        <SessionManager
          onSelectSession={handleSelectSession}
          currentSessionId={currentSession?.id}
        />
      </div>
      
      {/* Main chat area */}
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
              className={`chat-bubble relative ${
                message.role === 'assistant' ? 'bg-primary/20' : 'ml-auto bg-secondary/20'
              } p-4 rounded-lg max-w-[80%] ${message.metadata?.isPinned ? 'border-l-4 border-primary' : ''}`}
            >
              <div className="absolute top-2 right-2 flex gap-2">
                {message.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMessageAction(message.id, 'pin')}
                    >
                      <Pin className={`w-4 h-4 ${message.metadata?.isPinned ? 'text-primary' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMessageAction(message.id, 'edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              
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
                  {message.metadata?.isEdited && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Edited {new Date(message.metadata.editedAt!).toLocaleDateString()}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        
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
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your research query..."
                className="flex-1 bg-background/50 rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-primary/50"
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
