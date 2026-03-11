import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, MessageCircle, Mail } from 'lucide-react';

export const DemoExpiredPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">סשן הדמו הסתיים</h1>
            <p className="text-muted-foreground text-lg">תודה שהתנסית בקסרולה! 🍲</p>
          </div>
          <p className="text-muted-foreground">צרו קשר לקבלת גישה מלאה למערכת</p>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full gap-2 bg-green-600 hover:bg-green-700">
              <a href="https://wa.me/972500000000" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
                שלח הודעה בוואטסאפ
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2">
              <a href="mailto:contact@casserole.co.il">
                <Mail className="w-4 h-4" />
                שלח אימייל
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
