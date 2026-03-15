import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShieldQuestion, CheckCircle } from 'lucide-react';

const SECURITY_QUESTIONS = [
  'מה שם החיית המחמד הראשונה שלך?',
  'מה שם בית הספר היסודי שלך?',
  'מה העיר שבה נולדת?',
  'מה שם הרחוב שגדלת בו?',
  'מה המנה האהובה עליך?',
  'מה שם חבר הילדות הטוב ביותר שלך?',
];

export const SecurityQuestionTab = () => {
  const { user, isDemo } = useAuth();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [existingQuestion, setExistingQuestion] = useState('');

  useEffect(() => {
    if (user) fetchExisting();
  }, [user]);

  const fetchExisting = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('security_questions')
      .select('question')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setHasExisting(true);
      setExistingQuestion(data.question);
      setQuestion(data.question);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!question) {
      toast({ title: 'שגיאה', description: 'נא לבחור שאלת אבטחה', variant: 'destructive' });
      return;
    }
    if (answer.trim().length < 3) {
      toast({ title: 'שגיאה', description: 'התשובה חייבת להכיל לפחות 3 תווים', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Hash the answer server-side
      const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-security-answer', {
        body: { answer: answer.trim() },
      });

      if (hashError || !hashData?.hash) {
        throw new Error(hashError?.message || 'שגיאה בהצפנת התשובה');
      }

      if (hasExisting) {
        const { error } = await supabase
          .from('security_questions')
          .update({ question, answer_hash: hashData.hash, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('security_questions')
          .insert({ user_id: user.id, question, answer_hash: hashData.hash });
        if (error) throw error;
      }

      setHasExisting(true);
      setExistingQuestion(question);
      setAnswer('');
      toast({ title: 'הצלחה', description: 'שאלת האבטחה נשמרה בהצלחה ✓' });
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldQuestion className="w-5 h-5" />
          שאלת אבטחה
        </CardTitle>
        <CardDescription>
          שאלת אבטחה מספקת שכבת אימות נוספת לזיהוי הזהות שלך בעת פנייה למנהל לאיפוס סיסמה
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasExisting && (
          <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-foreground">
            <CheckCircle className="w-4 h-4 text-primary shrink-0" />
            <span>שאלת אבטחה מוגדרת: <strong>{existingQuestion}</strong></span>
          </div>
        )}

        <div className="space-y-2">
          <Label>בחר שאלה</Label>
          <Select value={question} onValueChange={setQuestion} disabled={isDemo}>
            <SelectTrigger>
              <SelectValue placeholder="בחר שאלת אבטחה..." />
            </SelectTrigger>
            <SelectContent>
              {SECURITY_QUESTIONS.map((q) => (
                <SelectItem key={q} value={q}>{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sq-answer">תשובה</Label>
          <Input
            id="sq-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="הכנס תשובה (לפחות 3 תווים)"
            disabled={isDemo}
          />
          <p className="text-xs text-muted-foreground">התשובה מוצפנת ואינה נשמרת בטקסט גלוי</p>
        </div>

        <Button onClick={handleSave} disabled={loading || isDemo} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {hasExisting ? 'עדכן שאלת אבטחה' : 'שמור שאלת אבטחה'}
        </Button>
      </CardContent>
    </Card>
  );
};
