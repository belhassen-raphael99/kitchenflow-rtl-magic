import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  CalendarIcon, Loader2, Plus, Trash2, Search, Check,
  User, CalendarDays, ShoppingCart, ClipboardCheck, ChevronRight, ChevronLeft
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Client } from '@/hooks/useClients';
import { Recipe } from '@/hooks/useRecipes';
import { Separator } from '@/components/ui/separator';

const EVENT_TYPES = [
  'חתונה', 'בר/בת מצווה', 'אירוע חברה', 'ברית', 'יום הולדת', 'אירוע פרטי', 'אחר'
] as const;

const DEPARTMENTS = ['מטבח', 'מאפייה', 'קונדיטוריה'] as const;

function mapCategoryToDepartment(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('מאפ') || lower.includes('bak') || lower.includes('לחם')) return 'מאפייה';
  if (lower.includes('קונד') || lower.includes('עוג') || lower.includes('dessert')) return 'קונדיטוריה';
  return 'מטבח';
}

export interface OrderItem {
  recipe_id: string;
  recipe_name: string;
  quantity: number;
  unit: string;
  department: string;
  notes: string;
}

export interface EventWizardData {
  client_name: string;
  client_phone: string;
  client_email: string;
  client_id?: string;
  event_type: string;
  date: Date;
  time: string;
  guests: number;
  delivery_address: string;
  delivery_time: string;
  notes: string;
  items: OrderItem[];
}

interface EventWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  recipes: Recipe[];
  onSubmit: (data: EventWizardData) => Promise<boolean>;
  selectedDate?: Date;
}

export const EventWizard = ({
  open, onOpenChange, clients, recipes, onSubmit, selectedDate
}: EventWizardProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [recipePopoverOpen, setRecipePopoverOpen] = useState(false);

  const [form, setForm] = useState<EventWizardData>({
    client_name: '',
    client_phone: '',
    client_email: '',
    event_type: 'אירוע פרטי',
    date: selectedDate || new Date(),
    time: '18:00',
    guests: 1,
    delivery_address: '',
    delivery_time: '16:00',
    notes: '',
    items: [],
  });

  const resetForm = () => {
    setStep(1);
    setForm({
      client_name: '', client_phone: '', client_email: '',
      event_type: 'אירוע פרטי', date: selectedDate || new Date(),
      time: '18:00', guests: 1, delivery_address: '',
      delivery_time: '16:00', notes: '', items: [],
    });
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const filteredClients = useMemo(() =>
    clients.filter(c => c.name.includes(clientSearch)),
    [clients, clientSearch]
  );

  const selectClient = (client: Client) => {
    setForm(prev => ({
      ...prev,
      client_name: client.name,
      client_phone: client.phone || '',
      client_email: client.email || '',
      client_id: client.id,
    }));
    setClientPopoverOpen(false);
  };

  const addItem = (recipe: Recipe) => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        quantity: 1,
        unit: 'מנות',
        department: mapCategoryToDepartment(recipe.category),
        notes: '',
      }],
    }));
    setRecipePopoverOpen(false);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeItem = (index: number) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    form.items.forEach(item => {
      counts[item.department] = (counts[item.department] || 0) + 1;
    });
    return counts;
  }, [form.items]);

  const canProceed = () => {
    switch (step) {
      case 1: return form.client_name.trim() && form.client_phone.trim() && form.event_type;
      case 2: return form.date && form.time && form.guests >= 1 && form.delivery_address.trim();
      case 3: return form.items.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit(form);
      if (success) handleOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: 'פרטי לקוח', icon: User },
    { num: 2, label: 'פרטי אירוע', icon: CalendarDays },
    { num: 3, label: 'פרטי הזמנה', icon: ShoppingCart },
    { num: 4, label: 'אישור', icon: ClipboardCheck },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הזמנה חדשה</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                step === s.num ? "bg-primary text-primary-foreground" :
                step > s.num ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-xs hidden sm:inline">{s.label}</span>
              {i < steps.length - 1 && <div className="w-4 sm:w-8 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step 1: Client Details */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div>
              <Label>שם הלקוח *</Label>
              <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Input
                    value={form.client_name}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, client_name: e.target.value, client_id: undefined }));
                      setClientSearch(e.target.value);
                      if (e.target.value.length > 0) setClientPopoverOpen(true);
                    }}
                    placeholder="הקלד שם לקוח..."
                    className="mt-1"
                  />
                </PopoverTrigger>
                {filteredClients.length > 0 && (
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup heading="לקוחות קיימים">
                          {filteredClients.map(client => (
                            <CommandItem key={client.id} onSelect={() => selectClient(client)}>
                              <div>
                                <p className="font-medium">{client.name}</p>
                                {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                )}
              </Popover>
              {form.client_id && <Badge variant="outline" className="mt-1 text-xs">לקוח קיים ✓</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טלפון *</Label>
                <Input
                  value={form.client_phone}
                  onChange={(e) => setForm(prev => ({ ...prev, client_phone: e.target.value }))}
                  placeholder="05X-XXXXXXX"
                  className="mt-1"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>אימייל</Label>
                <Input
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm(prev => ({ ...prev, client_email: e.target.value }))}
                  placeholder="email@example.com"
                  className="mt-1"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label>סוג האירוע *</Label>
              <Select
                value={form.event_type}
                onValueChange={(val) => setForm(prev => ({ ...prev, event_type: val }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Event Details */}
        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label>תאריך האירוע *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-right font-normal mt-1',
                        !form.date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {form.date ? format(form.date, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.date}
                      onSelect={(d) => d && setForm(prev => ({ ...prev, date: d }))}
                      locale={he}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>שעת האירוע *</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>מספר אורחים *</Label>
              <Input
                type="number"
                min={1}
                value={form.guests}
                onChange={(e) => setForm(prev => ({ ...prev, guests: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>כתובת המשלוח *</Label>
              <Input
                value={form.delivery_address}
                onChange={(e) => setForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                placeholder="רחוב, עיר"
                className="mt-1"
              />
            </div>

            <div>
              <Label>שעת משלוח *</Label>
              <Input
                type="time"
                value={form.delivery_time}
                onChange={(e) => setForm(prev => ({ ...prev, delivery_time: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">מתי צריך להגיע לאירוע?</p>
            </div>

            <div>
              <Label>הערות</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="אלרגיות, בקשות מיוחדות..."
                className="mt-1"
              />
            </div>
          </div>
        )}

        {/* Step 3: Order Items */}
        {step === 3 && (
          <div className="space-y-4 pt-2">
            <Popover open={recipePopoverOpen} onOpenChange={setRecipePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  הוסף מנה
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="חפש מתכון..." />
                  <CommandList>
                    <CommandEmpty>לא נמצאו מתכונים</CommandEmpty>
                    <CommandGroup>
                      {recipes.map(recipe => (
                        <CommandItem key={recipe.id} onSelect={() => addItem(recipe)}>
                          <div className="flex justify-between w-full">
                            <span>{recipe.name}</span>
                            <Badge variant="outline" className="text-xs">{recipe.category}</Badge>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {form.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>לא נבחרו מנות עדיין</p>
                <p className="text-xs">לחץ על "הוסף מנה" כדי להתחיל</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {form.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{item.recipe_name}</div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">כמות</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">יחידה</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="מגשים / יח'"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">מחלקה</Label>
                        <Select
                          value={item.department}
                          onValueChange={(val) => updateItem(index, 'department', val)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Input
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      placeholder="הערה למנה..."
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {form.items.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {Object.entries(departmentCounts).map(([dept, count]) => (
                  <Badge key={dept} variant="secondary">{dept}: {count} מנות</Badge>
                ))}
                <Badge variant="outline">סה״כ: {form.items.length} פריטים</Badge>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 4 && (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2">📋 סיכום הזמנה</h3>
              <Separator />
              <div className="space-y-1 text-sm">
                <p><strong>לקוח:</strong> {form.client_name} | {form.client_phone}</p>
                {form.client_email && <p><strong>אימייל:</strong> {form.client_email}</p>}
                <p><strong>סוג:</strong> {form.event_type}</p>
                <p><strong>תאריך:</strong> {format(form.date, 'dd/MM/yyyy', { locale: he })} | {form.time}</p>
                <p><strong>אורחים:</strong> {form.guests}</p>
                <p><strong>כתובת:</strong> {form.delivery_address}</p>
                <p><strong>משלוח:</strong> {form.delivery_time}</p>
              </div>

              <Separator />
              <h4 className="font-semibold">🍽 הזמנה ({form.items.length} פריטים):</h4>
              {DEPARTMENTS.map(dept => {
                const deptItems = form.items.filter(i => i.department === dept);
                if (deptItems.length === 0) return null;
                return (
                  <div key={dept} className="text-sm">
                    <p className="font-medium">{dept}:</p>
                    <ul className="list-disc list-inside mr-4">
                      {deptItems.map((item, i) => (
                        <li key={i}>{item.recipe_name} — {item.quantity} {item.unit}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {form.notes && (
                <>
                  <Separator />
                  <p className="text-sm"><strong>💬 הערות:</strong> {form.notes}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1">
                <ChevronRight className="w-4 h-4" />
                חזור
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>ביטול</Button>
            {step < 4 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-1">
                הבא
                <ChevronLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-1">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4" />
                צור אירוע
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
