
import React, { useState } from 'react';
import { Search, FileText, Database, Globe, Code, Settings } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { ToolCategory } from './ToolCategory';
import { ToolItem } from './ToolItem';

const toolCategories = [
  {
    name: 'File Operations',
    tools: [
      { name: 'File Browser', description: 'Browse and manage files', icon: FileText },
      { name: 'Document Reader', description: 'Read and analyze documents', icon: FileText },
    ]
  },
  {
    name: 'Database',
    tools: [
      { name: 'Query Editor', description: 'Write and execute queries', icon: Database },
      { name: 'Schema Viewer', description: 'View database structure', icon: Database },
    ]
  },
  {
    name: 'Search & Research',
    tools: [
      { name: 'Web Search', description: 'Search the internet', icon: Globe },
      { name: 'Code Search', description: 'Search through codebase', icon: Code },
    ]
  },
];

export const ToolsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>(['File Operations']);
  const [activeTools, setActiveTools] = useState<string[]>([]);

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

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Input
          type="search"
          placeholder="Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
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
                isActive={activeTools.includes(tool.name)}
                onClick={() => toggleTool(tool.name)}
              />
            ))}
          </ToolCategory>
        ))}
      </div>
      <div className="p-4 border-t border-border">
        <Button variant="outline" className="w-full" onClick={() => {}}>
          <Settings className="w-4 h-4 mr-2" />
          Configure Tools
        </Button>
      </div>
    </div>
  );
};
