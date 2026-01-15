import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Plus, 
  Database,
  Snowflake,
  Thermometer,
  History,
  AlertTriangle
} from 'lucide-react';

export const ReservePage = () => {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            רזרבה (מלאי הייצור)
          </h1>
          <p className="text-muted-foreground">ניהול מוצרים מוכנים למלאי</p>
        </div>
        <Button className="gap-2" disabled>
          <Plus className="w-4 h-4" />
          פריט חדש
        </Button>
      </div>

      {/* No Data State */}
      <Card>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Database className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              לא מחובר לנתונים
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              יש ליצור את טבלאות reserve_items ו-production_logs בבסיס הנתונים כדי להשתמש במערכת הרזרבה.
            </p>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <Package className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">reserve_items</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <History className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">production_logs</p>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-3xl">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Snowflake className="w-4 h-4" />
                    מוצרים קפואים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    ניהול מלאי מוצרים קפואים
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Thermometer className="w-4 h-4" />
                    מוצרים טריים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    ניהול מלאי מוצרים טריים
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="w-4 h-4" />
                    יומן ייצור
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    מעקב אחר כל הייצור
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    התראות מלאי
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    התראה על מלאי נמוך
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
