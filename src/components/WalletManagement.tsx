import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, Plus, Trash2, Star, StarOff, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

const WalletManagement = () => {
  const { userWallets, linkWallet, unlinkWallet, setPrimaryWallet } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleLinkCurrentWallet = async () => {
    if (!address) {
      toast.error("Please connect a wallet first");
      return;
    }

    // Check if wallet is already linked
    const alreadyLinked = userWallets.some(
      w => w.wallet_address.toLowerCase() === address.toLowerCase()
    );

    if (alreadyLinked) {
      toast.error("This wallet is already linked to your account");
      return;
    }

    setIsLinking(true);
    try {
      const { error } = await linkWallet(address, nickname || undefined);

      if (error) {
        toast.error(error.message || "Failed to link wallet");
      } else {
        toast.success("Wallet linked successfully!");
        setShowLinkDialog(false);
        setShowWalletSelector(false);
        setNickname("");
        disconnect(); // Disconnect after linking
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Link wallet error:", error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkWallet = async (walletId: string, walletAddr: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to unlink wallet ${formatAddress(walletAddr)}?`
    );

    if (!confirmed) return;

    try {
      const { error } = await unlinkWallet(walletId);

      if (error) {
        toast.error(error.message || "Failed to unlink wallet");
      } else {
        toast.success("Wallet unlinked successfully!");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Unlink wallet error:", error);
    }
  };

  const handleSetPrimary = async (walletId: string) => {
    try {
      const { error } = await setPrimaryWallet(walletId);

      if (error) {
        toast.error(error.message || "Failed to set primary wallet");
      } else {
        toast.success("Primary wallet updated!");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Set primary wallet error:", error);
    }
  };

  const handleConnect = async (connector: any) => {
    try {
      connect({ connector });
      setShowWalletSelector(false);
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Linked Wallets</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage wallets linked to your account
          </p>
        </div>
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-black font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Link Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
            <DialogHeader>
              <DialogTitle>Link a New Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Info Alert */}
              <Alert className="border-neon-blue/30 bg-neon-blue/5">
                <Info className="h-4 w-4 text-neon-blue" />
                <AlertDescription className="text-sm">
                  You can link multiple wallets to your account and switch between them.
                  Transactions will be tracked per wallet.
                </AlertDescription>
              </Alert>

              {/* Nickname Input */}
              <div className="space-y-2">
                <Label htmlFor="nickname">Wallet Nickname (Optional)</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="e.g., MetaMask Main, Trust Backup"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-12 rounded-full"
                />
              </div>

              {/* Wallet Connection */}
              {isConnected && address ? (
                <div className="space-y-4">
                  <Alert className="border-green-500/30 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400 text-sm flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Connected: {formatAddress(address)}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleLinkCurrentWallet}
                      disabled={isLinking}
                      className="flex-1 gradient-primary text-black font-semibold"
                    >
                      {isLinking ? <LoadingSpinner size="sm" /> : "Link This Wallet"}
                    </Button>
                    <Button
                      onClick={() => disconnect()}
                      variant="outline"
                      className="flex-1"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : showWalletSelector ? (
                <div className="space-y-3">
                  {connectors.map((connector) => (
                    <Button
                      key={connector.id}
                      onClick={() => handleConnect(connector)}
                      disabled={isConnecting}
                      className="w-full h-12 rounded-full bg-card border border-border/40 hover:border-neon-blue/50 text-card-foreground font-semibold"
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
                    onClick={() => setShowWalletSelector(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowWalletSelector(true)}
                  className="w-full h-12 rounded-full gradient-primary text-black font-semibold"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Wallets List */}
      {userWallets.length === 0 ? (
        <Card className="p-8 text-center">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No wallets linked yet</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {userWallets.map((wallet) => (
            <Card key={wallet.id} className={`p-6 ${wallet.is_primary ? 'border-neon-blue border-2' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-5 h-5 text-neon-blue" />
                    <h3 className="font-semibold text-foreground">
                      {wallet.nickname || 'Unnamed Wallet'}
                    </h3>
                    {wallet.is_primary && (
                      <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {wallet.wallet_address}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Added {new Date(wallet.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!wallet.is_primary && (
                    <>
                      <Button
                        onClick={() => handleSetPrimary(wallet.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <StarOff className="w-4 h-4" />
                        Set as Primary
                      </Button>
                      <Button
                        onClick={() => handleUnlinkWallet(wallet.id, wallet.wallet_address)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-500 hover:text-red-600 hover:border-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                        Unlink
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Section */}
      <Alert className="border-border/30 bg-muted/20">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <p className="font-semibold mb-2">About Linked Wallets:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Your primary wallet is used for your main profile</li>
            <li>You can sign in with any linked wallet</li>
            <li>Each transaction is tracked to the specific wallet used</li>
            <li>You cannot unlink your primary wallet (set another as primary first)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WalletManagement;
