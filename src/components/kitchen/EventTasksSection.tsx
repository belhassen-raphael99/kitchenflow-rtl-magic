import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartyPopper, RefreshCw, Loader2 } from 'lucide-react';
import { EventTaskCard, type EventTaskCardData } from './EventTaskCard';

const DEPARTMENTS: Array<{ key: string; label: string; icon: string }> = [
  { key: 'מטבח', label: 'מטבח', icon: '🍳' },
  { key: 'מאפייה', label: 'מאפייה', icon: '🍞' },
  { key: 'קונדיטוריה', label: 'קונדיטוריה', icon: '🍰' },
];

interface Props {
  tasks: EventTaskCardData[];
  expandedCompleted: Set<string>;
  onToggleExpand: (id: string) => void;
  updating: string | null;
  onStart: (task: EventTaskCardData) => void;
  onComplete: (task: EventTaskCardData) => void;
  onClickEvent: (eventId: string) => void;
  onGenerate: () => void;
  generating: boolean;
  hasEventsToday: boolean;
}

function normalizeDept(dept: string): string {
  if (!dept) return 'מטבח';
  if (dept.startsWith('קונדיטוריה')) return 'קונדיטוריה';
  return dept;
}

export function EventTasksSection({
  tasks, expandedCompleted, onToggleExpand, updating,
  onStart, onComplete, onClickEvent, onGenerate, generating, hasEventsToday,
}: Props) {
  if (!hasEventsToday && tasks.length === 0) return null;

  const grouped: Record<string, EventTaskCardData[]> = {};
  for (const t of tasks) {
    const key = normalizeDept(t.department);
    (grouped[key] ||= []).push(t);
  }

  const totalPending = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;

  return (
    <Card className="rounded-xl border-kpi-events/30 bg-kpi-events/[0.03]">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-kpi-events" />
            הכנות לאירועי היום
            {totalPending > 0 && (
              <Badge variant="secondary" className="text-[10px]">{totalPending} פתוחות</Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 no-print"
            onClick={onGenerate}
            disabled={generating}
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            צור משימות מאירועים
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 italic">
            אין משימות עדיין. לחץ "צור משימות מאירועים" כדי לייצר אותן מתוך פריטי האירועים של היום.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEPARTMENTS.map(dept => {
              const deptTasks = grouped[dept.key] || [];
              if (deptTasks.length === 0) return null;
              const pending = deptTasks.filter(t => t.status !== 'completed').length;
              return (
                <div key={dept.key} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold flex items-center gap-1.5">
                      <span>{dept.icon}</span>
                      {dept.label}
                      <span className="text-[10px] font-normal text-muted-foreground">({pending}/{deptTasks.length})</span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {deptTasks.map(t => (
                      <EventTaskCard
                        key={t.id}
                        task={t}
                        updating={updating === t.id}
                        isExpanded={expandedCompleted.has(t.id)}
                        onToggleExpand={() => onToggleExpand(t.id)}
                        onStart={() => onStart(t)}
                        onComplete={() => onComplete(t)}
                        onClickEvent={() => t.event_id && onClickEvent(t.event_id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}