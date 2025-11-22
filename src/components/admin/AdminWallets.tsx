import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  user_id: string;
  user_email?: string;
  type: string;
  amount: number;
  crypto_currency: string;
  payment_method: string | null;
  reference_id: string | null;
  sender_info: string | null;
  status: string;
  created_at: string;
}

export const AdminWallets = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (txError) throw txError;

      // Fetch all unique user emails
      const userIds = [...new Set(txData?.map(t => t.user_id) || [])];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Map emails to transactions
      const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
      const transactionsWithEmail = txData?.map(t => ({
        ...t,
        user_email: emailMap.get(t.user_id) || "N/A"
      })) || [];
      
      setTransactions(transactionsWithEmail);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId: string, newStatus: string) => {
    if (!user) return;
    
    setUpdatingStatus(transactionId);
    try {
      const { data, error } = await supabase.rpc("admin_set_transaction_status", {
        p_tx_id: transactionId,
        p_new_status: newStatus,
        p_admin_id: user.id,
      });

      if (error) {
        if (error.message?.includes("PERMISSION_DENIED")) {
          toast.error("You don't have permission to perform this action");
        } else if (error.message?.includes("INSUFFICIENT_BALANCE_TO_REVERSE")) {
          toast.error("Cannot reverse transaction - user has insufficient balance");
        } else {
          throw error;
        }
        return;
      }

      const result = data as { success: boolean; old_status: string; new_status: string };
      toast.success(`Status changed from ${result.old_status} to ${result.new_status}`);
      
      // Refetch transactions to ensure balance is reflected correctly
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast.error("Failed to update transaction status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;

    return transactions.filter(t =>
      t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.crypto_currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.payment_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sender_info?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  const getPaymentMethodDisplay = (tx: Transaction) => {
    if (tx.payment_method) {
      const methodNames: Record<string, string> = {
        cashapp: "Cash App",
        zelle: "Zelle",
        venmo: "Venmo",
        paypal: "PayPal",
      };
      return methodNames[tx.payment_method] || tx.payment_method;
    }
    return tx.crypto_currency || "Crypto";
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <Card className="glass-card border-border/50 rounded-lg shadow-glow">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-xl font-semibold text-foreground">Wallet Transactions</h2>
        <p className="text-sm text-muted-foreground mt-1">View all wallet deposits, spends, and adjustments</p>
        
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by email, ID, type, or currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-muted/5">
              <TableHead className="text-foreground">User Email</TableHead>
              <TableHead className="text-foreground">Type</TableHead>
              <TableHead className="text-foreground">Amount</TableHead>
              <TableHead className="text-foreground">Payment Method</TableHead>
              <TableHead className="text-foreground">Reference/Sender</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Date</TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="border-border/30 hover:bg-muted/5">
                  <TableCell className="text-sm text-foreground">
                    {transaction.user_email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.type === "deposit" ? "default" : "secondary"}
                      className={
                        transaction.type === "deposit"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-neon-blue">
                    ${Number(transaction.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        transaction.payment_method
                          ? "bg-green-500/10 text-green-400 border-green-500/30"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/30"
                      }
                    >
                      {getPaymentMethodDisplay(transaction)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {transaction.reference_id && (
                      <span title={transaction.reference_id}>Ref: {transaction.reference_id}</span>
                    )}
                    {transaction.sender_info && (
                      <span title={transaction.sender_info} className={transaction.reference_id ? "ml-2" : ""}>
                        {transaction.reference_id ? "| " : ""}From: {transaction.sender_info}
                      </span>
                    )}
                    {!transaction.reference_id && !transaction.sender_info && "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={transaction.status === "confirmed" || transaction.status === "completed" ? "default" : "secondary"}
                      className={
                        transaction.status === "confirmed" || transaction.status === "completed"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.status}
                      onValueChange={(value) => updateTransactionStatus(transaction.id, value)}
                      disabled={updatingStatus === transaction.id}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
