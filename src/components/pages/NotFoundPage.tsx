import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 space-y-6">
          <div className="text-7xl font-bold text-primary">404</div>
          <div>
            <h1 className="text-2xl font-bold mb-2">הדף לא נמצא</h1>
            <p className="text-muted-foreground">הדף שחיפשת אינו קיים או שהוסר</p>
          </div>
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="w-4 h-4" />
            חזרה לדשבורד
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
