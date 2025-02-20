
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import ChatInterface from "@/components/ChatInterface";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <TooltipProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-screen bg-background">
          <ChatInterface />
          <Toaster />
        </div>
      </ThemeProvider>
    </TooltipProvider>
  );
}

export default App;
