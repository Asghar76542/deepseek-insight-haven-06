
import React from 'react';
import ChatInterface from '../components/ChatInterface';
import ResearchDashboard from '../components/ResearchDashboard';
import { ToolsPanel } from '../components/tools/ToolsPanel';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="w-full">
        <ResizablePanel defaultSize={35} minSize={20} maxSize={50} className="min-h-0">
          <div className="h-screen">
            <ChatInterface />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={65} className="min-h-0">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={75} className="min-h-0">
              <div className="h-screen">
                <ResearchDashboard />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={25} minSize={15} className="min-h-0">
              <div className="h-screen overflow-hidden">
                <ToolsPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster />
    </div>
  );
};

export default Index;
