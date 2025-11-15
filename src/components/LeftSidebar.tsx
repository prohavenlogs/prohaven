import { useState, useEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import LogoutButton from "./LogoutButton";
import { 
  LayoutDashboard, 
  Wallet, 
  Activity, 
  User, 
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Building2,
  Wrench,
  MessageCircle,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeftSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const LeftSidebar = ({ isOpen = true, onClose, isMobile = false }: LeftSidebarProps) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();

  // Fetch and subscribe to balance updates
  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();
      setBalance(data?.wallet_balance || 0);
    };

    fetchBalance();

    // Subscribe to real-time balance updates
    const channel = supabase
      .channel('sidebar-balance')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          setBalance(payload.new.wallet_balance || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sidebarClasses = cn(
    "fixed top-0 left-0 h-full border-r border-border/20 z-50 transition-all duration-300 ease-in-out",
    "bg-background/10 backdrop-blur-xl",
    isMobile ? "w-72" : "w-64",
    isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
  );

  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-foreground">PROHAVENLOGS</h2>
            {isMobile && (
              <button onClick={onClose} className="p-1 hover:bg-muted/50 rounded">
                <X className="w-5 h-5 text-foreground" />
              </button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Balance: <span className="text-neon-blue font-semibold">${balance.toFixed(2)}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
            activeClassName="gradient-primary text-black font-medium shadow-glow"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/wallet"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
            activeClassName="gradient-primary text-black font-medium shadow-glow"
          >
            <Wallet className="w-5 h-5" />
            <span>My Wallet</span>
          </NavLink>

          {/* PRODUCTS Section */}
          <div className="pt-4">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              PRODUCTS
            </h3>
            
            <NavLink
              to="/banks"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
              activeClassName="gradient-primary text-black font-medium shadow-glow"
            >
              <Building2 className="w-5 h-5" />
              <span>Banks</span>
            </NavLink>

            <NavLink
              to="/cards"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
              activeClassName="gradient-primary text-black font-medium shadow-glow"
            >
              <CreditCard className="w-5 h-5" />
              <span>Cards</span>
            </NavLink>

            <NavLink
              to="/accounts"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
              activeClassName="gradient-primary text-black font-medium shadow-glow"
            >
              <Activity className="w-5 h-5" />
              <span>Accounts</span>
            </NavLink>

            <NavLink
              to="/tools"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
              activeClassName="gradient-primary text-black font-medium shadow-glow"
            >
              <Wrench className="w-5 h-5" />
              <span>Tools</span>
            </NavLink>
          </div>

          {/* ACCOUNT Section */}
          <div className="pt-4">
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center justify-between w-full px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
            >
              <span>ACCOUNT</span>
              {accountOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {accountOpen && (
              <div className="space-y-2 animate-fade-in">
                <NavLink
                  to="/orders"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
                  activeClassName="gradient-primary text-black font-medium shadow-glow"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>My Orders</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
                  activeClassName="gradient-primary text-black font-medium shadow-glow"
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Admin Section (conditional) */}
          {isAdmin && (
            <div className="pt-4 border-t border-border/20">
              <NavLink
                to="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-muted/30 transition-all duration-200 hover:scale-105"
                activeClassName="gradient-primary text-black font-medium shadow-glow"
              >
                <Shield className="w-5 h-5" />
                <span>Admin Panel</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Telegram Support & Logout at Bottom */}
        <div className="pt-4 border-t border-border/20 space-y-2">
          <a
            href="https://t.me/ProHavenSupp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground bg-accent/20 hover:bg-accent/30 transition-all duration-200 hover:scale-105 border border-accent/30 shadow-glow"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Support</span>
          </a>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;