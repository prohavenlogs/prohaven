import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendEmail, emailTemplates } from "@/lib/email";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageTransition from "@/components/PageTransition";
import { Wallet, CheckCircle2, Mail } from "lucide-react";

const SignUp = () => {
  const navigate = useNavigate();
  const { signUpWithWallet, user, loading } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);
  const [step, setStep] = useState<"wallet" | "details" | "confirmation">("wallet");
  const [userEmail, setUserEmail] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Move to details step when wallet is connected
  useEffect(() => {
    if (isConnected && address && step === "wallet") {
      setStep("details");
      setShowWallets(false);
    }
  }, [isConnected, address, step]);

  const handleConnect = async (connector: any) => {
    try {
      connect({ connector });
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    const { fullName, email } = formData;

    if (!fullName || !email) {
      toast.error("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUpWithWallet(address, email, fullName);

      if (result.error) {
        if (result.error.message.includes("User already registered")) {
          toast.error("This wallet or email is already registered");
        } else {
          toast.error(result.error.message);
        }
      } else if (result.needsEmailConfirmation) {
        // Email confirmation required - show confirmation page
        setUserEmail(email);
        setStep("confirmation");

        // Send welcome email using Resend
        try {
          const template = emailTemplates.welcome(fullName);
          const result = await sendEmail({
            to: email,
            subject: template.subject,
            html: template.html,
          });

          if (!result.success) {
            console.error("Failed to send welcome email:", result.error);
          }
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      } else {
        toast.success("Account created successfully! Welcome to ProHavenLogs.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred");
      console.error("Sign up error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
            Create Your ProHavenLogs Account
          </h1>

          <p className="text-center text-sm text-muted-foreground mb-8">
            {step === "wallet"
              ? "Connect your Web3 wallet to get started"
              : "Complete your profile information"}
          </p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8 space-x-4">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "wallet" || isConnected ? "bg-neon-blue text-white" : "bg-muted text-muted-foreground"}`}>
                {isConnected ? <CheckCircle2 className="w-5 h-5" /> : "1"}
              </div>
              <span className="ml-2 text-sm text-muted-foreground">Connect Wallet</span>
            </div>
            <div className="w-12 h-0.5 bg-border"></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "details" ? "bg-neon-blue text-white" : "bg-muted text-muted-foreground"}`}>
                2
              </div>
              <span className="ml-2 text-sm text-muted-foreground">Your Details</span>
            </div>
          </div>

          {/* Wallet Connection Step */}
          {step === "wallet" && (
            <div className="space-y-4">
              {showWallets ? (
                <div className="space-y-3">
                  {connectors.map((connector) => (
                    <Button
                      key={connector.id}
                      onClick={() => handleConnect(connector)}
                      disabled={isConnecting}
                      className="w-full h-12 rounded-full bg-card border border-border/40 hover:border-neon-blue/50 text-card-foreground font-semibold shadow-sm hover:shadow-glow transition-all"
                    >
                      {isConnecting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Wallet className="w-5 h-5 mr-2" />
                          {connector.name}
                        </>
                      )}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setShowWallets(false)}
                    variant="outline"
                    className="w-full h-12 rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowWallets(true)}
                  disabled={isConnecting}
                  className="w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow disabled:opacity-50 relative overflow-hidden group"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </Button>
              )}
            </div>
          )}

          {/* Details Form Step */}
          {step === "details" && address && (
            <div className="space-y-5">
              {/* Connected Wallet Display */}
              <div className="p-4 bg-muted/20 rounded-2xl border border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                    <p className="text-sm font-semibold text-card-foreground">{formatAddress(address)}</p>
                  </div>
                  <Button
                    onClick={() => {
                      disconnect();
                      setStep("wallet");
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    Change
                  </Button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-muted-foreground text-sm">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter Your Full Name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-full"
                    aria-label="Full name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-full"
                    aria-label="Email address"
                  />
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
            </div>
          )}

          {/* Email Confirmation Step */}
          {step === "confirmation" && (
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
                  <li>Return here and sign in with your wallet</li>
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
                      setStep("details");
                      // Don't disconnect wallet - let user retry with same wallet
                      setFormData({ fullName: "", email: "" });
                    }}
                    className="text-neon-blue hover:text-neon-pink transition-colors"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Sign In Link */}
          {step !== "confirmation" && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/")}
                className="text-neon-blue hover:text-neon-pink transition-colors font-medium"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default SignUp;
