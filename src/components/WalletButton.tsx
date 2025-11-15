import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface WalletButtonProps {
  onConnect?: (address: string) => void;
  className?: string;
}

const WalletButton = ({ onConnect, className = "" }: WalletButtonProps) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWallets, setShowWallets] = useState(false);

  const handleConnect = async (connector: any) => {
    try {
      connect({ connector }, {
        onSuccess: (data) => {
          if (onConnect && data.accounts[0]) {
            onConnect(data.accounts[0]);
          }
          setShowWallets(false);
        },
      });
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <Button
        onClick={() => disconnect()}
        className={`h-12 rounded-full gradient-primary text-black font-semibold shadow-glow ${className}`}
      >
        <Wallet className="w-5 h-5 mr-2" />
        {formatAddress(address)}
      </Button>
    );
  }

  if (showWallets) {
    return (
      <div className="space-y-3 w-full">
        {connectors.map((connector) => (
          <Button
            key={connector.id}
            onClick={() => handleConnect(connector)}
            disabled={isPending}
            className="w-full h-12 rounded-full bg-card border border-border/40 hover:border-neon-blue/50 text-card-foreground font-semibold shadow-sm hover:shadow-glow transition-all"
          >
            {isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                {connector.name}
              </>
            )}
          </Button>
        ))}
        <Button
          onClick={() => setShowWallets(false)}
          variant="outline"
          className="w-full h-12 rounded-full"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setShowWallets(true)}
      disabled={isPending}
      className={`w-full h-12 rounded-full gradient-primary text-black font-semibold shadow-glow relative overflow-hidden group ${className}`}
    >
      {isPending ? (
        <>
          <LoadingSpinner size="sm" />
          <span className="ml-2">Connecting...</span>
        </>
      ) : (
        <>
          <Wallet className="w-5 h-5 mr-2" />
          Connect Wallet
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
    </Button>
  );
};

export default WalletButton;
