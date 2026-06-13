
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Tag, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'global-tags';

// Predefined color palette for tags
const TAG_COLORS = [
  'bg-primary/10 text-primary',
  'bg-brand/10 text-brand',
  'bg-destructive/10 text-destructive',
  'bg-accent/10 text-accent-foreground',
  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400',
];

export function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function loadGlobalTags(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveGlobalTags(tags: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(tags)]));
}

export function addToGlobalTags(newTags: string[]) {
  const existing = loadGlobalTags();
  const merged = [...new Set([...existing, ...newTags])];
  saveGlobalTags(merged);
}

interface TagPickerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  compact?: boolean;
}

const TagPicker: React.FC<TagPickerProps> = ({ selectedTags, onTagsChange, placeholder = 'Add tags...', compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const globalTags = loadGlobalTags();

  const suggestions = globalTags.filter(
    tag => !selectedTags.includes(tag) && tag.toLowerCase().includes(input.toLowerCase())
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      const newTags = [...selectedTags, trimmed];
      onTagsChange(newTags);
      addToGlobalTags([trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {selectedTags.map(tag => (
          <Badge key={tag} className={cn('text-[10px] px-1.5 py-0 gap-0.5', getTagColor(tag))}>
            {tag}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {selectedTags.map(tag => (
          <Badge key={tag} className={cn('gap-1 text-xs', getTagColor(tag))}>
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-destructive">
              <X size={10} />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => { setInput(e.target.value); if (!isOpen) setIsOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim()) {
                  e.preventDefault();
                  addTag(input);
                }
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="h-8 text-sm pl-8"
            />
          </div>
        </PopoverTrigger>
        {(suggestions.length > 0 || input.trim()) && (
          <PopoverContent className="w-[200px] p-2" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {suggestions.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="w-full text-left px-2 py-1 rounded text-sm hover:bg-muted transition-colors flex items-center gap-1.5"
                >
                  <Badge className={cn('text-[10px] px-1 py-0', getTagColor(tag))}>{tag}</Badge>
                </button>
              ))}
              {input.trim() && !globalTags.includes(input.trim().toLowerCase()) && (
                <button
                  onClick={() => addTag(input)}
                  className="w-full text-left px-2 py-1 rounded text-sm hover:bg-muted transition-colors flex items-center gap-1.5 text-brand"
                >
                  <Plus size={12} /> Create "{input.trim()}"
                </button>
              )}
            </div>
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
};

export default TagPicker;
