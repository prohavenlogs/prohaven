# Web3 Payment Flow - System Overview

## 🔄 New Payment System Flow

### **Key Change: Self-Custody Model**

Users now maintain full custody of their crypto funds. Payment flows have been redesigned:

---

## 💰 Add Balance Flow

### What It Does:
- **Users add funds to their OWN wallet** (not to platform)
- Platform balance is only for purchased products

### How It Works:

1. User clicks **"Add Balance"** on Wallet page
2. **DepositModal opens** showing:
   - Current wallet balance (from connected Web3 wallet)
   - Instructions on how to top up via wallet app
   - Helpful links (MetaMask guide, Trust Wallet help)
   - No payment to platform occurs

3. User tops up wallet through:
   - Their wallet app (MetaMask, Trust Wallet, etc.)
   - Exchange transfers
   - P2P transfers

4. Balance automatically reflects in connected wallet

### Updated Files:
- `src/components/DepositModal.tsx` - Simplified to show instructions only

---

## 🛒 Purchase Products Flow

### What It Does:
- **Users pay from their wallet to ADMIN's crypto addresses**
- Payment happens during product purchase, not deposit

### How It Works:

1. User browses products (Banks, Cards, Accounts pages)
2. User clicks **"Purchase"** button
3. **PurchaseModal opens** showing:
   - Product name and price (USD)
   - Cryptocurrency selection dropdown (from admin wallet_addresses)
   - Calculated crypto amount
   - Admin's wallet address for selected crypto
   - Connected wallet status

4. User selects payment method:
   - Bitcoin (BTC)
   - Ethereum (ETH) ✅ *Currently only ETH supports direct payment*
   - Litecoin (LTC)
   - Solana (SOL)
   - USDT
   - USDC

5. User clicks **"Pay Now"**
6. Wallet (MetaMask/Trust Wallet) opens for transaction approval
7. User approves transaction
8. Transaction is sent to **admin's wallet address**
9. System waits for blockchain confirmation
10. Order is created in database
11. Transaction is recorded with hash
12. User receives confirmation: "Purchase successful! Order #123"

### Updated Files:
- `src/components/PurchaseModal.tsx` - New component for Web3 payments
- `src/hooks/usePurchase.ts` - Updated to use PurchaseModal
- `src/pages/Banks.tsx` - Integrated PurchaseModal
- `src/pages/Cards.tsx` - Integrated PurchaseModal
- `src/pages/Accounts.tsx` - Integrated PurchaseModal

---

## 🔑 Admin Wallet Address Management

### How Admin Manages Payment Addresses:

1. Admin logs in at `/admin` with magic link
2. Goes to **"Addresses"** tab
3. Can perform:
   - **Add** new wallet addresses for different cryptocurrencies
   - **Edit** existing wallet addresses
   - **Delete** wallet addresses no longer accepted

### Real-Time Updates:
- When admin updates addresses, they're immediately available for purchases
- All users see the latest addresses when making payments
- Changes are logged in `admin_actions_log` table

### Database Tables:
- `wallet_addresses` - Stores admin's crypto wallet addresses
- `admin_actions_log` - Tracks all admin changes for audit

---

## 📊 System Flow Diagram

```
USER WALLET BALANCE FLOW:
┌─────────────┐
│ User Wallet │ (Self-custody)
│  (MetaMask) │
└──────┬──────┘
       │
       │ User tops up via wallet app
       │
       ▼
┌─────────────┐
│   Wallet    │ Display only
│   Balance   │ (No platform control)
└─────────────┘


PRODUCT PURCHASE FLOW:
┌─────────────┐
│    User     │
│   Clicks    │
│  Purchase   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  PurchaseModal      │
│  - Select Crypto    │
│  - View Amount      │
│  - See Admin Addr   │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│  Web3 Wallet Opens   │
│  (Transaction to     │
│   Admin Address)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Blockchain          │
│  Confirmation        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Order Created       │
│  + Transaction       │
│    Recorded          │
└──────────────────────┘
```

---

## 💻 Technical Implementation

### Payment Processing (Ethereum Example):

```typescript
// 1. Fetch admin's Ethereum address from database
const { data: address } = await supabase
  .from("wallet_addresses")
  .select("address")
  .eq("currency", "Ethereum")
  .single();

// 2. Calculate crypto amount (USD to ETH)
const cryptoAmount = productPrice / 3000; // Simplified

// 3. Send transaction to admin's address
sendTransaction({
  to: address.address as `0x${string}`,
  value: parseEther(cryptoAmount.toString()),
});

// 4. Wait for confirmation
const { isSuccess } = useWaitForTransactionReceipt({ hash });

// 5. Record order and transaction
await supabase.rpc("create_purchase", {
  p_user_id: user.id,
  p_product_id: productId,
  p_product_name: productName,
  p_price: productPrice,
  p_payment_method: "crypto_Ethereum",
});

await supabase.from("transactions").insert({
  user_id: user.id,
  type: "purchase",
  amount: productPrice,
  crypto_currency: "Ethereum",
  status: "completed",
  transaction_hash: hash,
});
```

---

## 🎯 Benefits of New System

### For Users:
✅ Full custody of funds (non-custodial)
✅ Only pay when actually purchasing
✅ No platform holding user crypto
✅ Transparent blockchain transactions
✅ Can verify payments on blockchain explorers

### For Platform:
✅ No liability for holding user funds
✅ Reduced regulatory compliance burden
✅ Immediate payments to admin addresses
✅ Full transaction transparency via blockchain
✅ Admin can change payment addresses anytime

### For Admin:
✅ Direct control over payment addresses
✅ Can add/edit/delete addresses instantly
✅ Support multiple cryptocurrencies
✅ All changes logged for audit trail
✅ Payments go directly to admin wallets

---

## 🚀 Current Limitations & Future Enhancements

### Current Limitations:
- Only **Ethereum (ETH)** supports direct wallet transactions
- Other currencies (BTC, LTC, SOL) will need manual payment implementation
- Exchange rates are simplified (hardcoded) - needs real-time API

### Planned Enhancements:
1. Support for Bitcoin, Litecoin, Solana direct payments
2. Real-time exchange rate API integration
3. Multi-chain support (Polygon, BSC, Arbitrum)
4. Payment expiration timers
5. Partial payment support
6. Refund processing

---

## 📝 Database Setup

### Required Tables (Already Created via ADMIN_DATABASE_SETUP.sql):

**wallet_addresses**
- Stores admin's cryptocurrency wallet addresses
- Public read access (for displaying to users)
- Admin-only write access

**admin_actions_log**
- Tracks all admin actions
- Admin-only access
- Provides audit trail

**transactions**
- Records all user transactions
- Includes crypto transaction hashes
- Links to orders

**orders**
- Created via `create_purchase` RPC
- Links to products and users

---

## 🔧 Testing the System

### 1. Test Add Balance:
```
1. Connect wallet (MetaMask)
2. Go to /wallet
3. Click "Add Balance"
4. Modal shows current wallet balance
5. Follow instructions to top up wallet
6. Balance updates automatically
```

### 2. Test Product Purchase:
```
1. Ensure wallet has ETH + gas
2. Go to /banks (or /cards or /accounts)
3. Click "Purchase" on any product
4. PurchaseModal opens
5. Select "Ethereum" as payment method
6. Review amount and address
7. Click "Pay Now"
8. Approve transaction in wallet
9. Wait for confirmation
10. See success message with order number
11. Check /orders to see new order
```

### 3. Test Admin Address Management:
```
1. Go to /admin
2. Login with prohavenlogs@gmail.com
3. Click magic link from email
4. Go to "Addresses" tab
5. Edit Ethereum address
6. Click "Save"
7. Verify change is immediate
8. Try making a purchase - uses new address
```

---

## 🛡️ Security Considerations

### Smart Contract Safety:
- Always verify admin wallet addresses before saving
- Double-check addresses match expected networks
- Never mix networks (ETH address for BTC, etc.)

### User Protection:
- Users maintain custody of funds
- Transactions are irreversible - inform users
- Clear warnings about gas fees
- Transaction confirmation before payment

### Admin Protection:
- Only admin email can modify addresses
- All changes logged with timestamp
- RLS policies enforce admin-only access

---

## 📚 Related Documentation

- `ADMIN_DATABASE_SETUP.sql` - Database schema setup
- `ADMIN_WALLET_MANAGEMENT_GUIDE.md` - Admin address management guide
- `WEB3_SETUP_GUIDE.md` - Initial Web3 setup guide
- `src/components/PurchaseModal.tsx` - Purchase modal implementation
- `src/components/DepositModal.tsx` - Add balance modal
- `src/hooks/usePurchase.ts` - Purchase logic hook

---

## 🎉 Summary

The new system implements a **non-custodial payment flow** where:

1. **Add Balance** = User tops up their own wallet
2. **Purchase Products** = User pays directly to admin's wallet addresses
3. **Admin Controls** = Full control over payment addresses via admin panel

This provides better security, transparency, and user control over funds while giving admins flexibility to manage payment addresses.
