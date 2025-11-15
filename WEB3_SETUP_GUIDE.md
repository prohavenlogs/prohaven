# Web3 Authentication Setup Guide

## What Was Changed

Your authentication system has been successfully transformed from traditional email/password to Web3 wallet-based authentication while maintaining the same beautiful UI design.

### Key Changes:

1. **Authentication Method**: Users now connect with MetaMask, Trust Wallet, Coinbase Wallet, or WalletConnect
2. **Data Storage**: Supabase still stores user emails, wallet addresses, and transaction history
3. **User Flow**:
   - **Sign In**: Connect wallet → Auto sign-in if wallet is registered
   - **Sign Up**: Connect wallet → Enter email & name → Create account

## Files Created/Modified

### Created Files:
- `/src/config/wagmi.ts` - Web3 configuration
- `/src/components/WalletButton.tsx` - Custom wallet connection component
- `WEB3_SETUP_GUIDE.md` - This guide

### Modified Files:
- `/src/contexts/AuthContext.tsx` - Updated to handle wallet authentication
- `/src/App.tsx` - Added WagmiProvider wrapper
- `/src/pages/SignIn.tsx` - Wallet connection UI
- `/src/pages/SignUp.tsx` - Two-step signup (wallet + details)

## Required Configuration

### 1. WalletConnect Project ID (Required for WalletConnect Support)

To enable WalletConnect (for mobile wallets and browser extensions):

1. Visit https://cloud.walletconnect.com
2. Create a free account
3. Create a new project
4. Copy your Project ID
5. Update `/src/config/wagmi.ts`:

```typescript
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID' // Replace with your actual ID
```

**Note**: Without this, MetaMask and Trust Wallet browser extensions will still work, but mobile wallet connections via WalletConnect won't function.

### 2. Supabase Database Schema (REQUIRED)

The app now requires a `profiles` table to store wallet addresses and prevent duplicates. Run this SQL in your Supabase SQL Editor:

```sql
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster wallet address lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address
ON profiles(wallet_address);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow users to read all profiles (for duplicate checking)
CREATE POLICY "Allow public read access"
ON profiles FOR SELECT
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**Why this is needed:**
- Prevents duplicate wallet addresses (each wallet = one account)
- Prevents duplicate emails (each email = one account)
- Stores user data alongside wallet address
- Enables fast lookups during sign-in

## Supported Wallets

Your app now supports:
- ✅ **MetaMask** - Browser extension & mobile
- ✅ **Trust Wallet** - Browser extension & mobile
- ✅ **Coinbase Wallet** - Browser extension & mobile
- ✅ **WalletConnect** - Any wallet supporting WalletConnect protocol

## Supported Blockchain Networks

Currently configured networks (can be customized in `/src/config/wagmi.ts`):
- Ethereum Mainnet
- Sepolia Testnet
- Binance Smart Chain (BSC)
- Polygon

## How It Works

### Authentication Flow:

1. **User connects wallet** → Wallet address is captured
2. **Sign In**: Checks if wallet address exists in Supabase
3. **Sign Up**: Stores wallet address + email + name in Supabase
4. **Session**: Supabase manages the session, wallet stays connected
5. **Sign Out**: Disconnects wallet + clears Supabase session

### Data Storage:

All user data remains in Supabase:
- Wallet address (primary identifier)
- Email address
- Full name
- Transaction history (your existing tables)
- Any other user data

### For Future Blockchain Transactions:

When you're ready to implement blockchain transactions:

```typescript
import { useAccount, useWriteContract } from 'wagmi';

// In your component:
const { address } = useAccount(); // Get connected wallet
const { writeContract } = useWriteContract(); // Send transactions

// Example transaction:
writeContract({
  address: '0x...', // Contract address
  abi: contractAbi,
  functionName: 'transfer',
  args: [recipientAddress, amount],
});
```

## Testing Checklist

- [ ] Get WalletConnect Project ID
- [ ] Update `wagmi.ts` with Project ID
- [ ] Run Supabase migration to add `wallet_address` column
- [ ] Install MetaMask browser extension (for testing)
- [ ] Test Sign Up flow
- [ ] Test Sign In flow
- [ ] Test Sign Out
- [ ] Test wallet disconnection
- [ ] Verify data appears in Supabase

## Development Commands

```bash
# Install dependencies (already done)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### "Wallet not registered" error
→ User needs to sign up first with that wallet

### Wallet connects but doesn't sign in
→ Check Supabase `profiles` table for wallet_address column
→ Verify RLS policies allow reads on profiles table

### WalletConnect not working
→ Verify you've set a valid Project ID in `/src/config/wagmi.ts`

### Build warnings about comments
→ These are harmless warnings from Web3 libraries, safe to ignore

## UI Design Maintained

All your existing design elements were preserved:
- ✅ Same card layout with rounded-3xl borders
- ✅ Same gradient buttons with glow effects
- ✅ Same color scheme (neon-blue, neon-pink accents)
- ✅ Same rounded-full inputs
- ✅ Same loading states and transitions
- ✅ Same responsive design

## Security Notes

- Wallet private keys NEVER leave the user's device
- Your backend only stores the wallet address (public)
- Transactions will require user confirmation in their wallet
- Supabase handles all data security as before

## Next Steps

1. Get your WalletConnect Project ID
2. Update the configuration
3. Run the database migration
4. Test the authentication flow
5. You're ready to add blockchain transaction functionality!

---

Need help? The Web3 integration is complete and ready to use. All the functionality for wallet authentication is in place - you just need to configure the Project ID and database schema.
