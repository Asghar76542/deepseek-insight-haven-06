
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    dateRange?: { from: Date | null; to: Date | null };
    sources: string[];
    hasUrl: boolean | null;
  };
  onApplyFilters: (filters: FilterDialogProps['filters']) => void;
  availableSources: string[];
}

export function FilterDialog({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  availableSources,
}: FilterDialogProps) {
  const [currentFilters, setCurrentFilters] = React.useState(filters);

  const handleApply = () => {
    onApplyFilters(currentFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: { from: null, to: null },
      sources: [],
      hasUrl: null,
    };
    setCurrentFilters(resetFilters);
    onApplyFilters(resetFilters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Citations</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Date Range</Label>
            <div className="grid gap-2">
              <Calendar
                mode="range"
                selected={{
                  from: currentFilters.dateRange?.from || undefined,
                  to: currentFilters.dateRange?.to || undefined,
                }}
                onSelect={(range) => 
                  setCurrentFilters(prev => ({
                    ...prev,
                    dateRange: {
                      from: range?.from || null,
                      to: range?.to || null,
                    }
                  }))
                }
                numberOfMonths={2}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Source</Label>
            <Select
              value={currentFilters.sources[0] || ''}
              onValueChange={(value) =>
                setCurrentFilters(prev => ({
                  ...prev,
                  sources: value ? [value] : []
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                {availableSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Has URL</Label>
            <Switch
              checked={currentFilters.hasUrl === true}
              onCheckedChange={(checked) =>
                setCurrentFilters(prev => ({
                  ...prev,
                  hasUrl: checked ? true : null
                }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
