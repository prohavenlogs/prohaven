import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import PageTransition from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [ipAddress, setIpAddress] = useState("***.***.***.***");

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
  }, [user]);

  // Fetch and mask IP address
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip;

        // Mask the IP address (show first and last octet, mask middle ones)
        const parts = ip.split('.');
        if (parts.length === 4) {
          const masked = `${parts[0]}.${'*'.repeat(parts[1].length)}.${'*'.repeat(parts[2].length)}.${parts[3]}`;
          setIpAddress(masked);
        }
      } catch (error) {
        console.error("Failed to fetch IP:", error);
        setIpAddress("***.***.***.***");
      }
    };

    fetchIP();
  }, []);

  return (
    <DashboardLayout balance={balance.toFixed(2)}>
      <PageTransition>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-3xl shadow-card p-6 sm:p-8 md:p-12 border border-border/20">
          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-6 sm:mb-8">
            Important Notice
          </h1>

          {/* Bullet List */}
          <ul className="space-y-4 sm:space-y-6 text-muted-foreground text-sm sm:text-base">
            <li className="flex gap-3">
              <span className="mt-1">•</span>
              <div>
                <p>
                  Receive a <strong className="text-card-foreground">30% bonus</strong> on your
                  initial deposit exceeding <strong className="text-card-foreground">$300.00</strong>
                </p>
                <p className="text-sm mt-1">
                  (This promotion is exclusive to the first 72 hours post-registration and to certain users)
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="mt-1">•</span>
              <p>
                Accounts that remain inactive for six months will be closed.
              </p>
            </li>

            <li className="flex gap-3">
              <span className="mt-1">•</span>
              <p>
                Bitcoin deposits will be added to your account automatically following 2 network confirmations.
              </p>
            </li>

            <li className="flex gap-3">
              <span className="mt-1">•</span>
              <p>
                All logs you buy will be sent directly to the email you provided upon registration,
                granting you sole access and preventing others from accessing them.
              </p>
            </li>

            <li className="flex gap-3">
              <span className="mt-1">•</span>
              <p>
                We are not liable for any additional or further actions you undertake concerning
                the log you purchased from us.
              </p>
            </li>
          </ul>

          {/* IP Address Notice */}
          <div className="mt-8 sm:mt-10 bg-muted/30 rounded-2xl p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-card-foreground break-words">
              🔒 Your IP Address{" "}
              <span className="text-neon-pink font-mono break-all">[{ipAddress}]</span> is
              currently masked to protect you.
            </p>
          </div>

          {/* Support */}
          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              In need of any assistance, text support via mail:{" "}
              <a
                href="mailto:supp.prohaven@gmail.com"
                className="text-neon-blue hover:text-neon-pink transition-colors"
              >
                supp.prohaven@gmail.com
              </a>
            </p>
          </div>
        </Card>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Dashboard;
