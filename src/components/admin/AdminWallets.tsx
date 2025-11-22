import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, AlertCircle, Loader2, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";

interface Deposit {
  id: string;
  user_id: string;
  user_email?: string;
  type: string;
  amount: number;
  crypto_currency: string;
  reference_id: string | null;
  status: string;
  created_at: string;
}

export const AdminWallets = () => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      // Fetch only deposit transactions
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "deposit")
        .order("created_at", { ascending: false });

      if (txError) throw txError;

      // Fetch all unique user emails
      const userIds = [...new Set(txData?.map(t => t.user_id) || [])];

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);

        if (profileError) throw profileError;

        // Map emails to deposits
        const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
        const depositsWithEmail = txData?.map(t => ({
          ...t,
          user_email: emailMap.get(t.user_id) || "N/A"
        })) || [];

        setDeposits(depositsWithEmail);
      } else {
        setDeposits([]);
      }
    } catch (error) {
      console.error("Error fetching deposits:", error);
      toast.error("Failed to fetch deposits");
    } finally {
      setLoading(false);
    }
  };

  const updateDepositStatus = async (depositId: string, newStatus: string) => {
    if (!user) return;

    setUpdatingStatus(depositId);
    try {
      const { data, error } = await supabase.rpc("admin_set_transaction_status", {
        p_tx_id: depositId,
        p_new_status: newStatus,
        p_admin_id: user.id,
      });

      if (error) {
        if (error.message?.includes("PERMISSION_DENIED")) {
          toast.error("You don't have permission to perform this action");
        } else if (error.message?.includes("INSUFFICIENT_BALANCE_TO_REVERSE")) {
          toast.error("Cannot reverse deposit - user has insufficient balance");
        } else {
          throw error;
        }
        return;
      }

      const result = data as { success: boolean; old_status: string; new_status: string };
      toast.success(`Deposit status changed from ${result.old_status} to ${result.new_status}`);

      // Refetch deposits to ensure balance is reflected correctly
      fetchDeposits();
    } catch (error) {
      console.error("Error updating deposit status:", error);
      toast.error("Failed to update deposit status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Filter deposits based on search and status
  const filteredDeposits = useMemo(() => {
    return deposits.filter(deposit => {
      const matchesSearch = !searchQuery ||
        deposit.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deposit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deposit.crypto_currency?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deposit.reference_id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || deposit.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deposits, searchQuery, statusFilter]);

  // Separate pending deposits for quick access
  const pendingDeposits = useMemo(() => {
    return deposits.filter(d => d.status === "pending");
  }, [deposits]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      failed: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
      <Badge variant="outline" className={variants[status] || "bg-gray-500/20 text-gray-400"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading deposits...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Deposits Alert */}
      {pendingDeposits.length > 0 && (
        <Card className="glass-card border-yellow-500/50 rounded-lg shadow-glow bg-yellow-500/5">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-foreground">
                Pending Deposits ({pendingDeposits.length})
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              These deposits require your review and approval. Approving will credit the user's balance.
            </p>

            <div className="space-y-3">
              {pendingDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/30"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">User</p>
                      <p className="font-medium text-foreground">{deposit.user_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-bold text-neon-blue">${Number(deposit.amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Currency</p>
                      <p className="font-medium text-orange-400">{deposit.crypto_currency || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(deposit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                      onClick={() => updateDepositStatus(deposit.id, "completed")}
                      disabled={updatingStatus === deposit.id}
                    >
                      {updatingStatus === deposit.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                      onClick={() => updateDepositStatus(deposit.id, "failed")}
                      disabled={updatingStatus === deposit.id}
                    >
                      {updatingStatus === deposit.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* All Deposits */}
      <Card className="glass-card border-border/50 rounded-lg shadow-glow">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownCircle className="w-5 h-5 text-neon-blue" />
            <h2 className="text-xl font-semibold text-foreground">All Deposits</h2>
          </div>
          <p className="text-sm text-muted-foreground">View and manage all user deposit requests</p>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email, ID, or currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Approved</SelectItem>
                <SelectItem value="failed">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-muted/5">
                <TableHead className="text-foreground">User Email</TableHead>
                <TableHead className="text-foreground">Amount</TableHead>
                <TableHead className="text-foreground">Currency</TableHead>
                <TableHead className="text-foreground">Reference</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Date</TableHead>
                <TableHead className="text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No deposits found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="border-border/30 hover:bg-muted/5">
                    <TableCell className="text-sm text-foreground">
                      {deposit.user_email}
                    </TableCell>
                    <TableCell className="font-semibold text-neon-blue">
                      ${Number(deposit.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-orange-500/10 text-orange-400 border-orange-500/30"
                      >
                        {deposit.crypto_currency || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      {deposit.reference_id ? (
                        <div className="truncate" title={deposit.reference_id}>
                          <span className="font-mono text-xs">{deposit.reference_id.slice(0, 20)}...</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(deposit.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(deposit.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={deposit.status}
                        onValueChange={(value) => updateDepositStatus(deposit.id, value)}
                        disabled={updatingStatus === deposit.id}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Approved</SelectItem>
                          <SelectItem value="failed">Rejected</SelectItem>
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
    </div>
  );
};
