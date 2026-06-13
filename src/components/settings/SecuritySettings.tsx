import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Shield, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    const checks = [
      { test: /.{8,}/, label: 'At least 8 characters' },
      { test: /[A-Z]/, label: 'Uppercase letter' },
      { test: /[a-z]/, label: 'Lowercase letter' },
      { test: /\d/, label: 'Number' },
      { test: /[^A-Za-z0-9]/, label: 'Special character' }
    ];
    
    checks.forEach(check => {
      if (check.test.test(pwd)) score++;
    });
    
    return { score, checks };
  };

  const { score, checks } = getPasswordStrength(password);
  const percentage = (score / 5) * 100;
  
  const getStrengthLabel = () => {
    if (score <= 1) return { label: 'Weak', color: 'text-red-600 dark:text-red-400' };
    if (score <= 2) return { label: 'Fair', color: 'text-orange-600 dark:text-orange-400' };
    if (score <= 3) return { label: 'Good', color: 'text-yellow-600 dark:text-yellow-400' };
    if (score <= 4) return { label: 'Strong', color: 'text-blue-600 dark:text-blue-400' };
    return { label: 'Very Strong', color: 'text-green-600 dark:text-green-400' };
  };

  if (!password) return null;

  const strength = getStrengthLabel();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password strength</span>
        <Badge variant="outline" className={strength.color}>
          {strength.label}
        </Badge>
      </div>
      
      <Progress 
        value={percentage} 
        className="h-2"
      />
      
      <div className="space-y-1">
        {checks.map((check, index) => {
          const passed = check.test.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {passed ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
              )}
              <span className={passed ? 'text-muted-foreground' : 'text-muted-foreground/60'}>
                {check.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SecuritySettings: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Password & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Keep your account secure by using a strong password and enabling two-factor authentication.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  Passwords do not match
                </div>
              )}
            </div>

            <Button className="w-full" disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}>
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;