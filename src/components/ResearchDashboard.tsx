
import React from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

const ResearchCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass-card">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ChevronDown className="w-5 h-5 text-muted-foreground" />
    </div>
    {children}
  </div>
);

const ResearchDashboard = () => {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-semibold">Research Insights</h2>
      </div>

      <div className="grid gap-6">
        <ResearchCard title="Summary">
          <p className="text-muted-foreground">
            Start your research journey by asking a question in the chat interface.
          </p>
        </ResearchCard>

        <ResearchCard title="Methodology">
          <p className="text-muted-foreground">
            Research methodology and approach will be displayed here.
          </p>
        </ResearchCard>

        <ResearchCard title="Citations">
          <p className="text-muted-foreground">
            Relevant citations and sources will appear here.
          </p>
        </ResearchCard>
      </div>
    </div>
  );
};

export default ResearchDashboard;
