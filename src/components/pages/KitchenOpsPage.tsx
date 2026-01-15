import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChefHat, 
  Croissant,
  Database,
  Calendar,
  Package,
  ClipboardList,
  Timer,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export const KitchenOpsPage = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<'bakery' | 'kitchen'>('kitchen');
  const [selectedDate] = useState(new Date());

  const formattedDate = format(selectedDate, 'EEEE, dd MMMM', { locale: he });

  const departmentColors = {
    bakery: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
    },
    kitchen: {
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
    },
  };

  const colors = departmentColors[selectedDepartment];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            פוסט מטבח
          </h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        <Button variant="outline" className="gap-2" disabled>
          <Calendar className="w-4 h-4" />
          בחר תאריך
        </Button>
      </div>

      {/* Department Tabs */}
      <Tabs 
        value={selectedDepartment} 
        onValueChange={(v) => setSelectedDepartment(v as 'bakery' | 'kitchen')}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="kitchen" className="gap-2">
            <ChefHat className="w-4 h-4" />
            מטבח
          </TabsTrigger>
          <TabsTrigger value="bakery" className="gap-2">
            <Croissant className="w-4 h-4" />
            קונדיטוריה
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedDepartment} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Production Column */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                ייצור למלאי
              </h2>
              
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className={`w-16 h-16 ${colors.bgLight} rounded-full flex items-center justify-center mb-4`}>
                      <Database className={`w-8 h-8 ${colors.text}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      לא מחובר לנתונים
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      יש ליצור את טבלת stock_productions בבסיס הנתונים
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assembly Orders Column */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                הזמנות להרכבה
              </h2>
              
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className={`w-16 h-16 ${colors.bgLight} rounded-full flex items-center justify-center mb-4`}>
                      <Database className={`w-8 h-8 ${colors.text}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      לא מחובר לנתונים
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      יש ליצור את טבלת assembly_orders בבסיס הנתונים
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Preview */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">יכולות מתוכננות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Package className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-medium">ייצור למלאי</p>
                  <p className="text-xs text-muted-foreground">stock_productions</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <ClipboardList className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-medium">הזמנות להרכבה</p>
                  <p className="text-xs text-muted-foreground">assembly_orders</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Timer className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-medium">מעקב זמנים</p>
                  <p className="text-xs text-muted-foreground">טיימר לכל משימה</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs font-medium">שיוך עובדים</p>
                  <p className="text-xs text-muted-foreground">הקצאת משימות</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
