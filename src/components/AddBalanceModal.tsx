import { CryptoDepositModal } from "./CryptoDepositModal";

interface AddBalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddBalanceModal = ({ open, onOpenChange, onSuccess }: AddBalanceModalProps) => {
  return (
    <CryptoDepositModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  );
};
