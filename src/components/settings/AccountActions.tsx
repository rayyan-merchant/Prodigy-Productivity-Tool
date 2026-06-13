
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteAccount, logout } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

const AccountActions: React.FC = () => {
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      const signOutPromise = logout();
      toast.loading("Signing out...", { id: "signout-toast" });
      await signOutPromise;
      toast.dismiss("signout-toast");
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success('Your account has been deleted');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Actions</CardTitle>
        <CardDescription>
          Manage your account access
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button 
          variant="destructive" 
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut size={16} /> Sign Out
        </Button>
        <AlertDialog onOpenChange={(open) => !open && setConfirmation('')}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
              <Trash2 size={16} /> Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your Prodigy account?</AlertDialogTitle>
              <AlertDialogDescription>This permanently removes your profile, tasks, sessions, habits, hydration history, and avatar. Type DELETE to continue.</AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="DELETE" autoComplete="off" />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={confirmation !== 'DELETE' || isDeleting} onClick={handleDeleteAccount}>
                {isDeleting ? 'Deleting...' : 'Delete account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default AccountActions;
