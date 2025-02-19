
import React from 'react';
import { BookOpen, ChevronDown, Zap, Book, Link2, Brain } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const ResearchCard = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: any }) => (
  <div className="glass-card">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ChevronDown className="w-5 h-5 text-muted-foreground" />
    </div>
    {children}
  </div>
);

const ModelMetrics = () => (
  <div className="grid grid-cols-3 gap-4 mb-4">
    {[
      { label: 'Confidence', value: 92 },
      { label: 'Coherence', value: 88 },
      { label: 'Citation Quality', value: 95 },
    ].map((metric) => (
      <div key={metric.label} className="glass-morphism p-4 rounded-lg">
        <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
        <Progress value={metric.value} className="h-2" />
        <div className="text-right text-sm mt-1">{metric.value}%</div>
      </div>
    ))}
  </div>
);

const ResearchDashboard = () => {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-semibold">Research Insights</h2>
      </div>

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
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-primary">GPT-4</span>
                <span className="text-muted-foreground"> - Broad knowledge synthesis</span>
              </div>
              <div className="text-sm">
                <span className="text-primary">Claude</span>
                <span className="text-muted-foreground"> - Detailed analysis</span>
              </div>
              <div className="text-sm">
                <span className="text-primary">DeepSeek</span>
                <span className="text-muted-foreground"> - Technical expertise</span>
              </div>
            </div>
          </div>
        </ResearchCard>
      </div>
    </div>
  );
};

export default ResearchDashboard;
