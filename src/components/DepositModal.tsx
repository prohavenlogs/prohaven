import { useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, ExternalLink, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DepositModal = ({ open, onOpenChange, onSuccess }: DepositModalProps) => {
  const { address, isConnected } = useAccount();
  const { data: walletBalance, refetch } = useBalance({ address });

  // Refresh wallet balance when modal opens
  useEffect(() => {
    if (open && isConnected) {
      refetch();
    }
  }, [open, isConnected, refetch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-neon-blue" />
            Add Balance to Your Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Alert */}
          <Alert className="border-neon-blue/30 bg-neon-blue/5">
            <Info className="h-4 w-4 text-neon-blue" />
            <AlertDescription className="text-sm">
              You maintain full custody of your funds. Add crypto to your connected wallet through your wallet app or exchange.
            </AlertDescription>
          </Alert>

          {/* Current Wallet Balance */}
          {isConnected && walletBalance && (
            <Card className="p-6 bg-gradient-to-br from-neon-blue/10 to-neon-pink/10 border-neon-blue/30">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Your Wallet Balance</p>
                <p className="text-3xl font-bold text-foreground">
                  {parseFloat(walletBalance.formatted).toFixed(4)} {walletBalance.symbol}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            </Card>
          )}

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">How to Add Funds:</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-neon-blue/20 text-neon-blue font-semibold text-xs">
                  1
                </span>
                <span>Open your wallet app (MetaMask, Trust Wallet, etc.)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-neon-blue/20 text-neon-blue font-semibold text-xs">
                  2
                </span>
                <span>Transfer crypto from an exchange or another wallet</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-neon-blue/20 text-neon-blue font-semibold text-xs">
                  3
                </span>
                <span>Your balance will update automatically once confirmed</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-neon-blue/20 text-neon-blue font-semibold text-xs">
                  4
                </span>
                <span>Use your funds to purchase products on our platform</span>
              </li>
            </ol>
          </div>

          {/* Helpful Links */}
          <div className="pt-4 border-t border-border/20 space-y-2">
            <p className="text-sm font-semibold text-foreground">Need Help?</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('https://metamask.io/faqs/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                MetaMask Guide
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.open('https://community.trustwallet.com/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Trust Wallet Help
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => {
              refetch(); // Refresh balance before closing
              onOpenChange(false);
            }}
            className="w-full gradient-primary text-black font-semibold"
          >
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
