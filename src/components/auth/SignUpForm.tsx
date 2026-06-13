
import React, { useState } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { signUp } from '@/lib/auth';
import { toast } from "sonner";
import GoogleSignInButton from './GoogleSignInButton';
import { Eye, EyeOff } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

type FormData = z.infer<typeof formSchema>;

interface SignUpFormProps {
  onToggleMode: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      const result = await signUp(data.email, data.password, data.name);
      if (result.requiresVerification) {
        toast.success("Account created. Check your email to verify it before signing in.", { duration: 8000 });
        onToggleMode();
      } else {
        toast.success("Account created successfully!");
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
        <p className="mt-2 text-muted-foreground">
          Join PRODIGY to boost your productivity
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" disabled={isLoading} className="rounded-md" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" type="email" disabled={isLoading} className="rounded-md" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="••••••••" type={showPassword ? "text" : "password"} disabled={isLoading} className="rounded-md pr-10" {...field} />
                    <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={togglePasswordVisibility}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-brand text-white hover:bg-brand/90 transition-transform hover:scale-[1.01] rounded-md py-2.5" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
          
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <button type="button" className="text-brand hover:underline font-medium" onClick={onToggleMode}>
              Sign in
            </button>
          </div>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <GoogleSignInButton />
        </form>
      </Form>
    </div>
  );
};

export default SignUpForm;
