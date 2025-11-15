import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface WalletAddress {
  id: string;
  currency: string;
  address: string;
  updated_at: string;
}

export const AdminWalletAddresses = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCurrency, setNewCurrency] = useState("");
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    fetchAddresses();

    const channel = supabase
      .channel('public:wallet_addresses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_addresses' },
        () => {
          // Keep admin view in sync with any updates/inserts/deletes
          fetchAddresses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("wallet_addresses")
        .select("*")
        .order("currency");

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Failed to fetch wallet addresses");
    } finally {
      setLoading(false);
    }
  };

  const addNewAddress = async () => {
    if (!newCurrency || !newAddress) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("wallet_addresses")
        .insert({
          currency: newCurrency,
          address: newAddress,
        });

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions_log").insert({
        admin_id: user?.id,
        action_type: "add_wallet_address",
        affected_table: "wallet_addresses",
        note: `Added ${newCurrency} address`,
      });

      toast.success(`${newCurrency} address added successfully`);
      setNewCurrency("");
      setNewAddress("");
      setIsAddDialogOpen(false);
      await fetchAddresses();
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address");
    }
  };

  const updateAddress = async (id: string, newAddress: string, currency: string) => {
    try {
      const { error } = await supabase
        .from("wallet_addresses")
        .update({ address: newAddress })
        .eq("id", id);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions_log").insert({
        admin_id: user?.id,
        action_type: "edit_wallet_address",
        affected_table: "wallet_addresses",
        affected_id: id,
        note: `Updated ${currency} address`,
      });

      toast.success(`${currency} address updated successfully for all users`);

      // Refetch to ensure all users see the updated address
      await fetchAddresses();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update address");
    }
  };

  const deleteAddress = async (id: string, currency: string) => {
    if (!confirm(`Are you sure you want to delete the ${currency} wallet address?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("wallet_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions_log").insert({
        admin_id: user?.id,
        action_type: "delete_wallet_address",
        affected_table: "wallet_addresses",
        affected_id: id,
        note: `Deleted ${currency} address`,
      });

      toast.success(`${currency} address deleted successfully`);
      await fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address");
    }
  };

  if (loading) {
    return (
      <Card className="glass-card border-border/50 p-8">
        <div className="text-center text-muted-foreground">Loading wallet addresses...</div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 glass-card border border-border/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Wallet Addresses</h2>
            <p className="text-sm text-muted-foreground">Manage cryptocurrency wallet addresses for deposits</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Add New Wallet Address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Cryptocurrency</Label>
                  <Select value={newCurrency} onValueChange={setNewCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bitcoin">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="Ethereum">Ethereum (ETH)</SelectItem>
                      <SelectItem value="Litecoin">Litecoin (LTC)</SelectItem>
                      <SelectItem value="Solana">Solana (SOL)</SelectItem>
                      <SelectItem value="USDT">Tether (USDT)</SelectItem>
                      <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Wallet Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter wallet address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={addNewAddress}
                  className="w-full gradient-primary text-black font-semibold"
                >
                  Add Address
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addresses.map((wallet) => (
          <Card key={wallet.id} className="glass-card border-border/50 rounded-lg shadow-card hover:shadow-glow transition-all duration-300">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold text-foreground">{wallet.currency}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {new Date(wallet.updated_at).toLocaleDateString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`address-${wallet.id}`} className="text-sm font-medium text-foreground">
                  Wallet Address
                </Label>
                <Input
                  id={`address-${wallet.id}`}
                  value={wallet.address}
                  onChange={(e) => {
                    const newAddresses = addresses.map((a) =>
                      a.id === wallet.id ? { ...a, address: e.target.value } : a
                    );
                    setAddresses(newAddresses);
                  }}
                  className="font-mono text-sm bg-input border-border/50 text-foreground"
                  placeholder="Enter wallet address..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => updateAddress(wallet.id, wallet.address, wallet.currency)}
                  className="bg-gradient-to-r from-neon-blue to-neon-pink text-white font-semibold hover:opacity-90 transition-all"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={() => deleteAddress(wallet.id, wallet.currency)}
                  variant="destructive"
                  className="font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
