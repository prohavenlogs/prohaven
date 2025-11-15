import { useEffect, useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productPrice: number;
  productId: string;
  category: string;
  onSuccess: () => void;
}

interface WalletAddress {
  id: string;
  currency: string;
  address: string;
}

export const PurchaseModal = ({
  open,
  onOpenChange,
  productName,
  productPrice,
  productId,
  category,
  onSuccess,
}: PurchaseModalProps) => {
  const { user } = useAuth();
  const { address: userWallet, isConnected } = useAccount();
  const { sendTransaction, data: hash, isPending: isSending, error: txError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch available wallet addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data, error } = await supabase
          .from("wallet_addresses")
          .select("*")
          .order("currency");

        if (error) throw error;
        setWalletAddresses(data || []);

        // Auto-select Ethereum if available
        const ethAddress = data?.find(addr => addr.currency === "Ethereum");
        if (ethAddress) {
          setSelectedCrypto("Ethereum");
        } else if (data && data.length > 0) {
          setSelectedCrypto(data[0].currency);
        }
      } catch (error) {
        console.error("Error fetching wallet addresses:", error);
        toast.error("Failed to load payment options");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchAddresses();
    }
  }, [open]);

  // Get selected wallet address
  const selectedAddress = walletAddresses.find(addr => addr.currency === selectedCrypto);

  // Calculate crypto amount (simplified conversion - in production use real-time rates)
  const getCryptoAmount = () => {
    if (!selectedCrypto) return "0";

    const conversionRates: Record<string, number> = {
      "Bitcoin": 65000,    // 1 BTC = $65,000
      "Ethereum": 3000,    // 1 ETH = $3,000
      "Litecoin": 80,      // 1 LTC = $80
      "Solana": 150,       // 1 SOL = $150
      "USDT": 1,           // 1 USDT = $1
      "USDC": 1,           // 1 USDC = $1
    };

    const rate = conversionRates[selectedCrypto] || 1;
    return (productPrice / rate).toFixed(6);
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a payment method");
      return;
    }

    // Only Ethereum can use Web3 wallet transaction for now
    // Other currencies will need manual payment
    if (selectedCrypto !== "Ethereum") {
      toast.error("Currently only Ethereum supports direct wallet payments. Please choose Ethereum.");
      return;
    }

    try {
      const cryptoAmount = getCryptoAmount();

      console.log("Initiating purchase transaction:", {
        to: selectedAddress.address,
        amount: cryptoAmount,
        crypto: selectedCrypto,
        productPrice: productPrice
      });

      toast.info("Opening wallet... Please approve the payment.");

      sendTransaction({
        to: selectedAddress.address as `0x${string}`,
        value: parseEther(cryptoAmount),
      });
    } catch (error) {
      console.error("Error preparing transaction:", error);
      toast.error("Failed to prepare transaction");
    }
  };

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      console.error("Transaction error:", txError);
      toast.error(txError.message || "Transaction failed");
    }
  }, [txError]);

  // Handle transaction sent
  useEffect(() => {
    if (hash && !isSending) {
      toast.success("Transaction sent! Waiting for confirmation...");
    }
  }, [hash, isSending]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      const recordPurchase = async () => {
        try {
          // Create order via RPC (same as before, but with crypto payment)
          const { data, error } = await supabase.rpc("create_purchase", {
            p_user_id: user?.id,
            p_product_id: productId,
            p_product_name: productName,
            p_price: productPrice,
            p_payment_method: `crypto_${selectedCrypto}`,
          });

          if (error) throw error;

          // Record the crypto transaction
          await supabase.from("transactions").insert({
            user_id: user?.id,
            type: "purchase",
            amount: productPrice,
            crypto_currency: selectedCrypto,
            status: "completed",
            transaction_hash: hash,
          });

          const result = data as { order_id: string; order_number: string; success: boolean };
          toast.success(`Purchase successful! Order #${result.order_number}`);
          onSuccess();
          handleClose();
        } catch (error) {
          console.error("Error recording purchase:", error);
          toast.error("Transaction confirmed but failed to record order");
        }
      };

      recordPurchase();
    }
  }, [isConfirmed, hash, user, productId, productName, productPrice, selectedCrypto, onSuccess]);

  const handleClose = () => {
    setSelectedCrypto("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Complete Purchase</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <Card className="p-4 bg-gradient-to-br from-neon-blue/10 to-neon-pink/10 border-neon-blue/30">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Purchasing</p>
              <p className="text-lg font-bold text-foreground">{productName}</p>
              <p className="text-2xl font-bold text-neon-blue">${productPrice.toFixed(2)}</p>
            </div>
          </Card>

          {/* Payment Method Selection */}
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue mx-auto"></div>
            </div>
          ) : walletAddresses.length === 0 ? (
            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-400 text-sm">
                No payment methods available. Please contact support.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="crypto">Select Payment Method</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger id="crypto">
                    <SelectValue placeholder="Choose cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    {walletAddresses.map((addr) => (
                      <SelectItem key={addr.id} value={addr.currency}>
                        {addr.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Amount */}
              {selectedAddress && (
                <div className="p-4 rounded-lg border border-border/30 bg-muted/20">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">You will pay</p>
                    <p className="text-2xl font-bold text-foreground">
                      {getCryptoAmount()} {selectedCrypto}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      To: {selectedAddress.address}
                    </p>
                  </div>
                </div>
              )}

              {/* Wallet Status */}
              {!isConnected ? (
                <Alert className="border-yellow-500/30 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-400 text-sm">
                    Please connect your wallet to complete this purchase
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400 text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Wallet connected: {userWallet?.slice(0, 6)}...{userWallet?.slice(-4)}
                  </AlertDescription>
                </Alert>
              )}

              {/* Info */}
              <Alert className="border-neon-blue/30 bg-neon-blue/5">
                <AlertDescription className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Note:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Payment will be sent directly from your wallet</li>
                    <li>Your order will be processed after transaction confirmation</li>
                    <li>Make sure you have enough {selectedCrypto} + gas fees</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="grid gap-2">
                <Button
                  onClick={handlePurchase}
                  disabled={!isConnected || isSending || isConfirming || !selectedAddress}
                  className="w-full gradient-primary text-black font-semibold"
                >
                  {isSending ? "Opening Wallet..." : isConfirming ? "Confirming..." : "Pay Now"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSending || isConfirming}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
