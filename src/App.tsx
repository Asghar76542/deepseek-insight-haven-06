
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import ChatInterface from "@/components/ChatInterface";
import { ToolsPanel } from "@/components/tools/ToolsPanel";

function App() {
  return (
    <TooltipProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen bg-background">
          <div className="flex h-screen">
            <div className="flex-1">
              <ChatInterface />
            </div>
            <ToolsPanel />
          </div>
          <Toaster />
        </div>
      </ThemeProvider>
    </TooltipProvider>
  );
}

export default App;
