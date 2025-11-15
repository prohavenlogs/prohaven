import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, ExternalLink } from "lucide-react";
import PageTransition from "@/components/PageTransition";

interface Tool {
  name: string;
  description: string;
  features: string;
}

const Tools = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);

  const tools: Tool[] = [
    {
      name: "Account Checker",
      description: "Automated account verification tool",
      features: "Validates credentials, checks account status, verifies access levels"
    },
    {
      name: "Proxy Manager",
      description: "Secure proxy rotation system",
      features: "Multiple proxy protocols, automatic rotation, IP anonymization"
    },
    {
      name: "2FA Bypass Tool",
      description: "Two-factor authentication handler",
      features: "SMS interception, TOTP generation, authentication flow automation"
    },
    {
      name: "Session Manager",
      description: "Session state management utility",
      features: "Cookie management, session persistence, multi-account handling"
    },
    {
      name: "Encryption Suite",
      description: "Advanced encryption toolkit",
      features: "AES-256 encryption, secure key storage, data obfuscation"
    }
  ];

  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const total = (data || []).reduce((sum, tx) => {
        return sum + (tx.type === "deposit" ? Number(tx.amount) : -Number(tx.amount));
      }, 0);
      setBalance(total);
    };

    fetchBalance();
  }, [user]);

  return (
    <DashboardLayout balance={balance.toFixed(2)}>
      <PageTransition>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="w-8 h-8 text-neon-pink" />
              <h1 className="text-4xl font-bold text-foreground">Tools</h1>
            </div>
            <p className="text-muted-foreground">Professional utilities and automation tools</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border/40 overflow-hidden bg-card/50 backdrop-blur-sm">
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border/40">
                {tools.map((tool) => (
                  <div key={tool.name} className="p-4 space-y-2 hover:bg-muted/30 transition-colors">
                    <h3 className="font-semibold text-card-foreground text-neon-blue">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                      <strong>Features:</strong> {tool.features}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/20">
                      <TableHead className="font-semibold">NAME</TableHead>
                      <TableHead className="font-semibold">DESCRIPTION</TableHead>
                      <TableHead className="font-semibold">FEATURES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools.map((tool) => (
                      <TableRow 
                        key={tool.name}
                        className="hover:bg-accent/5 transition-colors border-border/20"
                      >
                        <TableCell className="font-medium text-neon-blue">{tool.name}</TableCell>
                        <TableCell className="text-muted-foreground">{tool.description}</TableCell>
                        <TableCell className="text-sm">{tool.features}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button 
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all px-8"
                onClick={() => window.open('https://t.me/prohavensupp', '_blank')}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Access All Tools via Telegram
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default Tools;
