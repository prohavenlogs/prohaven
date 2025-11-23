import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Search, AlertCircle, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { sendEmail, emailTemplates } from "@/lib/email";

interface Order {
  id: string;
  user_id: string;
  user_email?: string;
  order_number: string;
  product_name: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export const AdminOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch orders
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      // Fetch all unique user emails
      const userIds = [...new Set(orderData?.map((o) => o.user_id) || [])];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Map emails to orders
      const emailMap = new Map(profiles?.map((p) => [p.id, p.email]) || []);
      const ordersWithEmail = orderData?.map((o) => ({
        ...o,
        user_email: emailMap.get(o.user_id) || "N/A",
      })) || [];

      setOrders(ordersWithEmail);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      // Get the order details first for email
      const order = orders.find(o => o.id === orderId);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions_log").insert({
        admin_id: user?.id,
        action_type: "update_order_status",
        affected_table: "orders",
        affected_id: orderId,
        note: `Changed order status to ${newStatus}`,
      });

      // Send invoice email when order is approved (completed)
      if (newStatus === "completed" && order?.user_email && order.user_email !== "N/A") {
        const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const emailContent = emailTemplates.orderApproved(
          order.user_email.split('@')[0], // Use email prefix as name
          order.order_number,
          order.product_name,
          Number(order.amount),
          orderDate
        );

        sendEmail({
          to: order.user_email,
          subject: emailContent.subject,
          html: emailContent.html,
        }).then(() => {
          console.log("Order approval email sent successfully");
        }).catch((emailError) => {
          console.error("Failed to send order approval email:", emailError);
        });
      }

      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Separate pending orders for quick access
  const pendingOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === "pending");
  }, [filteredOrders]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      paid: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    };

    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Orders Alert */}
      {pendingOrders.length > 0 && (
        <Card className="glass-card border-yellow-500/50 rounded-lg shadow-glow bg-yellow-500/5">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-foreground">
                Pending Orders ({pendingOrders.length})
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              These orders require your review and processing.
            </p>

            <div className="space-y-3">
              {pendingOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/30"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Order #</p>
                      <p className="font-mono text-sm text-foreground">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">User</p>
                      <p className="font-medium text-foreground">{order.user_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Product</p>
                      <p className="font-medium text-foreground">{order.product_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-bold text-neon-blue">${Number(order.amount).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500/50 text-green-500 hover:bg-green-500/10"
                      onClick={() => updateOrderStatus(order.id, "completed")}
                      disabled={updatingOrder === order.id}
                    >
                      {updatingOrder === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Complete
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                      disabled={updatingOrder === order.id}
                    >
                      {updatingOrder === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              {pendingOrders.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {pendingOrders.length - 5} more pending orders...
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* All Orders */}
      <Card className="glass-card border-border/50 rounded-lg shadow-glow">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-neon-blue" />
            <h2 className="text-xl font-semibold text-foreground">All Orders</h2>
          </div>
          <p className="text-sm text-muted-foreground">View and manage all product orders</p>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email, order #, or product..."
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
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-muted/5">
                <TableHead className="text-foreground">Order #</TableHead>
                <TableHead className="text-foreground">User</TableHead>
                <TableHead className="text-foreground">Product</TableHead>
                <TableHead className="text-foreground">Amount</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Date</TableHead>
                <TableHead className="text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-border/30 hover:bg-muted/5">
                    <TableCell className="font-mono text-sm text-foreground">
                      {order.order_number}
                    </TableCell>
                    <TableCell className="text-foreground">{order.user_email}</TableCell>
                    <TableCell className="font-medium text-foreground">{order.product_name}</TableCell>
                    <TableCell className="font-semibold text-neon-blue">
                      ${Number(order.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                        disabled={updatingOrder === order.id}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
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
