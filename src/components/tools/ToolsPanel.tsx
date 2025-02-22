import React, { useState } from 'react';
import { 
  Search, FileText, Database, Globe, Code, Settings, 
  Users, BarChart, Share2, Lock, Download, Upload,
  MessageSquare, FolderTree, History, Bell
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToolCategory } from './ToolCategory';
import { ToolItem } from './ToolItem';
import { CitationTracker } from '../citations/CitationTracker';

const toolCategories = [
  {
    name: 'Research & Analysis',
    tools: [
      { name: 'Session Manager', description: 'Manage research sessions', icon: FolderTree },
      { name: 'Citation Tracker', description: 'Track and manage citations', icon: MessageSquare },
      { name: 'Web Research', description: 'Search and analyze web content', icon: Globe },
    ]
  },
  {
    name: 'Collaboration',
    tools: [
      { name: 'Team Space', description: 'Collaborate with team members', icon: Users },
      { name: 'Share Session', description: 'Share research sessions', icon: Share2 },
      { name: 'Comments', description: 'Add and manage comments', icon: MessageSquare },
    ]
  },
  {
    name: 'Data Management',
    tools: [
      { name: 'File Manager', description: 'Manage research files', icon: FileText },
      { name: 'Database', description: 'Access research database', icon: Database },
      { name: 'Version History', description: 'Track changes and versions', icon: History },
    ]
  },
  {
    name: 'Analytics',
    tools: [
      { name: 'Research Insights', description: 'Analyze research patterns', icon: BarChart },
      { name: 'Citation Analytics', description: 'Citation statistics and trends', icon: BarChart },
      { name: 'Progress Tracking', description: 'Track research progress', icon: BarChart },
    ]
  },
  {
    name: 'Import/Export',
    tools: [
      { name: 'Export Data', description: 'Export research data', icon: Download },
      { name: 'Import Data', description: 'Import external data', icon: Upload },
      { name: 'Backup', description: 'Backup research data', icon: Download },
    ]
  },
  {
    name: 'Security',
    tools: [
      { name: 'Access Control', description: 'Manage access permissions', icon: Lock },
      { name: 'Privacy Settings', description: 'Configure privacy options', icon: Lock },
      { name: 'Audit Log', description: 'View security audit logs', icon: History },
    ]
  },
];

export const ToolsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>(['Research & Analysis']);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(0);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleTool = (toolName: string) => {
    setActiveTools(prev => 
      prev.includes(toolName)
        ? prev.filter(name => name !== toolName)
        : [...prev, toolName]
    );
  };

  const filteredCategories = toolCategories.map(category => ({
    ...category,
    tools: category.tools.filter(tool => 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.tools.length > 0);

  const renderActiveTool = () => {
    if (!activeTool || !currentSessionId) return null;

    switch (activeTool) {
      case 'Citation Tracker':
        return <CitationTracker sessionId={currentSessionId} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Input
          type="search"
          placeholder="Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 mr-2"
        />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => (
          <ToolCategory
            key={category.name}
            name={category.name}
            isOpen={openCategories.includes(category.name)}
            onToggle={() => toggleCategory(category.name)}
          >
            {category.tools.map((tool) => (
              <ToolItem
                key={tool.name}
                name={tool.name}
                description={tool.description}
                icon={tool.icon}
                isActive={activeTool === tool.name}
                onClick={() => {
                  setActiveTool(tool.name === activeTool ? null : tool.name);
                  if (tool.name === 'Citation Tracker' && currentSessionId) {
                    // Handle citation tracker activation
                  }
                }}
              />
            ))}
          </ToolCategory>
        ))}
      </div>
      {renderActiveTool()}
      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full" onClick={() => {}}>
          <Settings className="w-4 h-4 mr-2" />
          Configure Tools
        </Button>
      </div>
    </div>
  );
};
