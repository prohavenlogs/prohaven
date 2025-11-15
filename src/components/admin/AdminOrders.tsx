import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Order {
  id: string;
  user_id: string;
  order_number: string;
  product_name: string;
  amount: number;
  status: string;
  created_at: string;
}

export const AdminOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
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

      toast.success(`Order ${newStatus === "paid" ? "approved" : "cancelled"}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <Card className="glass-card border-border/50 rounded-lg shadow-glow">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-xl font-semibold text-foreground">Order Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Review and manage all product orders</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-muted/5">
              <TableHead className="text-foreground">Order #</TableHead>
              <TableHead className="text-foreground">User ID</TableHead>
              <TableHead className="text-foreground">Product</TableHead>
              <TableHead className="text-foreground">Amount</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Date</TableHead>
              <TableHead className="text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="border-border/30 hover:bg-muted/5">
                  <TableCell className="font-mono text-foreground">{order.order_number}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{order.user_id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-foreground font-medium">{order.product_name}</TableCell>
                  <TableCell className="font-semibold text-neon-blue">${Number(order.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "paid"
                          ? "default"
                          : order.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className={
                        order.status === "paid"
                          ? "bg-green-500/20 text-green-500"
                          : order.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : ""
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {order.status === "pending" && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => updateOrderStatus(order.id, "paid")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
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
