import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, CheckCircle2, Database } from 'lucide-react';
import { seedSuppliers, seedCategories } from '@/data/seedSuppliers';
import { seedWarehouseItems } from '@/data/seedWarehouse';
import { seedRecipes } from '@/data/seedRecipes';
import { seedReserveItems } from '@/data/seedReserve';
import { supabase } from '@/integrations/supabase/client';

export const SeedDataPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);
    setStatus('מכין נתונים...');

    try {
      setProgress(20);
      setStatus('שולח נתונים לשרת...');

      const payload = {
        suppliers: seedSuppliers,
        categories: seedCategories,
        warehouseItems: seedWarehouseItems,
        recipes: seedRecipes,
        reserveItems: seedReserveItems,
      };

      setProgress(40);
      setStatus('מייבא ספקים וקטגוריות...');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/seed-data`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      setProgress(80);
      setStatus('מעבד תוצאות...');

      const data = await response.json();

      if (data.success) {
        setResult(data.summary);
        setProgress(100);
        setStatus('הייבוא הושלם בהצלחה! 🎉');
      } else {
        setError(data.error || 'שגיאה לא ידועה');
        setProgress(0);
        setStatus('');
      }
    } catch (err: any) {
      setError(err.message);
      setProgress(0);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6" dir="rtl">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>עמוד זמני</AlertTitle>
        <AlertDescription>מחק עמוד זה לאחר ייבוא מוצלח של הנתונים</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            ייבוא נתונים מ-Excel
          </CardTitle>
          <CardDescription>
            ספקים: {seedSuppliers.length} | קטגוריות: {seedCategories.length} | 
            מוצרי מחסן: {seedWarehouseItems.length} | מתכונים: {seedRecipes.length} | 
            פריטי מלאי: {seedReserveItems.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>שגיאה</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>ייבוא הושלם</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {Object.entries(result).map(([key, val]) => (
                    <li key={key}>✅ {key}: {val} רשומות</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSeed} disabled={loading} size="lg" className="w-full">
            {loading ? <><Loader2 className="animate-spin mr-2" /> מייבא...</> : 'התחל ייבוא נתונים'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
