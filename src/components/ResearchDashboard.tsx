
import React from 'react';
import { BookOpen, ChevronDown, Zap, Book, Link2, Brain, Clock, Star, Archive } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const ResearchCard = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: any }) => (
  <div className="glass-card group animate-fade-in">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-hover:rotate-180" />
    </div>
    <div className="research-card-content">
      {children}
    </div>
  </div>
);

const ModelMetrics = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {[
      { label: 'Confidence', value: 92, color: 'rgb(147, 51, 234)' },
      { label: 'Coherence', value: 88, color: 'rgb(59, 130, 246)' },
      { label: 'Citation Quality', value: 95, color: 'rgb(16, 185, 129)' },
    ].map((metric, index) => (
      <div 
        key={metric.label} 
        className="metric-card animate-fade-in"
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
      </div>
    ))}
  </div>
);

const SessionCategories = () => (
  <Tabs defaultValue="recent" className="w-full">
    <TabsList className="grid w-full grid-cols-3 mb-4">
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

    <TabsContent value="recent">
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="space-y-2">
          {['Research on AI Ethics', 'Climate Change Analysis', 'Technology Trends'].map((session) => (
            <div key={session} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer">
              <span>{session}</span>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </TabsContent>

    <TabsContent value="favorites">
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="space-y-2">
          {['Machine Learning Basics', 'Data Analysis Methods'].map((session) => (
            <div key={session} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer">
              <span>{session}</span>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </TabsContent>

    <TabsContent value="archived">
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="space-y-2">
          {['Old Research Notes', 'Project Archive 2023'].map((session) => (
            <div key={session} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer">
              <span>{session}</span>
              <span className="text-xs text-muted-foreground">Archived</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </TabsContent>
  </Tabs>
);

const ResearchDashboard = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <div className="p-2 rounded-md bg-primary/10">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">Research Insights</h2>
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
