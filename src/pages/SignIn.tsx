import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageTransition from "@/components/PageTransition";
import { Wallet } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const { signInWithWallet, user, loading } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Handle wallet connection and auto sign-in
  useEffect(() => {
    const handleWalletSignIn = async () => {
      if (isConnected && address && !user && !isSubmitting) {
        setIsSubmitting(true);
        try {
          const { error } = await signInWithWallet(address);

          if (error) {
            toast.error(error.message || "Wallet not registered. Please sign up first.");
            disconnect();
            setShowWallets(false);
          } else {
            toast.success("Welcome back!");
            navigate("/dashboard");
          }
        } catch (error: any) {
          toast.error("An unexpected error occurred");
          console.error("Sign in error:", error);
          disconnect();
        } finally {
          setIsSubmitting(false);
        }
      }
    };

    handleWalletSignIn();
  }, [isConnected, address, user, signInWithWallet, navigate, disconnect, isSubmitting]);

  const handleConnect = async (connector: any) => {
    try {
      connect({ connector });
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
            Login to Access Your Account
          </h1>

          <p className="text-center text-sm text-muted-foreground mb-8">
            Connect your Web3 wallet to continue
          </p>

          {/* Wallet Connection */}
          <div className="space-y-4">
            {isConnected && address ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-2xl border border-border/40 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Connected Wallet</p>
                  <p className="text-lg font-semibold text-card-foreground">{formatAddress(address)}</p>
                </div>

                {isSubmitting && (
                  <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                    <LoadingSpinner size="sm" />
                    <span>Signing in...</span>
                  </div>
                )}

                <Button
                  onClick={() => disconnect()}
                  variant="outline"
                  className="w-full h-12 rounded-full"
                >
                  Disconnect
                </Button>
              </div>
            ) : showWallets ? (
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
                disabled={isConnecting || isSubmitting}
                className="w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow disabled:opacity-50 relative overflow-hidden group"
                aria-label="Connect wallet"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </Button>
            )}
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            New here?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-neon-blue hover:text-neon-pink transition-colors font-medium"
            >
              Sign Up
            </button>{" "}
            now
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default SignIn;
