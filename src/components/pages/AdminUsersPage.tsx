import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { Loader2, UserPlus, Users, Shield, User, Mail, Key, RefreshCw, Trash2, Copy, CheckCircle2, AlertTriangle, Eye, KeyRound, Link2 } from 'lucide-react';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  fullName: z.string().min(2, 'שם מלא חייב להיות לפחות 2 תווים'),
  password: z.string()
    .min(12, 'הסיסמה חייבת להיות לפחות 12 תווים')
    .regex(/[A-Z]/, 'חייבת לכלול לפחות אות גדולה אחת')
    .regex(/[0-9]/, 'חייבת לכלול לפחות ספרה אחת')
    .regex(/[^A-Za-z0-9]/, 'חייבת לכלול לפחות תו מיוחד אחד'),
  role: z.enum(['admin', 'employee']),
});

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'employee';
}

interface CreatedUserCredentials {
  email: string;
  password: string;
  fullName: string;
  emailSent: boolean;
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
  const { isAdmin, user: currentUser } = useAuth();
  const { startImpersonation, isImpersonating } = useImpersonation();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Credentials modal state
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<CreatedUserCredentials | null>(null);
  
  // Invite form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
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
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
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
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
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
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
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
    
    const validation = inviteSchema.safeParse({ email, fullName, password, role });
    if (!validation.success) {
      const error = validation.error.errors[0];
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, fullName, password, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Close invite dialog and open credentials dialog
      setInviteDialogOpen(false);
      setCreatedUserCredentials({
        email: data.credentials?.email || email,
        password: data.credentials?.password || password,
        fullName: data.credentials?.fullName || fullName,
        emailSent: data.emailSent || false,
      });
      setCredentialsDialogOpen(true);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    } finally {
      setInviting(false);
    }
  };

  const copyCredentials = async () => {
    if (!createdUserCredentials) return;
    
    const text = `פרטי התחברות למערכת קסרולה:
אימייל: ${createdUserCredentials.email}
סיסמה: ${createdUserCredentials.password}`;
    
    await navigator.clipboard.writeText(text);
    toast({ title: 'הועתק!', description: 'פרטי ההתחברות הועתקו ללוח' });
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
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPassword('');
    setRole('employee');
  };

  const generatePassword = () => {
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const special = '!@#$%&*';
    
    // Ensure at least one of each required type
    let result = '';
    result += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    result += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    result += special.charAt(Math.floor(Math.random() * special.length));
    
    // Fill the rest to reach 14 characters
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = 0; i < 10; i++) {
      result += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the result
    const shuffled = result.split('').sort(() => Math.random() - 0.5).join('');
    setPassword(shuffled);
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
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
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
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
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
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
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
                צור חשבון חדש ושלח פרטי התחברות למשתמש
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
                <Label htmlFor="password">סיסמה זמנית</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      placeholder="לפחות 6 תווים"
                      required
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={generatePassword}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
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
                  צור והזמן
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
      <div className="bg-card rounded-xl border border-border overflow-hidden">
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

      {/* Credentials Dialog - Shows after successful user creation */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              משתמש נוצר בהצלחה!
            </DialogTitle>
            <DialogDescription>
              שמור את פרטי ההתחברות או העתק אותם כדי לשלוח למשתמש
            </DialogDescription>
          </DialogHeader>
          
          {createdUserCredentials && (
            <div className="space-y-4 mt-4">
              {/* User Info */}
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-lg">{createdUserCredentials.fullName}</p>
              </div>

              {/* Credentials Box */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">אימייל:</span>
                  <span className="font-mono font-medium">{createdUserCredentials.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">סיסמה:</span>
                  <span className="font-mono font-medium">{createdUserCredentials.password}</span>
                </div>
              </div>

              {/* Copy Button */}
              <Button onClick={copyCredentials} variant="outline" className="w-full">
                <Copy className="w-4 h-4 ml-2" />
                העתק פרטי התחברות
              </Button>

              {/* Email Status */}
              {createdUserCredentials.emailSent ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    אימייל עם פרטי ההתחברות נשלח בהצלחה
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700 dark:text-amber-400">
                    <p className="font-medium">לא נשלח אימייל</p>
                    <p>יש להעביר את פרטי ההתחברות למשתמש באופן ידני</p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <Button 
                onClick={() => setCredentialsDialogOpen(false)} 
                className="w-full"
              >
                סגור
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
