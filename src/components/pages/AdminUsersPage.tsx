import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { Loader2, UserPlus, Users, Shield, User, Mail, Key, RefreshCw, Trash2 } from 'lucide-react';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  fullName: z.string().min(2, 'שם מלא חייב להיות לפחות 2 תווים'),
  password: z.string().min(6, 'הסיסמה חייבת להיות לפחות 6 תווים'),
  role: z.enum(['admin', 'employee']),
});

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'employee';
}

export const AdminUsersPage = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Invite form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');

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
    }
  }, [isAdmin]);

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

      toast({ title: 'הצלחה!', description: `המשתמש ${email} נוצר בהצלחה` });
      setInviteDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
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
                    )}
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
