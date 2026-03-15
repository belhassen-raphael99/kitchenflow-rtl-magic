import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';

export const ProfileTab = () => {
  const { user, role, isDemo } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const userEmail = user?.email || '';
  const roleLabel = role === 'admin' ? 'מנהל' : role === 'demo' ? 'דמו' : 'עובד';

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setFullName(data.full_name || '');
      setAvatarUrl(data.avatar_url);
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName.substring(0, 2).toUpperCase();
    }
    return userEmail.substring(0, 2).toUpperCase();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ title: 'שגיאה', description: 'ניתן להעלות רק קבצי JPG או PNG', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'שגיאה', description: 'הקובץ חייב להיות קטן מ-2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting param
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(url);
      toast({ title: 'הצלחה', description: 'תמונת הפרופיל עודכנה ✓' });
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message || 'שגיאה בהעלאת התמונה', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (fullName.trim().length < 2) {
      toast({ title: 'שגיאה', description: 'שם מלא חייב להכיל לפחות 2 תווים', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: 'הצלחה', description: 'הפרופיל עודכן בהצלחה ✓' });
    } catch (err: any) {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>פרופיל</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            {!isDemo && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-background animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-background" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isDemo}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">תמונת פרופיל</p>
            <p className="text-xs text-muted-foreground">JPG או PNG, עד 2MB</p>
          </div>
        </div>

        {/* Full name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">שם מלא</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="הכנס שם מלא"
            disabled={isDemo}
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label>אימייל</Label>
          <Input value={userEmail} disabled className="bg-muted/50" />
          <p className="text-xs text-muted-foreground">ניתן לשנות אימייל בלשונית אבטחה</p>
        </div>

        {/* Role (read-only) */}
        <div className="space-y-2">
          <Label>תפקיד</Label>
          <div>
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading || isDemo} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          שמור שינויים
        </Button>
      </CardContent>
    </Card>
  );
};
