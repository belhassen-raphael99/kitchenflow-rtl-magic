import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartyPopper, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { EventTaskCard, type EventTaskCardData } from './EventTaskCard';

const DEPARTMENTS: Array<{ key: string; label: string; icon: string }> = [
  { key: 'מטבח', label: 'מטבח', icon: '🍳' },
  { key: 'מאפייה', label: 'מאפייה', icon: '🍞' },
  { key: 'קונדיטוריה', label: 'קונדיטוריה', icon: '🍰' },
];

interface Props {
  tasks: EventTaskCardData[];
  updating: string | null;
  onStart: (task: EventTaskCardData) => void;
  onComplete: (task: EventTaskCardData) => void;
  onClickEvent: (eventId: string) => void;
  onClickRecipe?: (task: EventTaskCardData) => void;
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
  tasks, updating, onStart, onComplete, onClickEvent, onClickRecipe, onGenerate, generating, hasEventsToday,
}: Props) {
  if (!hasEventsToday && tasks.length === 0) return null;

  // Ne garder que les tâches non-complétées (les complétées disparaissent)
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;

  // Group active by department
  const grouped: Record<string, EventTaskCardData[]> = {};
  for (const t of activeTasks) {
    const key = normalizeDept(t.department);
    (grouped[key] ||= []).push(t);
  }

  // Liste des événements complets (toutes les tâches finies)
  const eventStatusMap = new Map<string, { total: number; done: number; client: string | null }>();
  for (const t of tasks) {
    if (!t.event_id) continue;
    const acc = eventStatusMap.get(t.event_id) || { total: 0, done: 0, client: t.client_name || t.event_name || null };
    acc.total += 1;
    if (t.status === 'completed') acc.done += 1;
    eventStatusMap.set(t.event_id, acc);
  }
  const readyEvents = Array.from(eventStatusMap.entries())
    .filter(([, v]) => v.total > 0 && v.done === v.total);

  return (
    <Card className="rounded-xl border-kpi-events/30 bg-kpi-events/[0.03]">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-kpi-events" />
            הכנות לאירועי היום
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-[10px] tabular-nums">
                {completedCount}/{totalCount}
              </Badge>
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
      <CardContent className="p-4 pt-2 space-y-4">
        {/* Bandeau "Prêts" — événements 100% terminés */}
        {readyEvents.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-primary mb-1">הזמנות מוכנות לשליחה</p>
              <div className="flex flex-wrap gap-1.5">
                {readyEvents.map(([eid, v]) => (
                  <button
                    key={eid}
                    onClick={() => onClickEvent(eid)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-background border border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    📦 {v.client || 'אירוע'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {totalCount === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 italic">
            אין משימות עדיין. לחץ "צור משימות מאירועים" כדי לייצר אותן.
          </p>
        ) : activeTasks.length === 0 ? (
          <p className="text-sm text-primary text-center py-4 font-medium">
            🎉 כל המשימות הושלמו!
          </p>
        ) : (
          <div className="space-y-4">
            {DEPARTMENTS.map(dept => {
              const deptTasks = grouped[dept.key] || [];
              if (deptTasks.length === 0) return null;
              return (
                <div key={dept.key} className="space-y-2">
                  <h3 className="text-xs font-bold flex items-center gap-1.5 px-1">
                    <span>{dept.icon}</span>
                    {dept.label}
                    <span className="text-[10px] font-normal text-muted-foreground">({deptTasks.length})</span>
                  </h3>
                  {/* Grille dense de tuiles compactes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {deptTasks.map(t => (
                      <EventTaskCard
                        key={t.id}
                        task={t}
                        updating={updating === t.id}
                        onStart={() => onStart(t)}
                        onComplete={() => onComplete(t)}
                        onClickEvent={() => t.event_id && onClickEvent(t.event_id)}
                        onClickRecipe={onClickRecipe ? () => onClickRecipe(t) : undefined}
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
