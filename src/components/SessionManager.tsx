
import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, Tag, FolderOpen, Calendar, ArrowUpDown } from 'lucide-react';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ResearchSession, ResearchCategory, ResearchTag, SearchFilters } from '@/types/research';
import { toast } from "@/hooks/use-toast";

interface SessionManagerProps {
  onSelectSession: (session: ResearchSession) => void;
  currentSessionId?: string;
}

export const SessionManager = ({ onSelectSession, currentSessionId }: SessionManagerProps) => {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [categories, setCategories] = useState<ResearchCategory[]>([]);
  const [tags, setTags] = useState<ResearchTag[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    title: '',
    description: '',
    category_id: '',
    tags: [] as string[],
  });
  const [sortField, setSortField] = useState<'title' | 'created_at' | 'last_accessed_at'>('last_accessed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchSessions();
    fetchCategories();
    fetchTags();
  }, [searchFilters, sortField, sortOrder]);

  const fetchSessions = async () => {
    try {
      let query = supabase
        .from('research_sessions')
        .select(`
          *,
          research_categories (id, name, color),
          session_tags (
            research_tags (id, name)
          ),
          conversations (id),
          messages:conversations(count)
        `);

      // Apply filters
      if (searchFilters.searchTerm) {
        query = query.ilike('title', `%${searchFilters.searchTerm}%`);
      }
      if (searchFilters.categories?.length) {
        query = query.in('category_id', searchFilters.categories);
      }
      if (searchFilters.status?.length) {
        query = query.in('status', searchFilters.status);
      }
      if (searchFilters.dateRange?.from) {
        query = query.gte('created_at', searchFilters.dateRange.from);
      }
      if (searchFilters.dateRange?.to) {
        query = query.lte('created_at', searchFilters.dateRange.to);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      // Process the sessions to include the message count
      const processedSessions = data.map(session => ({
        ...session,
        total_messages: session.messages?.length || 0,
      }));

      setSessions(processedSessions);
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
      const { data: session, error: sessionError } = await supabase
        .from('research_sessions')
        .insert([{
          ...newSessionData,
          status: 'active',
          is_shared: false,
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add tags if selected
      if (newSessionData.tags.length > 0 && session) {
        const tagInserts = newSessionData.tags.map(tagId => ({
          session_id: session.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('session_tags')
          .insert(tagInserts);

        if (tagError) throw tagError;
      }

      toast({
        title: "Success",
        description: "New research session created",
      });

      setIsNewSessionDialogOpen(false);
      setNewSessionData({ title: '', description: '', category_id: '', tags: [] });
      fetchSessions();
      
      if (session) {
        onSelectSession(session);
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

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
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
              value={searchFilters.searchTerm}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-64 pl-9"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={searchFilters.categories?.[0] || ''} 
                    onValueChange={(value) => setSearchFilters(prev => ({ ...prev, categories: value ? [value] : undefined }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={searchFilters.status?.[0] || ''} 
                    onValueChange={(value: ResearchStatus) => setSearchFilters(prev => ({ ...prev, status: value ? [value] : undefined }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[120px]">
                          <Calendar className="w-4 h-4 mr-2" />
                          {searchFilters.dateRange?.from ? 
                            format(new Date(searchFilters.dateRange.from), 'PP') :
                            'From'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={searchFilters.dateRange?.from ? new Date(searchFilters.dateRange.from) : undefined}
                          onSelect={(date) => setSearchFilters(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, from: date?.toISOString() }
                          }))}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[120px]">
                          <Calendar className="w-4 h-4 mr-2" />
                          {searchFilters.dateRange?.to ? 
                            format(new Date(searchFilters.dateRange.to), 'PP') :
                            'To'
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={searchFilters.dateRange?.to ? new Date(searchFilters.dateRange.to) : undefined}
                          onSelect={(date) => setSearchFilters(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, to: date?.toISOString() }
                          }))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
                <Select 
                  value={newSessionData.category_id} 
                  onValueChange={(value) => setNewSessionData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={newSessionData.tags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setNewSessionData(prev => ({
                          ...prev,
                          tags: prev.tags.includes(tag.id)
                            ? prev.tags.filter(t => t !== tag.id)
                            : [...prev.tags, tag.id]
                        }));
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateSession}>Create Session</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => toggleSort('title')}
        >
          Title
          <ArrowUpDown className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => toggleSort('last_accessed_at')}
        >
          Last Accessed
          <ArrowUpDown className="w-3 h-3" />
        </Button>
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
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {session.total_messages} messages
                  </span>
                  {session.last_accessed_at && (
                    <span className="text-xs text-muted-foreground">
                      Last accessed: {format(new Date(session.last_accessed_at), 'PP')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session.category && (
                  <div
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: session.category.color + '40',
                      color: session.category.color
                    }}
                  >
                    <FolderOpen className="w-3 h-3 inline-block mr-1" />
                    {session.category.name}
                  </div>
                )}
                {session.is_shared && (
                  <Badge variant="secondary">Shared</Badge>
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
