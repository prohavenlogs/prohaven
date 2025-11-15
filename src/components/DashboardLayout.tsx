import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import LeftSidebar from "./LeftSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  balance?: string;
}

const DashboardLayout = ({ children, balance = "0.00" }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Menu (mobile) */}
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-foreground" />
              </button>
            )}
          </div>

          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content + Sidebar */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        {isMobile ? (
          <>
            <LeftSidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
              isMobile={true}
            />
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </>
        ) : (
          <LeftSidebar isOpen={true} isMobile={false} />
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          !isMobile && "ml-64"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
