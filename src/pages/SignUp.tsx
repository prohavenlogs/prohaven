import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendEmail, emailTemplates } from "@/lib/email";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageTransition from "@/components/PageTransition";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"form" | "confirmation">("form");
  const [userEmail, setUserEmail] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Password validation
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp(email, password, fullName);

      if (result.error) {
        toast.error(result.error.message);
      } else if (result.needsEmailConfirmation) {
        // Email confirmation required - show confirmation page
        setUserEmail(email);
        setStep("confirmation");

        // Send welcome email using Resend
        try {
          const template = emailTemplates.welcome(fullName);
          const emailResult = await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
          });

          if (!emailResult.success) {
            console.error("Failed to send welcome email:", emailResult.error);
          }
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      } else {
        toast.success("Account created successfully! Welcome to ProHavenLogs.");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Sign up error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Email Confirmation Step
  if (step === "confirmation") {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-3xl shadow-card p-8 md:p-12 border border-border/20 hover:shadow-glow transition-shadow duration-300">
            <div className="flex justify-center mb-6">
              <Logo />
            </div>

            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-neon-blue/20 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-neon-blue" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Check Your Email
                </h2>
                <p className="text-muted-foreground">
                  We've sent a confirmation link to
                </p>
                <p className="text-neon-blue font-semibold text-lg">
                  {userEmail}
                </p>
                <p className="text-muted-foreground text-sm">
                  Click the link in the email to verify your account and complete your registration.
                </p>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 text-left space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-card-foreground">Next steps:</span>
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the confirmation link</li>
                  <li>Return here and sign in</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow relative overflow-hidden group"
                >
                  Go to Sign In
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </Button>

                <p className="text-xs text-muted-foreground">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => {
                      setStep("form");
                      setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
                    }}
                    className="text-neon-blue hover:text-neon-pink transition-colors"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </div>
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
            Create Your Account
          </h1>

          <p className="text-center text-sm text-muted-foreground mb-8">
            Fill in your details to get started
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-muted-foreground text-sm">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-full pl-12"
                  aria-label="Full name"
                />
              </div>
            </div>

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
                  placeholder="Create a password"
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
              <p className="text-xs text-muted-foreground pl-2">
                Must be at least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-muted-foreground text-sm">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-full pl-12 pr-12"
                  aria-label="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow disabled:opacity-50 relative overflow-hidden group"
              aria-label="Create your account"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating Account...</span>
                </>
              ) : (
                "Create Account"
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="text-neon-blue hover:text-neon-pink transition-colors font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default SignUp;
