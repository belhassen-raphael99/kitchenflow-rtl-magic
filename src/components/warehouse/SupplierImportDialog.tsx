import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Image as ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Supplier, WarehouseItem } from '@/hooks/useWarehouse';

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number | null;
  total_price: number | null;
}

interface MatchedRow {
  parsed: ParsedItem;
  matchId: string | null; // warehouse_items.id
  matchName: string | null;
  include: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  warehouseItems: WarehouseItem[];
  onSuccess: () => void;
}

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[״"'`׳.,()\[\]\-_/\\]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function fuzzyMatch(name: string, items: WarehouseItem[]): WarehouseItem | null {
  const target = normalize(name);
  if (!target) return null;
  let best: { item: WarehouseItem; score: number } | null = null;
  for (const item of items) {
    const candidate = normalize(item.name);
    if (!candidate) continue;
    let score = 0;
    if (candidate === target) score = 100;
    else if (candidate.includes(target) || target.includes(candidate)) score = 70;
    else {
      const tokens = target.split(' ').filter((t) => t.length >= 2);
      const hits = tokens.filter((t) => candidate.includes(t)).length;
      if (tokens.length > 0) score = Math.round((hits / tokens.length) * 60);
    }
    if (score >= 50 && (!best || score > best.score)) best = { item, score };
  }
  return best?.item || null;
}

export function SupplierImportDialog({ open, onOpenChange, suppliers, warehouseItems, onSuccess }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supplierId, setSupplierId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [rows, setRows] = useState<MatchedRow[] | null>(null);

  const reset = () => {
    setSupplierId('');
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRows(null);
    setAnalyzing(false);
    setApplying(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type)) {
      toast({ title: 'סוג קובץ לא נתמך', description: 'PDF, JPG, PNG או WEBP בלבד', variant: 'destructive' });
      return;
    }
    if (f.size > MAX_BYTES) {
      toast({ title: 'הקובץ גדול מדי', description: 'מקסימום 8MB', variant: 'destructive' });
      return;
    }
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setRows(null);
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const base64 = await fileToBase64(file);
      const supplierName = suppliers.find((s) => s.id === supplierId)?.name;
      const { data, error } = await supabase.functions.invoke('parse-supplier-receipt', {
        body: { file_base64: base64, mime_type: file.type, supplier_hint: supplierName },
      });
      if (error) throw error;
      if (!data?.success) {
        const code = data?.error || 'unknown';
        const map: Record<string, string> = {
          not_a_receipt: 'הקובץ לא זוהה כהזמנה/קבלה מספק',
          parse_failed: 'הקריאה נכשלה',
          rate_limit: 'יותר מדי בקשות, נסה שוב מאוחר יותר',
          payment_required: 'נדרש לחדש את היתרה במערכת',
        };
        toast({ title: 'שגיאה בניתוח', description: map[code] || code, variant: 'destructive' });
        return;
      }
      const parsedItems: ParsedItem[] = (data.data?.items || []) as ParsedItem[];
      if (parsedItems.length === 0) {
        toast({ title: 'לא נמצאו שורות', description: 'לא הצלחנו לזהות פריטים בקובץ', variant: 'destructive' });
        return;
      }
      const matched: MatchedRow[] = parsedItems.map((p) => {
        const m = fuzzyMatch(p.name, warehouseItems);
        return {
          parsed: p,
          matchId: m?.id || null,
          matchName: m?.name || null,
          include: !!m,
        };
      });
      setRows(matched);
      toast({ title: `זוהו ${parsedItems.length} שורות`, description: `${matched.filter((r) => r.matchId).length} שודכו אוטומטית` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      toast({ title: 'שגיאה', description: msg, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!rows) return;
    const toApply = rows.filter((r) => r.include && r.matchId);
    if (toApply.length === 0) {
      toast({ title: 'אין שורות לעדכון', variant: 'destructive' });
      return;
    }
    setApplying(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id || null;
      let updated = 0;
      for (const row of toApply) {
        const item = warehouseItems.find((w) => w.id === row.matchId);
        if (!item) continue;
        const before = Number(item.quantity || 0);
        const change = Number(row.parsed.quantity || 0);
        const after = before + change;
        const { error: updErr } = await supabase
          .from('warehouse_items')
          .update({ quantity: after, last_restocked_at: new Date().toISOString() })
          .eq('id', item.id);
        if (updErr) {
          console.error('Update failed', updErr);
          continue;
        }
        await supabase.from('stock_movements').insert([{
          item_id: item.id,
          item_type: 'warehouse',
          item_name: item.name,
          movement_type: 'supplier_receipt',
          quantity_before: before,
          quantity_change: change,
          quantity_after: after,
          reason: `ייבוא הזמנת ספק${suppliers.find((s) => s.id === supplierId)?.name ? ' — ' + suppliers.find((s) => s.id === supplierId)?.name : ''}`,
          created_by: userId,
        }]);
        updated++;
      }
      toast({ title: `✅ עודכנו ${updated} פריטים במלאי` });
      onSuccess();
      handleClose(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      toast({ title: 'שגיאה בעדכון', description: msg, variant: 'destructive' });
    } finally {
      setApplying(false);
    }
  };

  const matchedCount = rows?.filter((r) => r.matchId).length || 0;
  const includedCount = rows?.filter((r) => r.include && r.matchId).length || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>📸 ייבוא מהזמנת ספק</DialogTitle>
          <DialogDescription>
            צלם או העלה קובץ של הזמנה מהספק — המערכת תזהה את הפריטים ותעדכן את המלאי אוטומטית
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Supplier hint */}
          <div className="space-y-2">
            <Label>ספק (אופציונלי)</Label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base"
            >
              <option value="">— בחר ספק —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* File upload */}
          {!file && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 hover:border-primary hover:bg-accent/30 transition-colors flex flex-col items-center gap-3"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">לחץ להעלאת קובץ</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, WEBP — עד 8MB</p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </button>
          )}

          {/* File preview */}
          {file && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {file.type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setRows(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-md" />
              )}
              {!rows && (
                <Button onClick={handleAnalyze} disabled={analyzing} className="w-full gap-2">
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  נתח ועדכן מלאי
                </Button>
              )}
            </div>
          )}

          {/* Results */}
          {rows && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">סה״כ: {rows.length}</Badge>
                <Badge variant="outline" className="text-primary border-primary/30">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  שודכו: {matchedCount}
                </Badge>
                {rows.length - matchedCount > 0 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <AlertCircle className="w-3 h-3 ml-1" />
                    ללא התאמה: {rows.length - matchedCount}
                  </Badge>
                )}
              </div>

              <div className="border border-border rounded-lg divide-y max-h-80 overflow-y-auto">
                {rows.map((row, idx) => (
                  <div key={idx} className="p-3 flex items-center gap-3 hover:bg-accent/20">
                    <input
                      type="checkbox"
                      checked={row.include}
                      disabled={!row.matchId}
                      onChange={(e) => {
                        const next = [...rows];
                        next[idx] = { ...next[idx], include: e.target.checked };
                        setRows(next);
                      }}
                      className="w-5 h-5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{row.parsed.name}</p>
                      {row.matchName ? (
                        <p className="text-xs text-muted-foreground truncate">→ {row.matchName}</p>
                      ) : (
                        <p className="text-xs text-amber-600">לא נמצאה התאמה במחסן</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      +{row.parsed.quantity} {row.parsed.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>ביטול</Button>
          {rows && (
            <Button onClick={handleApply} disabled={applying || includedCount === 0} className="gap-2">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              עדכן מלאי ({includedCount})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}