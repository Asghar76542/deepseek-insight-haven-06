
import React from 'react';
import { Brain, MonitorSmartphone, BarChart3, Code, TrendingUp, Lightbulb } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '@/types/chat';
import { Progress } from "@/components/ui/progress";

interface ChatMessageProps {
  message: Message;
  isEditing: boolean;
  editContent: string;
  onEditChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const ChatMessage = ({
  message,
  isEditing,
  editContent,
  onEditChange,
  onSaveEdit,
  onCancelEdit
}: ChatMessageProps) => {
  return (
    <div
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
          {message.metadata?.tokenMetricsJson && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <MonitorSmartphone className="w-3 h-3" />
                {message.metadata.tokenMetricsJson.input_tokens + message.metadata.tokenMetricsJson.output_tokens} tokens
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BarChart3 className="w-3 h-3" />
                ${message.metadata.tokenMetricsJson.total_cost.toFixed(4)}
              </Badge>
            </div>
          )}
          {message.metadata?.sentiment !== undefined && (
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              Sentiment: {(message.metadata.sentiment * 100).toFixed(0)}%
              <div className="w-16 ml-1">
                <Progress value={message.metadata.sentiment * 100} 
                  className={`h-1.5 ${
                    message.metadata.sentiment > 0.6 ? 'bg-green-500' : 
                    message.metadata.sentiment < 0.4 ? 'bg-red-500' : 'bg-yellow-500'
                  }`} 
                />
              </div>
            </Badge>
          )}
          {message.metadata?.complexity !== undefined && (
            <Badge variant="outline" className="gap-1">
              <Lightbulb className="w-3 h-3" />
              Complexity: {(message.metadata.complexity * 100).toFixed(0)}%
              <div className="w-16 ml-1">
                <Progress value={message.metadata.complexity * 100} 
                  className={`h-1.5 ${
                    message.metadata.complexity > 0.7 ? 'bg-red-500' : 
                    message.metadata.complexity < 0.3 ? 'bg-green-500' : 'bg-yellow-500'
                  }`} 
                />
              </div>
            </Badge>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="w-full min-h-[100px] p-2 rounded bg-background/50 border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onSaveEdit}
            >
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
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
      )}
      
      {message.metadata?.isEdited && (
        <div className="text-xs text-muted-foreground mt-2">
          Edited {new Date(message.metadata.editedAt!).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};
