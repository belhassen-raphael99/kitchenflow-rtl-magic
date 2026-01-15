import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Database,
  ChefHat,
  DollarSign,
  ListChecks
} from 'lucide-react';

export const RecipesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            ספר מתכונים
          </h1>
          <p className="text-muted-foreground">ניהול מתכונים ומחירים</p>
        </div>
        <Button className="gap-2" disabled>
          <Plus className="w-4 h-4" />
          מתכון חדש
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש מתכון..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
          disabled
        />
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
              יש ליצור את טבלאות recipes ו-recipe_ingredients בבסיס הנתונים כדי להשתמש בספר המתכונים.
            </p>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">recipes</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <ListChecks className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">recipe_ingredients</p>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    ניהול מתכונים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    יצירה, עריכה ומחיקה של מתכונים עם מרכיבים והוראות הכנה
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    חישוב עלויות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    חישוב אוטומטי של עלות מתכון לפי מחירי חומרי גלם
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    קישור למחסן
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    קישור מרכיבים לפריטי מחסן לניהול מלאי חכם
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
