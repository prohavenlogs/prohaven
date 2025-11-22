import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { sendEmail, emailTemplates } from "@/lib/email";

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productPrice: number;
  productId: string;
  category: string;
  onSuccess: () => void;
}

export const PurchaseModal = ({
  open,
  onOpenChange,
  productName,
  productPrice,
  productId,
  onSuccess,
}: PurchaseModalProps) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Fetch user's current balance and profile info
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !open) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("wallet_balance, email, full_name")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setBalance(data?.wallet_balance || 0);
        setUserEmail(data?.email || user.email || "");
        setUserName(data?.full_name || "Customer");
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load account information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, open]);

  const hasInsufficientBalance = balance < productPrice;

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }

    if (hasInsufficientBalance) {
      toast.error("Insufficient balance. Please add funds to your account.");
      return;
    }

    setPurchasing(true);

    try {
      // Call the create_purchase RPC function with 'pending' status
      const { data, error } = await supabase.rpc("create_purchase", {
        p_user_id: user.id,
        p_product_id: productId,
        p_product_name: productName,
        p_price: productPrice,
        p_payment_method: "balance",
        p_status: "pending",
      });

      if (error) {
        if (error.message?.includes("INSUFFICIENT_FUNDS")) {
          toast.error("Insufficient balance. Please add funds to your account.");
        } else {
          throw error;
        }
        return;
      }

      const result = data as { order_id: string; order_number: string; success: boolean };

      // Send invoice email
      if (userEmail) {
        const invoiceEmail = emailTemplates.invoice(
          userName,
          result.order_number,
          productName,
          productPrice
        );

        sendEmail({
          to: userEmail,
          subject: invoiceEmail.subject,
          html: invoiceEmail.html,
        }).catch((emailError) => {
          console.error("Failed to send invoice email:", emailError);
          // Don't fail the purchase if email fails
        });
      }

      toast.success(`Purchase successful! Order #${result.order_number}`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error("Error processing purchase:", error);
      toast.error(error?.message || "Failed to process purchase");
    } finally {
      setPurchasing(false);
    }
  };

  const handleClose = () => {
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

          {loading ? (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin text-neon-blue mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Loading account info...</p>
            </div>
          ) : (
            <>
              {/* Balance Info */}
              <div className="p-4 rounded-lg border border-border/30 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-neon-blue" />
                    <span className="text-sm text-muted-foreground">Your Balance</span>
                  </div>
                  <span className={`text-xl font-bold ${hasInsufficientBalance ? "text-red-400" : "text-neon-blue"}`}>
                    ${balance.toFixed(2)}
                  </span>
                </div>
                {!hasInsufficientBalance && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">After purchase:</span>
                      <span className="font-semibold text-foreground">
                        ${(balance - productPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Balance Status */}
              {hasInsufficientBalance ? (
                <Alert className="border-red-500/30 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400 text-sm">
                    Insufficient balance. You need ${(productPrice - balance).toFixed(2)} more to complete this purchase.
                    Please add funds to your wallet.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400 text-sm">
                    You have sufficient balance to complete this purchase.
                  </AlertDescription>
                </Alert>
              )}

              {/* Info */}
              <Alert className="border-neon-blue/30 bg-neon-blue/5">
                <AlertDescription className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Note:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Your balance will be deducted immediately</li>
                    <li>An invoice will be sent to your email</li>
                    <li>Order status will be set to pending for processing</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="grid gap-2">
                <Button
                  onClick={handlePurchase}
                  disabled={hasInsufficientBalance || purchasing}
                  className="w-full gradient-primary text-black font-semibold"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : hasInsufficientBalance ? (
                    "Insufficient Balance"
                  ) : (
                    `Pay $${productPrice.toFixed(2)}`
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={purchasing}
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
