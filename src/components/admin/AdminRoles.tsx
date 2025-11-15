import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserRole {
  user_id: string;
  role: string;
  email: string;
  full_name: string;
}

export const AdminRoles = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsersWithRoles();
  }, []);

  const fetchUsersWithRoles = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profileError) throw profileError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.id);
        return {
          user_id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || "",
          role: userRole?.role || "user",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users with roles:", error);
      toast.error("Failed to fetch user roles");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      if (currentRole === "admin") {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
      } else {
        // Add admin role
        const { error } = await supabase.from("user_roles").insert({
          user_id: userId,
          role: "admin",
        });

        if (error) throw error;
      }

      // Log admin action
      await supabase.from("admin_actions_log").insert({
        admin_id: currentUser?.id,
        action_type: "change_role",
        affected_table: "user_roles",
        affected_id: userId,
        note: `Changed role from ${currentRole} to ${newRole}`,
      });

      toast.success(`User role updated to ${newRole}`);
      fetchUsersWithRoles();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading user roles...</div>;
  }

  return (
    <Card className="glass-card border-border/50 rounded-lg shadow-glow">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-xl font-semibold text-foreground">Role Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Promote or demote users to admin role</p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-muted/5">
              <TableHead className="text-foreground">Email</TableHead>
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-foreground">Role</TableHead>
              <TableHead className="text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.user_id} className="border-border/30 hover:bg-muted/5">
                  <TableCell className="font-mono text-sm text-foreground">{user.email}</TableCell>
                  <TableCell className="text-foreground">{user.full_name || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className={
                        user.role === "admin"
                          ? "bg-neon-blue/20 text-neon-blue"
                          : "bg-muted/50 text-muted-foreground"
                      }
                    >
                      {user.role || "user"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={user.role === "admin" ? "destructive" : "default"}
                      onClick={() => toggleRole(user.user_id, user.role)}
                      disabled={user.user_id === (supabase.auth as any).getUser()?.id}
                      className={
                        user.role === "admin"
                          ? ""
                          : "bg-gradient-to-r from-neon-blue to-neon-pink text-white hover:opacity-90"
                      }
                    >
                      {user.role === "admin" ? "Demote to User" : "Promote to Admin"}
                    </Button>
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
