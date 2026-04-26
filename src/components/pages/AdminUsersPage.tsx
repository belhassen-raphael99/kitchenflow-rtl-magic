import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useImpersonation } from '@/hooks/useImpersonation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, Shield, User, Mail, Trash2, Copy, Eye, KeyRound, Link2 } from 'lucide-react';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  fullName: z.string().min(2, 'שם מלא חייב להיות לפחות 2 תווים'),
  role: z.enum(['admin', 'employee']),
});

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'employee';
}

interface DemoToken {
  id: string;
  token: string;
  email: string | null;
  created_at: string;
  expires_at: string;
  used: boolean;
}

export const AdminUsersPage = () => {
  const { isAdmin, user: currentUser } = useAuthContext();
  const { startImpersonation, isImpersonating } = useImpersonation();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Invite form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');

  // Demo tokens state
  const [demoTokens, setDemoTokens] = useState<DemoToken[]>([]);
  const [demoTokensLoading, setDemoTokensLoading] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  const fetchDemoTokens = useCallback(async () => {
    setDemoTokensLoading(true);
    const { data } = await supabase
      .from('demo_tokens')
      .select('id, token, email, created_at, expires_at, used')
      .order('created_at', { ascending: false });
    setDemoTokens((data as DemoToken[]) || []);
    setDemoTokensLoading(false);
  }, []);

  const handleGenerateDemoLink = async () => {
    setGeneratingToken(true);
    const { data, error } = await supabase
      .from('demo_tokens')
      .insert({ created_by: currentUser?.id })
      .select('token')
      .single();

    if (error) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    } else if (data) {
      const url = `${window.location.origin}/demo?ref=${data.token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'הקישור הועתק ללוח!', description: url });
      fetchDemoTokens();
    }
    setGeneratingToken(false);
  };

  const handleRevokeDemoToken = async (tokenId: string) => {
    const { error } = await supabase.from('demo_tokens').delete().eq('id', tokenId);
    if (error) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    } else {
      toast({ title: 'הצלחה', description: 'הקישור בוטל' });
      fetchDemoTokens();
    }
  };

  const copyDemoLink = async (token: string) => {
    const url = `${window.location.origin}/demo?ref=${token}`;
    await navigator.clipboard.writeText(url);
    toast({ title: 'הועתק!', description: 'הקישור הועתק ללוח' });
  };
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at');

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email || '',
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: (userRole?.role as 'admin' | 'employee') || 'employee',
        };
      });

      setUsers(usersWithRoles);
    } catch (error: unknown) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchDemoTokens();
    }
  }, [isAdmin, fetchDemoTokens]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = inviteSchema.safeParse({ email, fullName, role });
    if (!validation.success) {
      const error = validation.error.errors[0];
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, fullName, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setInviteDialogOpen(false);
      toast({ title: 'הזמנה נשלחה!', description: `קישור הזמנה נשלח לכתובת ${email}` });
      resetForm();
      fetchUsers();
    } catch (error: unknown) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'employee') => {
    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        
        if (error) throw error;
      }

      toast({ title: 'הצלחה!', description: 'התפקיד עודכן בהצלחה' });
      fetchUsers();
    } catch (error: unknown) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('employee');
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'הצלחה!', description: 'המשתמש נמחק בהצלחה' });
      fetchUsers();
    } catch (error: unknown) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleResetPassword = async (userEmail: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'הצלחה!', description: `אימייל איפוס סיסמה נשלח ל-${userEmail}` });
    } catch (error: unknown) {
      toast({ title: 'שגיאה', description: error instanceof Error ? error.message : 'שגיאה לא ידועה', variant: 'destructive' });
    }
  };

  const handleImpersonate = async (userId: string, userEmail: string) => {
    await startImpersonation(userId, userEmail);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">אין הרשאה</h2>
          <p className="text-muted-foreground">דף זה זמין למנהלים בלבד</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">ניהול משתמשים</h1>
            <p className="text-muted-foreground">הזמן והגדר משתמשים למערכת</p>
          </div>
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 ml-2" />
              הזמן משתמש
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>הזמן משתמש חדש</DialogTitle>
              <DialogDescription>
                המשתמש יקבל קישור הזמנה לאימייל ויגדיר סיסמה בעצמו
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="fullName">שם מלא</Label>
                <div className="relative mt-1">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pr-10"
                    placeholder="ישראל ישראלי"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">אימייל</Label>
                <div className="relative mt-1">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="role">תפקיד</Label>
                <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'employee')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">עובד</SelectItem>
                    <SelectItem value="admin">מנהל</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={inviting}>
                  {inviting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  שלח הזמנה
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setInviteDialogOpen(false)}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-md border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">אין משתמשים במערכת</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">אימייל</TableHead>
                <TableHead className="text-right">תפקיד</TableHead>
                <TableHead className="text-right">תאריך הצטרפות</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || 'ללא שם'}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select 
                      value={user.role} 
                      onValueChange={(v) => handleRoleChange(user.id, v as 'admin' | 'employee')}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'מנהל' : 'עובד'}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">עובד</SelectItem>
                        <SelectItem value="admin">מנהל</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell>
                    {user.id !== currentUser?.id && (
                      <div className="flex items-center gap-1">
                        {/* Impersonate - only for non-admin users */}
                        {user.role !== 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="התחבר כמשתמש"
                                disabled={isImpersonating}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>מצב התחזות</AlertDialogTitle>
                                <AlertDialogDescription>
                                  אתה עומד להיכנס למצב התחזות כ-<strong>{user.email}</strong>.
                                  <br />כל הפעולות יירשמו ביומן הביקורת.
                                  <br />המצב יסתיים אוטומטית לאחר 30 דקות.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-row-reverse gap-2">
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleImpersonate(user.id, user.email)}
                                >
                                  אישור — התחבר כמשתמש
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {/* Reset password */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="איפוס סיסמה"
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>איפוס סיסמה</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם לשלוח אימייל איפוס סיסמה ל-{user.email}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleResetPassword(user.email)}>
                                שלח איפוס
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Delete user */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingUserId === user.id}
                            >
                              {deletingUserId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>מחיקת משתמש</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק את {user.full_name || user.email}? 
                                פעולה זו תמחק את המשתמש לצמיתות ולא ניתן לבטלה.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                מחק משתמש
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Demo Access Section */}
      <div className="bg-card rounded-md border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">גישת דמו</h2>
              <p className="text-sm text-muted-foreground">צור קישורי דמו לגישה מוגבלת למערכת</p>
            </div>
          </div>
          <Button onClick={handleGenerateDemoLink} disabled={generatingToken} className="gap-2">
            {generatingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            צור קישור דמו
          </Button>
        </div>

        {demoTokensLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : demoTokens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">אין קישורי דמו</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">אימייל</TableHead>
                <TableHead className="text-right">נוצר</TableHead>
                <TableHead className="text-right">פג תוקף</TableHead>
                <TableHead className="text-right">שומש</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoTokens.map((dt) => (
                <TableRow key={dt.id}>
                  <TableCell>{dt.email || 'לא נוצל'}</TableCell>
                  <TableCell>{new Date(dt.created_at).toLocaleDateString('he-IL')}</TableCell>
                  <TableCell>{new Date(dt.expires_at).toLocaleDateString('he-IL')}</TableCell>
                  <TableCell>
                    <Badge variant={dt.used ? 'default' : 'secondary'}>
                      {dt.used ? '✅' : '❌'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => copyDemoLink(dt.token)} title="העתק קישור">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRevokeDemoToken(dt.id)}
                        title="בטל קישור"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

    </div>
  );
};
