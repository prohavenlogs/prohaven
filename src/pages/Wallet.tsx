import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useBalance } from "wagmi";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownCircle, ArrowUpCircle, Plus, Wallet as WalletIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";
import { TransactionSkeleton } from "@/components/WalletSkeleton";
import { DepositModal } from "@/components/DepositModal";

const Wallet = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: walletBalance } = useBalance({ address });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  // Fetch wallet balance (only confirmed transactions)
  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching balance:", error);
        return;
      }

      setBalance(data?.wallet_balance || 0);
    };

    fetchBalance();

    // Subscribe to profile changes for realtime balance updates
    const profileChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          setBalance(payload.new.wallet_balance || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  // Fetch transactions with realtime updates
  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        setLoading(false);
        return;
      }

      setTransactions(data || []);
      setLoading(false);
    };

    fetchTransactions();

    // Subscribe to real-time transaction updates
    const channel = supabase
      .channel("transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted/20 text-muted-foreground border-border/30";
    }
  };

  const getStatusText = (status: string) => {
    return status === "pending" ? "Awaiting Approval" : status;
  };

  return (
    <DashboardLayout balance={balance.toFixed(2)}>
      <PageTransition>
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Wallet Balance Card */}
        {isConnected && walletBalance && (
          <Card className="rounded-3xl shadow-card p-6 border border-border/20 bg-gradient-to-br from-neon-blue/10 to-neon-pink/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neon-blue/20 flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold text-neon-blue">
                    {parseFloat(walletBalance.formatted).toFixed(4)} {walletBalance.symbol}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                Connected
              </Badge>
            </div>
          </Card>
        )}

        {/* Account Balance Card with Deposit Button */}
        <Card className="rounded-3xl shadow-card p-8 border border-border/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Account Balance</p>
              <p className="text-4xl font-bold text-neon-blue">${balance.toFixed(2)}</p>
            </div>
            <Button
              onClick={() => setDepositModalOpen(true)}
              className="gradient-primary text-black font-medium hover:scale-105 transition-all px-6 py-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Balance
            </Button>
          </div>
        </Card>

        {/* Info Alert */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-sm text-blue-400">
          Payments are manually verified within 24 hours. For assistance, email us at{" "}
          <a href="mailto:supp.prohaven@gmail.com" className="underline hover:text-neon-pink transition-colors">
            supp.prohaven@gmail.com
          </a>.
        </div>

        {/* Transaction History */}
        <Card className="rounded-3xl shadow-card p-8 border border-border/20">
          <h2 className="text-2xl font-bold text-card-foreground mb-6">Transaction History</h2>
          
          {loading ? (
            <TransactionSkeleton />
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "deposit" ? "bg-green-500/20" : "bg-red-500/20"
                    }`}>
                      {tx.type === "deposit" ? (
                        <ArrowDownCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowUpCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground capitalize">{tx.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === "deposit" ? "text-green-400" : "text-red-400"}`}>
                      {tx.type === "deposit" ? "+" : "-"}${parseFloat(tx.amount).toFixed(2)}
                    </p>
                    <Badge variant="outline" className={getStatusColor(tx.status)}>
                      {getStatusText(tx.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        </div>

        <DepositModal
          open={depositModalOpen}
          onOpenChange={setDepositModalOpen}
          onSuccess={() => {
            // Refresh transactions after successful deposit
            if (user) {
              supabase
                .from("transactions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .then(({ data }) => setTransactions(data || []));
            }
          }}
        />
      </PageTransition>
    </DashboardLayout>
  );
};

export default Wallet;
