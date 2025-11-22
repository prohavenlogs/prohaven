import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Search, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  product_name: string;
  amount: number;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  wallet_balance: number;
  created_at: string;
  orders?: Order[];
  orderCount?: number;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      // Fetch users
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;

      // Fetch all orders
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      // Map orders to users
      const usersWithOrders = (profileData || []).map((user) => {
        const userOrders = (orderData || []).filter((order) => order.user_id === user.id);
        return {
          ...user,
          orders: userOrders,
          orderCount: userOrders.length,
        };
      });

      setUsers(usersWithOrders);
      setFilteredUsers(usersWithOrders);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

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
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card p-4 border-border/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-input border-border/50"
          />
        </div>
      </Card>

      <Card className="glass-card border-border/50 rounded-lg shadow-glow">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">View and manage user accounts, balances, and orders</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-muted/5">
                <TableHead className="text-foreground w-8"></TableHead>
                <TableHead className="text-foreground">Email</TableHead>
                <TableHead className="text-foreground">Name</TableHead>
                <TableHead className="text-foreground">Balance</TableHead>
                <TableHead className="text-foreground">Orders</TableHead>
                <TableHead className="text-foreground">Joined</TableHead>
                <TableHead className="text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <>
                  <TableRow key={user.id} className="border-border/30 hover:bg-muted/5">
                    <TableCell className="w-8">
                      {user.orderCount && user.orderCount > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleUserExpand(user.id)}
                        >
                          {expandedUser === user.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{user.email}</TableCell>
                    <TableCell className="text-foreground">{user.full_name || "—"}</TableCell>
                    <TableCell className="font-semibold text-neon-blue">
                      ${Number(user.wallet_balance || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{user.orderCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Orders */}
                  {expandedUser === user.id && user.orders && user.orders.length > 0 && (
                    <TableRow key={`${user.id}-orders`} className="bg-muted/10">
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 pl-12">
                          <p className="text-sm font-semibold text-foreground mb-3">Order History</p>
                          <div className="space-y-2">
                            {user.orders.map((order) => (
                              <div
                                key={order.id}
                                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {order.order_number}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {order.product_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="font-semibold text-neon-blue">
                                    ${Number(order.amount).toFixed(2)}
                                  </span>
                                  {getStatusBadge(order.status)}
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
};
