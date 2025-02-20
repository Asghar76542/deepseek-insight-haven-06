
import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Tag, FolderOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ResearchSession, ResearchCategory, ResearchTag } from '@/types/research';
import { toast } from "@/hooks/use-toast";

interface SessionManagerProps {
  onSelectSession: (session: ResearchSession) => void;
  currentSessionId?: string;
}

export const SessionManager = ({ onSelectSession, currentSessionId }: SessionManagerProps) => {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [categories, setCategories] = useState<ResearchCategory[]>([]);
  const [tags, setTags] = useState<ResearchTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    description: '',
    category_id: '',
  });

  useEffect(() => {
    fetchSessions();
    fetchCategories();
    fetchTags();
  }, []);

  const fetchSessions = async () => {
    try {
      let query = supabase
        .from('research_sessions')
        .select(`
          *,
          research_categories (id, name, color),
          session_tags (
            research_tags (id, name)
          )
        `);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load research sessions",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('research_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('research_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreateSession = async () => {
    try {
      const { data, error } = await supabase
        .from('research_sessions')
        .insert([{
          ...newSessionData,
          status: 'active',
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "New research session created",
      });

      setIsNewSessionDialogOpen(false);
      setNewSessionData({ title: '', description: '', category_id: '' });
      fetchSessions();
      
      if (data) {
        onSelectSession(data);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create research session",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        <Dialog open={isNewSessionDialogOpen} onOpenChange={setIsNewSessionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Research Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newSessionData.title}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newSessionData.description}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={newSessionData.category_id}
                  onChange={(e) => setNewSessionData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCreateSession}>Create Session</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`p-4 rounded-lg border ${
              session.id === currentSessionId ? 'border-primary' : 'border-border'
            } cursor-pointer hover:bg-accent/50 transition-colors`}
            onClick={() => onSelectSession(session)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{session.title}</h3>
                {session.description && (
                  <p className="text-sm text-muted-foreground">{session.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {session.category_id && (
                  <div
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: categories.find(c => c.id === session.category_id)?.color + '40',
                      color: categories.find(c => c.id === session.category_id)?.color
                    }}
                  >
                    <FolderOpen className="w-3 h-3 inline-block mr-1" />
                    {categories.find(c => c.id === session.category_id)?.name}
                  </div>
                )}
              </div>
            </div>
            {session.tags && session.tags.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Tag className="w-3 h-3" />
                <div className="flex gap-1">
                  {session.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
