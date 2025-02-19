
import React from 'react';
import ChatInterface from '../components/ChatInterface';
import ResearchDashboard from '../components/ResearchDashboard';

const Index = () => {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left side - Chat Interface */}
      <div className="w-1/2 border-r border-white/10 p-6">
        <ChatInterface />
      </div>
      
      {/* Right side - Research Dashboard */}
      <div className="w-1/2">
        <ResearchDashboard />
      </div>
    </div>
  );
};

export default Index;
