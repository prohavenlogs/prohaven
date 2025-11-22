import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageTransition from "@/components/PageTransition";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn, user, loading, resetPassword } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check for auth tokens in URL (from email verification)
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      // If there are auth tokens in the URL, process them
      if (accessToken || type) {
        try {
          // Let Supabase process the tokens
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error("Auth callback error:", error);
            toast.error("Failed to verify email. Please try signing in.");
          } else if (session) {
            toast.success("Email verified! Welcome to ProHaven.");
            // Clear the hash from URL
            window.history.replaceState(null, "", window.location.pathname);
            navigate("/dashboard", { replace: true });
            return;
          } else if (type === "signup" || type === "email") {
            toast.success("Email verified! Please sign in to continue.");
            // Clear the hash from URL
            window.history.replaceState(null, "", window.location.pathname);
          }
        } catch (err) {
          console.error("Error processing auth callback:", err);
        }
      }
      setCheckingAuth(false);
    };

    handleAuthCallback();
  }, [navigate]);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && !checkingAuth && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, checkingAuth, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { email, password } = formData;

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast.error(error.message || "Failed to sign in");
      } else {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Sign in error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResetting(true);

    try {
      const { error } = await resetPassword(resetEmail);

      if (error) {
        toast.error(error.message || "Failed to send reset email");
      } else {
        toast.success("Password reset email sent! Check your inbox.");
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsResetting(false);
    }
  };

  if (showForgotPassword) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-3xl shadow-card p-8 md:p-12 border border-border/20 hover:shadow-glow transition-shadow duration-300">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>

            <h1 className="text-2xl font-semibold text-center text-card-foreground mb-4">
              Reset Your Password
            </h1>

            <p className="text-center text-sm text-muted-foreground mb-8">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-muted-foreground text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="h-12 rounded-full pl-12"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isResetting}
                className="w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Sending...</span>
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="w-full h-12 rounded-full"
              >
                Back to Sign In
              </Button>
            </form>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-card rounded-3xl shadow-card p-8 md:p-12 border border-border/20 hover:shadow-glow transition-shadow duration-300">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-center text-card-foreground mb-4">
            Login to Your Account
          </h1>

          <p className="text-center text-sm text-muted-foreground mb-8">
            Enter your email and password to continue
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-sm">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-full pl-12"
                  aria-label="Email address"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-sm">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-full pl-12 pr-12"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-neon-blue hover:text-neon-pink transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow disabled:opacity-50 relative overflow-hidden group"
              aria-label="Sign in"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-neon-blue hover:text-neon-pink transition-colors font-medium"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default SignIn;
