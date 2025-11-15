import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet } from "lucide-react";

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWalletBalance: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Total wallet balance
      const { data: profiles } = await supabase
        .from("profiles")
        .select("wallet_balance");

      const totalWalletBalance = profiles?.reduce((sum, p) => sum + Number(p.wallet_balance || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalWalletBalance,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-neon-blue",
    },
    {
      title: "Total Wallet Balance",
      value: `$${stats.totalWalletBalance.toFixed(2)}`,
      icon: Wallet,
      color: "text-neon-pink",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="glass-card border-border/50 rounded-lg shadow-card hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full bg-background/50`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
