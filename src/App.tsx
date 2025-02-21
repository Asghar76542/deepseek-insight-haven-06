
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import ChatInterface from "@/components/ChatInterface";

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
