"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface FirstLoginPasswordChangeProps {
  tempToken: string;
  userEmail: string;
  isFirstLogin?: boolean;
  onSuccess: (accessToken: string, user: User) => void;
}

export default function FirstLoginPasswordChange({
  tempToken,
  userEmail,
  isFirstLogin = true,
  onSuccess
}: FirstLoginPasswordChangeProps) {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the new tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        onSuccess(data.accessToken, data.user);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);
  const getStrengthColor = (strength: number) => {
    if (strength < 2) return "bg-red-500";
    if (strength < 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength < 2) return "Weak";
    if (strength < 4) return "Medium";
    return "Strong";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            {isFirstLogin ? (
              <User className="w-8 h-8 text-orange-600" />
            ) : (
              <Lock className="w-8 h-8 text-orange-600" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isFirstLogin ? "Welcome to ledger1" : "Password Change Required"}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {isFirstLogin 
                ? "Please set your new password to continue" 
                : "You must change your password before continuing"
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Logged in as: <span className="font-medium">{userEmail}</span>
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter your new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {formData.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Password Strength:</span>
                    <span className={`font-medium ${
                      passwordStrength < 2 ? 'text-red-600' : 
                      passwordStrength < 4 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {getStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {formData.confirmPassword && (
                <div className="flex items-center space-x-2 text-xs">
                  {formData.newPassword === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">Passwords don&apos;t match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-orange-50 rounded-lg p-3 text-xs text-gray-600">
              <p className="font-medium text-orange-800 mb-1">Password Requirements:</p>
              <ul className="space-y-1">
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${formData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>At least 8 characters</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>One uppercase letter</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>One lowercase letter</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>One number</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${/[^A-Za-z0-9]/.test(formData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>One special character</span>
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={loading || formData.newPassword !== formData.confirmPassword || passwordStrength < 4}
            >
              {loading ? "Changing Password..." : "Set New Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 