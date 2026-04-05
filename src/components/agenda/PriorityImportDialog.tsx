import { useState, useRef } from 'react';
import { FileUp, Loader2, Upload } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PriorityImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (data: any) => void;
}

export const PriorityImportDialog = ({ open, onOpenChange, onImportComplete }: PriorityImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.type !== 'application/pdf') {
        toast({ title: 'סוג קובץ לא נתמך', description: 'יש להעלות קובץ PDF בלבד', variant: 'destructive' });
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: 'קובץ גדול מדי', description: 'גודל מקסימלי: 10MB', variant: 'destructive' });
        return;
      }
      setFile(f);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call edge function
      const { data, error } = await supabase.functions.invoke('parse-priority-pdf', {
        body: { pdf_base64: base64 },
      });

      if (error) throw error;

      if (!data?.success) {
        if (data?.error === 'not_priority_quote') {
          toast({ title: 'הקובץ אינו נראה כהצעת מחיר מ-Priority', description: 'נסה שוב עם קובץ אחר', variant: 'destructive' });
        } else if (data?.error === 'parse_failed') {
          toast({ title: 'שגיאה בקריאת הקובץ', description: 'ייתכן שהקובץ פגום', variant: 'destructive' });
        } else {
          toast({ title: 'שגיאה', description: 'לא ניתן לקרוא את הקובץ', variant: 'destructive' });
        }
        return;
      }

      // Match food items to catalog
      const foodItems = (data.data.items || []).filter((i: any) => !i.is_service);
      const { data: catalogItems } = await supabase
        .from('catalog_items')
        .select('id, name_website, name_internal, department, recipe_id, unit_type');

      const matchedItems = foodItems.map((item: any) => {
        const match = (catalogItems || []).find((c: any) =>
          c.name_website === item.name ||
          c.name_internal === item.name ||
          item.name.includes(c.name_website?.split(' ')[0]) ||
          c.name_website?.includes(item.name.split(' ')[0])
        );
        return {
          name: item.name,
          quantity: item.quantity,
          catalog_id: match?.id || null,
          recipe_id: match?.recipe_id || null,
          department: match?.department || null,
          unit: match?.unit_type || 'מנות',
          matched: !!match,
          catalog_name: match?.name_internal || null,
        };
      });

      const unmatchedCount = matchedItems.filter((i: any) => !i.matched).length;

      onImportComplete({
        client: data.data.client,
        event: data.data.event,
        quote_number: data.data.quote_number,
        items: matchedItems,
        unmatchedCount,
      });

      onOpenChange(false);
      setFile(null);

      toast({
        title: '📄 הצעת מחיר יובאה בהצלחה',
        description: unmatchedCount > 0
          ? `${matchedItems.length} פריטים יובאו, ${unmatchedCount} דורשים התאמה ידנית`
          : `${matchedItems.length} פריטים יובאו והותאמו לקטלוג`,
      });
    } catch (err: any) {
      console.error('Import error:', err);
      toast({ title: 'שגיאה בייבוא', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') {
      setFile(f);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); setFile(null); } }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ייבא הצעת מחיר מ-Priority</DialogTitle>
        </DialogHeader>

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="space-y-2">
              <FileUp className="w-10 h-10 mx-auto text-primary" />
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="font-medium">📄 גרור PDF או לחץ לבחירה</p>
              <p className="text-xs text-muted-foreground">PDF בלבד • עד 10MB</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-start">
          <Button variant="ghost" onClick={() => { onOpenChange(false); setFile(null); }} disabled={loading}>
            ביטול
          </Button>
          <Button onClick={handleImport} disabled={!file || loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            ייבא
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
