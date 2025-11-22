import { useState } from "react";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Wallet, MapPin, BarChart3 } from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminWallets } from "@/components/admin/AdminWallets";
import { AdminWalletAddresses } from "@/components/admin/AdminWalletAddresses";
import { AdminLogin } from "@/components/admin/AdminLogin";
import LogoutButton from "@/components/LogoutButton";

const Admin = () => {
  const { isAdmin, loading } = useAdminCheck();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  // Show login page if not admin
  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="glass-card p-6 rounded-lg border border-border/50 shadow-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-neon-blue" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage users, wallets, orders, and system settings
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-2 w-full grid grid-cols-2 md:grid-cols-4 gap-2 rounded-lg border border-border/50">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-neon-blue">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-neon-blue">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-neon-blue">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-neon-blue">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Wallet Addresses</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="m-0">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users" className="m-0">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="transactions" className="m-0">
            <AdminWallets />
          </TabsContent>

          <TabsContent value="addresses" className="m-0">
            <AdminWalletAddresses />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
