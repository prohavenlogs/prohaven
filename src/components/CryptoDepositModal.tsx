import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
  DollarSign,
  Copy,
  Check,
  ArrowLeft,
  Info,
  Loader2,
  Bitcoin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CryptoDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface WalletAddress {
  id: string;
  currency: string;
  address: string;
}

type Step = "amount" | "crypto" | "payment";

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];
const MIN_AMOUNT = 50;
const MAX_AMOUNT = 10000;

// Currency icons mapping
const CURRENCY_ICONS: Record<string, string> = {
  Bitcoin: "BTC",
  Ethereum: "ETH",
  Litecoin: "LTC",
  Solana: "SOL",
  USDT: "USDT",
  USDC: "USDC",
};

export const CryptoDepositModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CryptoDepositModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<WalletAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [copied, setCopied] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch wallet addresses from admin
  useEffect(() => {
    const fetchAddresses = async () => {
      setLoadingAddresses(true);
      const { data, error } = await supabase
        .from("wallet_addresses")
        .select("*")
        .order("currency");

      if (error) {
        console.error("Error fetching wallet addresses:", error);
        toast.error("Failed to load payment methods");
      } else {
        setWalletAddresses(data || []);
      }
      setLoadingAddresses(false);
    };

    if (open) {
      fetchAddresses();
    }
  }, [open]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep("amount");
      setAmount("");
      setSelectedCurrency(null);
      setTransactionHash("");
    }
  }, [open]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Address copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAmountContinue = () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < MIN_AMOUNT) {
      toast.error(`Minimum deposit is $${MIN_AMOUNT}`);
      return;
    }
    if (depositAmount > MAX_AMOUNT) {
      toast.error(`Maximum deposit is $${MAX_AMOUNT}`);
      return;
    }
    setStep("crypto");
  };

  const handleCryptoSelect = (wallet: WalletAddress) => {
    setSelectedCurrency(wallet);
    setStep("payment");
  };

  const handleSubmitDeposit = async () => {
    if (!user || !selectedCurrency) {
      toast.error("Please sign in to continue");
      return;
    }

    setSubmitting(true);

    try {
      // Create a pending deposit record in deposits table
      const depositData = {
        user_id: user.id,
        user_email: user.email,
        amount: parseFloat(amount),
        crypto_currency: selectedCurrency.currency,
        payment_id: transactionHash || null,
        status: "pending",
      };

      const { data: deposit, error: depositError } = await supabase
        .from("deposits")
        .insert(depositData)
        .select()
        .single();

      if (depositError) {
        console.error("Deposit insert error:", depositError);
        throw depositError;
      }

      // Also create a record in transactions table for consistency
      const transactionData = {
        user_id: user.id,
        type: "deposit" as const,
        amount: parseFloat(amount),
        crypto_currency: selectedCurrency.currency,
        tx_hash: transactionHash || null,
        payment_id: deposit.id, // Link to deposits table
        status: "pending",
      };

      const { error: txError } = await supabase
        .from("transactions")
        .insert(transactionData);

      if (txError) {
        console.error("Transaction insert error:", txError);
        // Don't throw - deposit was created, just log the error
      }

      toast.success("Deposit request submitted! We'll verify your payment shortly.");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Full error:", JSON.stringify(error, null, 2));
      toast.error(error?.message || error?.details || "Failed to submit deposit request");
    } finally {
      setSubmitting(false);
    }
  };

  // No addresses configured
  if (!loadingAddresses && walletAddresses.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Bitcoin className="w-6 h-6 text-orange-400" />
              Add Balance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <Info className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-sm text-yellow-200">
                Payment methods are being set up. Please check back later or contact support.
              </AlertDescription>
            </Alert>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Amount Step
  if (step === "amount") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-neon-blue" />
              Add Balance
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Quick Amount</Label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    className={amount === preset.toString() ? "gradient-primary text-black" : ""}
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Or Enter Custom Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Min: ${MIN_AMOUNT} - Max: ${MAX_AMOUNT}
              </p>
            </div>

            <Button
              onClick={handleAmountContinue}
              disabled={!amount}
              className="w-full gradient-primary text-black font-semibold h-12"
            >
              Continue to Select Payment Method
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Crypto Selection Step
  if (step === "crypto") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Bitcoin className="w-6 h-6 text-orange-400" />
              Select Cryptocurrency
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("amount")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Card className="p-4 bg-muted/20 border-border/40">
              <p className="text-sm text-muted-foreground">Deposit Amount</p>
              <p className="text-2xl font-bold text-neon-blue">${amount}</p>
            </Card>

            {loadingAddresses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neon-blue" />
              </div>
            ) : (
              <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {walletAddresses.map((wallet) => (
                  <Card
                    key={wallet.id}
                    className="p-4 cursor-pointer hover:border-neon-blue/50 transition-all hover:bg-muted/30"
                    onClick={() => handleCryptoSelect(wallet)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-400">
                          {CURRENCY_ICONS[wallet.currency] || wallet.currency.slice(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{wallet.currency}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Payment Step
  if (step === "payment" && selectedCurrency) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Bitcoin className="w-6 h-6 text-orange-400" />
              Send Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("crypto")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <Info className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-sm text-yellow-200">
                Send exactly ${amount} worth of {selectedCurrency.currency} to the address below.
              </AlertDescription>
            </Alert>

            {/* Currency info */}
            <Card className="p-4 bg-orange-500/10 border-orange-500/30">
              <p className="text-sm text-muted-foreground mb-1">Sending:</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-orange-400">
                  {selectedCurrency.currency}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Amount: ${amount} USD</p>
            </Card>

            {/* Address */}
            <div className="space-y-2">
              <Label>Send to this address:</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={selectedCurrency.address}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(selectedCurrency.address)}
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Transaction Hash (optional) */}
            <div className="space-y-2">
              <Label htmlFor="txHash">Transaction Hash (Optional)</Label>
              <Input
                id="txHash"
                placeholder="Enter transaction hash for faster verification"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Providing the transaction hash helps us verify your payment faster.
              </p>
            </div>

            <Button
              onClick={handleSubmitDeposit}
              disabled={submitting}
              className="w-full gradient-primary text-black font-semibold h-12"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "I've Sent the Payment"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Deposits are manually verified within 24 hours. You'll receive a notification once approved.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};
