import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, BookOpen, Package, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface SearchResult {
  type: 'event' | 'client' | 'recipe' | 'warehouse';
  id: string;
  title: string;
  subtitle: string;
}

const typeConfig = {
  event: { icon: Calendar, label: 'אירועים', route: '/agenda' },
  client: { icon: Users, label: 'לקוחות', route: '/agenda' },
  recipe: { icon: BookOpen, label: 'מתכונים', route: '/recipes' },
  warehouse: { icon: Package, label: 'מחסן', route: '/warehouse' },
};

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<NodeJS.Timeout>();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);

    const [events, clients, recipes, items] = await Promise.all([
      supabase.from('events').select('id,client_name,date,guests').ilike('client_name', `%${q}%`).limit(3),
      supabase.from('clients').select('id,name,phone').ilike('name', `%${q}%`).limit(3),
      supabase.from('recipes').select('id,name,category').ilike('name', `%${q}%`).limit(5),
      supabase.from('warehouse_items').select('id,name,quantity,unit').ilike('name', `%${q}%`).limit(5),
    ]);

    const mapped: SearchResult[] = [
      ...(events.data || []).map(e => ({
        type: 'event' as const, id: e.id,
        title: e.client_name || 'אירוע',
        subtitle: `${format(parseISO(e.date), 'dd/MM/yyyy', { locale: he })} — ${e.guests} אורחים`,
      })),
      ...(clients.data || []).map(c => ({
        type: 'client' as const, id: c.id,
        title: c.name,
        subtitle: c.phone || '',
      })),
      ...(recipes.data || []).map(r => ({
        type: 'recipe' as const, id: r.id,
        title: r.name,
        subtitle: r.category,
      })),
      ...(items.data || []).map(i => ({
        type: 'warehouse' as const, id: i.id,
        title: i.name,
        subtitle: `${i.quantity} ${i.unit}`,
      })),
    ];

    setResults(mapped);
    setSelectedIndex(-1);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    navigate(typeConfig[result.type].route);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Group results by type
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="חיפוש גלובלי..."
          className="pr-9 pl-8 h-9 text-sm bg-sidebar-accent/50 border-sidebar-border"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-elevated z-50 max-h-80 overflow-y-auto">
          {Object.entries(grouped).map(([type, items]) => {
            const config = typeConfig[type as keyof typeof typeConfig];
            const Icon = config.icon;
            return (
              <div key={type}>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5 bg-muted/50">
                  <Icon className="w-3 h-3" />
                  {config.label} ({items.length})
                </div>
                {items.map(item => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full text-right px-3 py-2 text-sm hover:bg-accent transition-colors flex flex-col",
                        selectedIndex === idx && "bg-accent"
                      )}
                    >
                      <span className="font-medium truncate">{item.title}</span>
                      <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-elevated z-50 p-4 text-center text-sm text-muted-foreground">
          לא נמצאו תוצאות
        </div>
      )}
    </div>
  );
};
