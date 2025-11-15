import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PageTransition from "@/components/PageTransition";
import Logo from "@/components/Logo";

const ADMIN_EMAIL = "prohavenlogs@gmail.com";

export const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      toast.error("Access denied. Only admin email is allowed.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md bg-card rounded-3xl shadow-card p-8 md:p-12 border border-border/20 hover:shadow-glow transition-shadow duration-300">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo />
          </div>

          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-neon-blue/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-neon-blue" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-center text-card-foreground mb-2">
            Admin Access
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Enter your admin email to receive a login link
          </p>

          {!emailSent ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-sm">
                  Admin Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="prohavenlogs@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-full pl-10"
                    aria-label="Admin email address"
                  />
                </div>
              </div>

              {/* Info Alert */}
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400 text-sm">
                  Only the authorized admin email can access this panel.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow disabled:opacity-50 relative overflow-hidden group"
              >
                {loading ? (
                  <span>Sending Magic Link...</span>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Send Login Link
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </Button>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-green-400" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Check Your Email
                </h2>
                <p className="text-muted-foreground">
                  We've sent a login link to
                </p>
                <p className="text-neon-blue font-semibold text-lg break-all">
                  {email}
                </p>
                <p className="text-muted-foreground text-sm">
                  Click the link in the email to access the admin panel.
                </p>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 text-left space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-card-foreground">Next steps:</span>
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Check your email inbox</li>
                  <li>Click the magic link</li>
                  <li>You'll be redirected to the admin panel</li>
                </ol>
              </div>

              {/* Resend Button */}
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                variant="outline"
                className="w-full h-12 rounded-full"
              >
                Send Another Link
              </Button>
            </div>
          )}

          {/* Back to Home */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            <a
              href="/dashboard"
              className="text-neon-blue hover:text-neon-pink transition-colors"
            >
              ← Back to Dashboard
            </a>
          </p>
        </Card>
      </div>
    </PageTransition>
  );
};
