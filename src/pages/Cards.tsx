import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Search, ChevronLeft, ChevronRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { CARDS } from "@/data/products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePurchase } from "@/hooks/usePurchase";
import { Skeleton } from "@/components/ui/skeleton";
import { PurchaseModal } from "@/components/PurchaseModal";

const ITEMS_PER_PAGE = 7;

const Cards = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const {
    purchaseProduct,
    purchasingProductId,
    isPurchasing,
    showPurchaseModal,
    setShowPurchaseModal,
    purchaseDetails,
    handlePurchaseSuccess
  } = usePurchase();

  useEffect(() => {
    if (!user) return;

    const fetchBalance = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      setBalance(data?.wallet_balance || 0);
      setLoading(false);
    };

    fetchBalance();

    // Subscribe to balance changes
    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
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

  const handlePurchase = async (productId: string, productName: string, price: number) => {
    await purchaseProduct(productId, productName, price, "Cards");
  };

  const filteredProducts = useMemo(() => {
    return CARDS.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <DashboardLayout balance={balance.toFixed(2)}>
      <PageTransition>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-8 h-8 text-neon-blue" />
              <h1 className="text-4xl font-bold text-foreground">Cards</h1>
            </div>
            <p className="text-muted-foreground">Verified credit and debit cards with balance</p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block glass-card rounded-2xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/20">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Name ↕
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Description
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Balance ↕
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Price ↓
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr key={product.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-foreground">{product.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-muted-foreground max-w-md truncate">{product.description}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-neon-pink">{product.balance_label}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xl font-bold text-neon-blue">${product.price}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              onClick={() => handlePurchase(product.id, product.name, product.price)}
                              disabled={purchasingProductId === product.id || isPurchasing}
                              className="gradient-primary text-black font-medium px-6"
                            >
                              {purchasingProductId === product.id ? "Processing..." : "Purchase"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 mb-6">
                {paginatedProducts.map((product) => (
                  <Card key={product.id} className="glass-card p-4">
                    <h3 className="text-lg font-bold text-foreground mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="text-lg font-bold text-neon-pink">{product.balance_label}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-xl font-bold text-neon-blue">${product.price}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handlePurchase(product.id, product.name, product.price)}
                      disabled={purchasingProductId === product.id || isPurchasing}
                      className="w-full gradient-primary text-black font-medium"
                    >
                      {purchasingProductId === product.id ? "Processing..." : "Purchase"}
                    </Button>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="hover:shadow-glow transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="hover:shadow-glow transition-all"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Purchase Modal */}
        {purchaseDetails && (
          <PurchaseModal
            open={showPurchaseModal}
            onOpenChange={setShowPurchaseModal}
            productName={purchaseDetails.productName}
            productPrice={purchaseDetails.price}
            productId={purchaseDetails.productId}
            category={purchaseDetails.category}
            onSuccess={handlePurchaseSuccess}
          />
        )}
      </PageTransition>
    </DashboardLayout>
  );
};

export default Cards;
