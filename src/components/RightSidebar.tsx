import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Wallet, 
  Activity, 
  FileText, 
  User, 
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  X,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const RightSidebar = ({ isOpen = true, onClose, isMobile = false }: RightSidebarProps) => {
  const [accountOpen, setAccountOpen] = useState(false);

  const sidebarClasses = cn(
    "fixed top-0 right-0 h-full bg-sidebar border-l border-sidebar-border z-50 transition-all duration-300 ease-in-out",
    isMobile ? "w-72" : "w-64",
    isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
  );

  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-sidebar-foreground">PROHAVENLOGS</h2>
          {isMobile && (
            <button onClick={onClose} className="p-1 hover:bg-sidebar-accent rounded">
              <X className="w-5 h-5 text-sidebar-foreground" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:scale-105"
            activeClassName="gradient-primary text-black font-medium shadow-glow"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/wallet"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:scale-105"
            activeClassName="gradient-primary text-black font-medium shadow-glow"
          >
            <Wallet className="w-5 h-5" />
            <span>My Wallet</span>
          </NavLink>

          <NavLink
            to="/deposit"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:scale-105"
            activeClassName="gradient-primary text-black font-medium shadow-glow"
          >
            <DollarSign className="w-5 h-5" />
            <span>Deposit</span>
          </NavLink>

          {/* LOGS Section */}
          <div className="pt-4">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              LOGS
            </h3>
            
            <NavLink
              to="/activity"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:scale-105"
              activeClassName="gradient-primary text-black font-medium shadow-glow"
            >
              <Activity className="w-5 h-5" />
              <span>Activity Logs</span>
            </NavLink>

            <NavLink
              to="/reports"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:scale-105"
              activeClassName="gradient-primary text-black font-medium shadow-glow"
            >
              <FileText className="w-5 h-5" />
              <span>Reports</span>
            </NavLink>
          </div>

          {/* ACCOUNT Section */}
          <div className="pt-4">
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center justify-between w-full px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-sidebar-foreground transition-colors"
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:scale-105"
                  activeClassName="gradient-primary text-black font-medium shadow-glow"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>My Orders</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 hover:scale-105"
                  activeClassName="gradient-primary text-black font-medium shadow-glow"
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default RightSidebar;
