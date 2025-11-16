import { http, createConfig, createStorage } from 'wagmi'
import { mainnet, sepolia, bsc, polygon } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// WalletConnect Project ID - you should get this from https://cloud.walletconnect.com
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'

export const config = createConfig({
  chains: [mainnet, sepolia, bsc, polygon],
  connectors: [
    // Injected wallets (MetaMask, Trust Wallet, etc.)
    // This single connector will auto-detect all injected wallets
    injected(),
    // WalletConnect for mobile wallets
    walletConnect({
      projectId,
      showQrModal: true,
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'ProHavenLogs',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
  },
  // Enable automatic reconnection on mount and persist wallet connection state
  ssr: false,
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
})
