import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const usePurchase = () => {
  const { user } = useAuth();
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    productId: string;
    productName: string;
    price: number;
    category: string;
  } | null>(null);

  const purchaseProduct = async (
    productId: string,
    productName: string,
    price: number,
    category: string
  ) => {
    if (!user) {
      toast.error("Please log in to make a purchase");
      return false;
    }

    // Prevent multiple simultaneous purchases
    if (isPurchasing) return false;

    // Open purchase modal for Web3 payment
    setPurchasingProductId(productId);
    setPurchaseDetails({ productId, productName, price, category });
    setShowPurchaseModal(true);

    return true;
  };

  const handlePurchaseSuccess = () => {
    setPurchasingProductId(null);
    setPurchaseDetails(null);
    setShowPurchaseModal(false);
    setIsPurchasing(false);
  };

  return {
    purchaseProduct,
    purchasingProductId,
    isPurchasing,
    showPurchaseModal,
    setShowPurchaseModal,
    purchaseDetails,
    handlePurchaseSuccess,
  };
};
