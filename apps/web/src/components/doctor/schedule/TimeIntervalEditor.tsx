'use client';

import React from 'react';
import { Plus, Trash2, Clock, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TimeIntervalEditorProps {
  label: string;
  type: 'WINDOW' | 'BREAK';
  items: Array<{ start: string; end: string; label?: string }>;
  onChange: (items: Array<{ start: string; end: string; label?: string }>) => void;
  disabled?: boolean;
}

export function TimeIntervalEditor({
  label,
  type,
  items,
  onChange,
  disabled = false,
}: TimeIntervalEditorProps) {
  const handleAdd = () => {
    if (type === 'WINDOW') {
      const last = items[items.length - 1];
      const start = last ? last.end : '09:00';
      const end = '17:00';
      onChange([...items, { start, end }]);
    } else {
      onChange([...items, { start: '13:00', end: '14:00', label: 'Lunch Break' }]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, idx) => idx !== index));
  };

  const handleUpdate = (index: number, field: 'start' | 'end' | 'label', value: string) => {
    const updated = items.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          {type === 'WINDOW' ? (
            <Clock className="h-3 w-3 text-blue-600" />
          ) : (
            <Coffee className="h-3 w-3 text-amber-600" />
          )}
          {label}
        </label>
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleAdd}
            className="text-[11px] h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1"
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic py-1">
          {type === 'WINDOW' ? 'No working hours configured.' : 'No break intervals scheduled.'}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const hasError = item.start >= item.end;

            return (
              <div
                key={index}
                className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border bg-background/50 ${
                  hasError ? 'border-destructive/60 bg-destructive/5' : 'border-border/60'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                  <Input
                    type="time"
                    value={item.start}
                    disabled={disabled}
                    onChange={(e) => handleUpdate(index, 'start', e.target.value)}
                    className="h-7 text-xs font-mono w-24 px-1.5"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={item.end}
                    disabled={disabled}
                    onChange={(e) => handleUpdate(index, 'end', e.target.value)}
                    className="h-7 text-xs font-mono w-24 px-1.5"
                  />
                </div>

                {type === 'BREAK' && (
                  <Input
                    type="text"
                    placeholder="Break reason (e.g. Lunch)"
                    value={item.label || ''}
                    disabled={disabled}
                    onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                    className="h-7 text-xs flex-1 min-w-[120px] px-2"
                  />
                )}

                {!disabled && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(index)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}

                {hasError && (
                  <div className="w-full text-[10px] text-destructive font-medium">
                    Start time must be before end time
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TimeIntervalEditor;

