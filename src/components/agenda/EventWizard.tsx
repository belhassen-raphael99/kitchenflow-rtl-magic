import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  CalendarIcon, Loader2, Plus, Trash2, Search, Check,
  User, CalendarDays, ShoppingCart, ClipboardCheck, ChevronRight, ChevronLeft, AlertTriangle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { supabase } from '@/integrations/supabase/client';

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

interface CatalogItemForWizard {
  id: string;
  name_website: string;
  name_internal: string;
  department: string | null;
  unit_type: string | null;
  quantity_per_serving: number | null;
  recipe_id: string | null;
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
  quote_number?: string;
}

export interface PrefillData {
  client: { name: string; city?: string; phone?: string };
  event: { date: string; time: string; delivery_time?: string; guests: number };
  quote_number?: string;
  items: Array<{
    name: string;
    quantity: number;
    catalog_id: string | null;
    recipe_id: string | null;
    department: string | null;
    unit: string;
    matched: boolean;
    catalog_name: string | null;
  }>;
  unmatchedCount: number;
}

interface EventWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  recipes: Recipe[];
  onSubmit: (data: EventWizardData) => Promise<boolean>;
  selectedDate?: Date;
  prefillData?: PrefillData | null;
}

export const EventWizard = ({
  open, onOpenChange, clients, recipes, onSubmit, selectedDate, prefillData
}: EventWizardProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [recipePopoverOpen, setRecipePopoverOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItemForWizard[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');

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

  // Apply prefill data when it changes
  useEffect(() => {
    if (prefillData && open) {
      const eventDate = prefillData.event.date ? new Date(prefillData.event.date) : selectedDate || new Date();
      
      const prefillItems: OrderItem[] = prefillData.items
        .filter(i => i.matched)
        .map(i => ({
          recipe_id: i.recipe_id || i.catalog_id || '',
          recipe_name: i.catalog_name || i.name,
          quantity: i.quantity,
          unit: i.unit || 'מנות',
          department: i.department || 'מטבח',
          notes: '',
        }));

      setForm({
        client_name: prefillData.client.name || '',
        client_phone: prefillData.client.phone || '',
        client_email: '',
        event_type: 'אירוע פרטי',
        date: eventDate,
        time: prefillData.event.time || '18:00',
        guests: prefillData.event.guests || 1,
        delivery_address: prefillData.client.city || '',
        delivery_time: prefillData.event.delivery_time || '16:00',
        notes: '',
        items: prefillItems,
        quote_number: prefillData.quote_number,
      });
      setStep(1);
    }
  }, [prefillData, open]);

  // Fetch catalog items
  useEffect(() => {
    if (open) {
      supabase.from('catalog_items').select('id, name_website, name_internal, department, unit_type, quantity_per_serving, recipe_id')
        .eq('is_active', true).order('department').order('name_website')
        .then(({ data }) => setCatalogItems((data || []) as unknown as CatalogItemForWizard[]));
    }
  }, [open]);

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

  const isPrefilled = !!prefillData;
  const unmatchedItems = prefillData?.items.filter(i => !i.matched) || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isPrefilled ? `הזמנה חדשה — מיובא מ-Priority` : 'הזמנה חדשה'}
          </DialogTitle>
          {isPrefilled && form.quote_number && (
            <Badge variant="outline" className="w-fit text-xs">📋 הצעת מחיר: {form.quote_number}</Badge>
          )}
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
              <Label className="flex items-center gap-2">
                שם הלקוח *
                {isPrefilled && form.client_name && <Badge variant="secondary" className="text-[10px]">✅ מיובא</Badge>}
              </Label>
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
                <Label className="flex items-center gap-2">
                  טלפון *
                  {isPrefilled && form.client_phone && <Badge variant="secondary" className="text-[10px]">✅ מיובא</Badge>}
                </Label>
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
                <Label className="flex items-center gap-2">
                  תאריך האירוע *
                  {isPrefilled && <Badge variant="secondary" className="text-[10px]">✅ מיובא</Badge>}
                </Label>
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
                {isPrefilled && form.date < new Date(new Date().toDateString()) && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> התאריך בעבר
                  </p>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  שעת האירוע *
                  {isPrefilled && <Badge variant="secondary" className="text-[10px]">✅ מיובא</Badge>}
                </Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                מספר אורחים *
                {isPrefilled && <Badge variant="secondary" className="text-[10px]">✅ מיובא</Badge>}
              </Label>
              <Input
                type="number"
                min={1}
                value={form.guests}
                onChange={(e) => setForm(prev => ({ ...prev, guests: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                כתובת המשלוח *
                {isPrefilled && form.delivery_address && <Badge variant="secondary" className="text-[10px]">✅ מיובא</Badge>}
              </Label>
              <Input
                value={form.delivery_address}
                onChange={(e) => setForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                placeholder="רחוב, עיר"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                שעת משלוח *
                {isPrefilled && <Badge variant="secondary" className="text-[10px]">✅ מיובא</Badge>}
              </Label>
              <Input
                type="time"
                value={form.delivery_time}
                onChange={(e) => setForm(prev => ({ ...prev, delivery_time: e.target.value }))}
                className="mt-1"
              />
            </div>

            {isPrefilled && form.quote_number && (
              <div>
                <Label>מספר הצעת מחיר</Label>
                <Input value={form.quote_number} readOnly className="mt-1 bg-muted" />
              </div>
            )}

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
            {/* Unmatched items warning */}
            {isPrefilled && unmatchedItems.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {unmatchedItems.length} פריט{unmatchedItems.length > 1 ? 'ים' : ''} לא זוה{unmatchedItems.length > 1 ? 'ו' : ''} — אנא בדוק לפני המשך
                </p>
                <ul className="mt-2 space-y-1">
                  {unmatchedItems.map((item, i) => (
                    <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      ⚠️ {item.name} ×{item.quantity} — לא נמצא בקטלוג
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Import summary badge */}
            {isPrefilled && (
              <Badge variant="outline" className="text-xs">
                📄 מיובא מ-Priority — {form.items.length} פריטים מותאמים
              </Badge>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חפש מנה בקטלוג..."
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Catalog items grouped by department */}
            {catalogItems.length > 0 ? (
              <div className="space-y-4 max-h-[350px] overflow-y-auto">
                {DEPARTMENTS.map(dept => {
                  const deptItems = catalogItems.filter(ci =>
                    ci.department === dept &&
                    (!catalogSearch || ci.name_website.includes(catalogSearch) || ci.name_internal.includes(catalogSearch))
                  );
                  if (deptItems.length === 0) return null;

                  return (
                    <div key={dept}>
                      <h4 className="font-bold text-sm mb-2 text-muted-foreground">{dept}</h4>
                      <div className="space-y-1.5">
                        {deptItems.map(ci => {
                          const existing = form.items.findIndex(i => i.recipe_name === ci.name_internal);
                          const isSelected = existing >= 0;
                          return (
                            <div key={ci.id} className={cn(
                              "flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                              isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                            )}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setForm(prev => ({
                                      ...prev,
                                      items: [...prev.items, {
                                        recipe_id: ci.recipe_id || ci.id,
                                        recipe_name: ci.name_internal,
                                        quantity: 1,
                                        unit: ci.unit_type || 'מנות',
                                        department: ci.department || 'מטבח',
                                        notes: '',
                                      }],
                                    }));
                                  } else {
                                    removeItem(existing);
                                  }
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{ci.name_website}</p>
                                {ci.name_internal !== ci.name_website && (
                                  <p className="text-[11px] text-muted-foreground truncate">{ci.name_internal}</p>
                                )}
                              </div>
                              {isSelected && (
                                <Input
                                  type="number"
                                  min={1}
                                  value={form.items[existing]?.quantity || 1}
                                  onChange={e => updateItem(existing, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-16 h-8 text-sm text-center"
                                />
                              )}
                              {isSelected && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {form.items[existing]?.unit}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Fallback: add from recipes */}
                <Separator />
                <Popover open={recipePopoverOpen} onOpenChange={setRecipePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full gap-2 text-xs">
                      <Plus className="w-3 h-3" />
                      הוסף מנה מספר המתכונים
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="חפש מתכון..." />
                      <CommandList>
                        <CommandEmpty>לא נמצאו</CommandEmpty>
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
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>אין פריטים בקטלוג</p>
                <p className="text-xs">הוסף פריטים בדף הקטלוג או בחר מספר המתכונים</p>
                <Popover open={recipePopoverOpen} onOpenChange={setRecipePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="mt-3 gap-2">
                      <Plus className="w-4 h-4" />
                      הוסף ממתכונים
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="חפש מתכון..." />
                      <CommandList>
                        <CommandEmpty>לא נמצאו</CommandEmpty>
                        <CommandGroup>
                          {recipes.map(recipe => (
                            <CommandItem key={recipe.id} onSelect={() => addItem(recipe)}>
                              <span>{recipe.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
              {form.quote_number && (
                <Badge variant="outline" className="text-xs">הצעת מחיר: {form.quote_number}</Badge>
              )}
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
