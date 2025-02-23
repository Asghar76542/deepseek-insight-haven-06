
import React, { useState } from 'react';
import { BookOpen, ChevronDown, Zap, Book, Link2, Brain, Clock, Star, Archive, Search, Filter, Download } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ResearchCard = ({ title, children, icon: Icon, onExpand }: { 
  title: string; 
  children: React.ReactNode; 
  icon: any;
  onExpand?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onExpand) onExpand();
  };

  return (
    <Card className="group animate-fade-in hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={handleToggle}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-180"
          )} />
        </div>
        <div className={cn(
          "transition-all duration-200 overflow-hidden",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

const ModelMetrics = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {[
      { label: 'Confidence', value: 92, color: 'rgb(147, 51, 234)' },
      { label: 'Coherence', value: 88, color: 'rgb(59, 130, 246)' },
      { label: 'Citation Quality', value: 95, color: 'rgb(16, 185, 129)' },
    ].map((metric, index) => (
      <Card 
        key={metric.label} 
        className="metric-card animate-fade-in p-4 hover:shadow-md transition-all duration-200"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
        <Progress 
          value={metric.value} 
          className={cn(
            "h-2 mb-1",
            "transition-all duration-500"
          )}
          style={{ 
            '--tw-gradient-from': metric.color,
          } as React.CSSProperties}
        />
        <div className="text-right text-sm font-medium mt-1">{metric.value}%</div>
      </Card>
    ))}
  </div>
);

const SessionCategories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  return (
    <Tabs defaultValue="recent" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            Archived
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
                All Sessions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedFilter('thisWeek')}>
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedFilter('thisMonth')}>
                This Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <TabsContent value="recent">
        <ScrollArea className="h-[200px] rounded-md border p-4">
          <div className="space-y-2">
            {['Research on AI Ethics', 'Climate Change Analysis', 'Technology Trends'].map((session) => (
              <Card key={session} className="p-3 hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">{session}</span>
                    <span className="text-xs text-muted-foreground">Last updated 2h ago</span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="favorites">
        <ScrollArea className="h-[200px] rounded-md border p-4">
          <div className="space-y-2">
            {['Machine Learning Basics', 'Data Analysis Methods'].map((session) => (
              <Card key={session} className="p-3 hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">{session}</span>
                    <span className="text-xs text-muted-foreground">Favorited</span>
                  </div>
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="archived">
        <ScrollArea className="h-[200px] rounded-md border p-4">
          <div className="space-y-2">
            {['Old Research Notes', 'Project Archive 2023'].map((session) => (
              <Card key={session} className="p-3 hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">{session}</span>
                    <span className="text-xs text-muted-foreground">Archived on Jan 1, 2024</span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Archive className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
};

const ResearchDashboard = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="p-2 rounded-md bg-primary/10">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Research Insights</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              New Session
            </Button>
            <Button variant="default">
              Share Insights
            </Button>
          </div>
        </div>

        <SessionCategories />

        <ModelMetrics />

        <div className="grid gap-6">
          <ResearchCard title="Summary" icon={Brain}>
            <p className="text-muted-foreground">
              Start your research journey by asking a question in the chat interface.
              The AI will analyze your query using frontier models and provide comprehensive insights.
            </p>
          </ResearchCard>

          <ResearchCard title="Methodology" icon={Zap}>
            <p className="text-muted-foreground">
              Multiple AI models will collaborate to validate and cross-reference findings,
              ensuring high-quality research outputs with diverse perspectives.
            </p>
          </ResearchCard>

          <ResearchCard title="Citations" icon={Link2}>
            <p className="text-muted-foreground">
              Sources will be automatically validated across multiple databases
              and ranked by relevance and credibility.
            </p>
          </ResearchCard>

          <ResearchCard title="Model Analysis" icon={Book}>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Each model contributes its unique strengths:
              </p>
              <div className="space-y-3">
                {[
                  { name: 'GPT-4', desc: 'Broad knowledge synthesis' },
                  { name: 'Claude', desc: 'Detailed analysis' },
                  { name: 'DeepSeek', desc: 'Technical expertise' }
                ].map((model, index) => (
                  <div 
                    key={model.name} 
                    className="flex items-center gap-2 text-sm animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="text-primary font-medium">{model.name}</span>
                    <span className="text-muted-foreground">- {model.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </ResearchCard>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ResearchDashboard;
