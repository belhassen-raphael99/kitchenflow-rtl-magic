import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, KeyRound, ShieldQuestion, ShieldCheck } from 'lucide-react';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { LoginMethodsTab } from '@/components/settings/LoginMethodsTab';
import { SecurityQuestionTab } from '@/components/settings/SecurityQuestionTab';
import { TwoFactorTab } from '@/components/settings/TwoFactorTab';
import { cn } from '@/lib/utils';

export const SettingsPage = () => {
  const { isDemo } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">הגדרות משתמש</h1>
        <p className="text-muted-foreground text-sm mt-1">נהל את הפרופיל והאבטחה שלך</p>
      </div>

      {isDemo && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-md p-4 text-sm text-secondary-foreground">
          ⚠️ לא ניתן לשנות הגדרות במצב דמו
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <div className="flex flex-col md:flex-row gap-6">
          <TabsList className={cn(
            "flex md:flex-col h-auto bg-card border border-border rounded-md p-2 gap-1",
            "md:w-48 w-full shrink-0"
          )}>
            <TabsTrigger
              value="profile"
              className="justify-start gap-2 w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-3"
            >
              <User className="w-4 h-4" />
              פרופיל
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="justify-start gap-2 w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-3"
            >
              <Shield className="w-4 h-4" />
              אבטחה
            </TabsTrigger>
            <TabsTrigger
              value="login-methods"
              className="justify-start gap-2 w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-3"
            >
              <KeyRound className="w-4 h-4" />
              כניסה
            </TabsTrigger>
            <TabsTrigger
              value="security-question"
              className="justify-start gap-2 w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-3"
            >
              <ShieldQuestion className="w-4 h-4" />
              שאלת אבטחה
            </TabsTrigger>
            <TabsTrigger
              value="two-factor"
              className="justify-start gap-2 w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 py-3"
            >
              <ShieldCheck className="w-4 h-4" />
              אימות דו-שלבי
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-w-0">
            <TabsContent value="profile" className="mt-0">
              <ProfileTab />
            </TabsContent>
            <TabsContent value="security" className="mt-0">
              <SecurityTab />
            </TabsContent>
            <TabsContent value="login-methods" className="mt-0">
              <LoginMethodsTab />
            </TabsContent>
            <TabsContent value="security-question" className="mt-0">
              <SecurityQuestionTab />
            </TabsContent>
            <TabsContent value="two-factor" className="mt-0">
              <TwoFactorTab />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};
