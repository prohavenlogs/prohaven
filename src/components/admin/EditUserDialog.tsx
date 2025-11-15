import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  email: string;
  full_name: string;
  wallet_balance: number;
}

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditUserDialog = ({ user, open, onClose, onUpdate }: EditUserDialogProps) => {
  const { user: currentUser } = useAuth();
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBalanceUpdate = async () => {
    const adjustment = parseFloat(balanceAdjustment);
    if (isNaN(adjustment) || adjustment === 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const newBalance = Number(user.wallet_balance) + adjustment;

      // Update user balance directly (no transaction record)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Log admin action
      const { error: logError } = await supabase.from("admin_actions_log").insert({
        admin_id: currentUser?.id,
        action_type: "adjust_balance",
        affected_table: "profiles",
        affected_id: user.id,
        note: `Adjusted balance by $${adjustment} for ${user.email}`,
      });

      if (logError) throw logError;

      toast.success("Balance updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error("Failed to update balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 rounded-lg shadow-glow">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent">
            Edit User Balance
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 glass-card border border-border/50 rounded-lg">
            <Label className="text-muted-foreground text-sm">Current Balance</Label>
            <div className="text-3xl font-bold text-neon-blue mt-2">
              ${Number(user.wallet_balance).toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment" className="text-foreground">Balance Adjustment</Label>
            <Input
              id="adjustment"
              type="number"
              step="0.01"
              placeholder="Enter amount (+ to add, - to subtract)"
              value={balanceAdjustment}
              onChange={(e) => setBalanceAdjustment(e.target.value)}
              className="bg-input border-border/50 text-foreground text-lg"
            />
            <p className="text-xs text-muted-foreground">
              💡 Use positive numbers to add funds, negative to deduct
            </p>
            <p className="text-xs text-amber-500">
              ⚠️ To approve deposit requests, use the Transactions tab and change status to Completed
            </p>
          </div>

          <Button
            onClick={handleBalanceUpdate}
            disabled={loading || !balanceAdjustment}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-pink text-white font-semibold hover:opacity-90 transition-all"
          >
            {loading ? "Processing..." : "Update Balance"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
