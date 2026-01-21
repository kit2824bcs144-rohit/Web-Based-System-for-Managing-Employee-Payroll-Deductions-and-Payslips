import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Building, Briefcase, Phone, CreditCard, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Employee } from '@/types';

export default function Profile() {
  const { profile, refreshProfile, isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!profile) return;
      
      try {
        const { data } = await supabase
          .from('employees')
          .select('*, department:departments(*)')
          .eq('email', profile.email)
          .maybeSingle();
        
        setEmployee(data as Employee | null);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoadingEmployee(false);
      }
    };

    fetchEmployee();
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="h-32 gradient-primary" />
        <CardContent className="relative pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 sm:-mt-12">
            <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAdmin ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
              }`}>
                <Shield className="h-3 w-3 inline mr-1" />
                {isAdmin ? 'Administrator' : 'Employee'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              {isEditing ? (
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11"
                />
              ) : (
                <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center">
                  {profile.full_name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {profile.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Created</Label>
              <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {new Date(profile.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isLoading} className="flex-1 gradient-primary">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Details */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEmployee ? (
              <div className="space-y-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : employee ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Employee Code</Label>
                    <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center text-sm">
                      {employee.employee_code}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center text-sm">
                      {employee.designation}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {employee.department?.name || 'Not Assigned'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {employee.phone || 'Not provided'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date of Joining</Label>
                  <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(employee.date_of_joining).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bank Account</Label>
                  <div className="h-11 px-3 py-2 border rounded-lg bg-muted/50 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    {employee.bank_account_number 
                      ? `${employee.bank_name} - ****${employee.bank_account_number.slice(-4)}`
                      : 'Not provided'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No employee record linked to your account.</p>
                <p className="text-sm">Contact your administrator for assistance.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
