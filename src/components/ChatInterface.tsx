
import React from 'react';
import { MessageSquare } from 'lucide-react';

const ChatInterface = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="glass-morphism p-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Research Assistant</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="chat-bubble ml-auto bg-primary/20">
          <p>How can I help with your research today?</p>
        </div>
      </div>
      
      <div className="glass-morphism p-4 rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your research query..."
            className="flex-1 bg-background/50 rounded-lg px-4 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button className="glass-morphism px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
