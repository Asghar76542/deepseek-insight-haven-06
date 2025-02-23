
import React from 'react';
import ChatInterface from '../components/ChatInterface';
import ResearchDashboard from '../components/ResearchDashboard';
import { ToolsPanel } from '../components/tools/ToolsPanel';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const Index = () => {
  return (
    <div className="h-screen flex bg-background text-foreground">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className="h-screen">
            <ChatInterface />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={65}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={75}>
              <div className="h-screen">
                <ResearchDashboard />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="h-screen overflow-y-auto">
                <ToolsPanel />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
