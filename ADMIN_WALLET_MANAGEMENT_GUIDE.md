# Admin Wallet Address Management Guide

## Setup Required (One-Time)

### 1. Run Database Setup

Open your **Supabase SQL Editor** and run the SQL file:
- File: `ADMIN_DATABASE_SETUP.sql`
- This creates:
  - `wallet_addresses` table
  - `admin_actions_log` table
  - Security policies
  - Default addresses (BTC, ETH, LTC, SOL)

### 2. Update Default Addresses

After running the SQL, **immediately update the addresses** with your real wallet addresses in the admin panel!

The SQL inserts example addresses - these are NOT real and should be replaced.

---

## Accessing Admin Panel

1. Go to `/admin` route
2. Enter email: `prohavenlogs@gmail.com`
3. Check email for magic link
4. Click link → Admin panel opens
5. Go to **"Addresses"** tab

---

## Managing Wallet Addresses

### View All Addresses

- All cryptocurrency wallet addresses are displayed as cards
- Each card shows:
  - Currency name (e.g., "Bitcoin")
  - Current wallet address
  - Last updated date

### Add New Address

1. **Click** "Add Address" button (top right)
2. **Select** cryptocurrency from dropdown:
   - Bitcoin (BTC)
   - Ethereum (ETH)
   - Litecoin (LTC)
   - Solana (SOL)
   - Tether (USDT)
   - USD Coin (USDC)
3. **Enter** your wallet address
4. **Click** "Add Address"
5. ✅ **Success!** - Available immediately for user deposits

### Edit Existing Address

1. **Find** the currency card you want to edit
2. **Click** in the address field
3. **Update** the wallet address
4. **Click** "Save" button
5. ✅ **Success!** - Updated for all users instantly

**Important:**
- Changes take effect immediately
- All users will see the new address
- Old pending deposits may still use old address

### Delete Address

1. **Find** the currency card
2. **Click** "Delete" button
3. **Confirm** deletion in popup
4. ✅ **Success!** - Address removed from system

**Warning:**
- Users can't deposit this currency anymore
- Only delete if you no longer accept that cryptocurrency

---

## How Users See These Addresses

### Manual Deposit Flow:
1. User clicks "Add Balance"
2. Chooses "Manual Crypto Deposit"
3. Enters amount and selects cryptocurrency
4. **Sees the wallet address you configured**
5. Sends crypto to that address
6. Clicks "I've Sent Payment"

### Connected Wallet Flow:
1. User clicks "Add Balance"
2. Chooses "Send from Connected Wallet"
3. **Ethereum address from your configuration is used**
4. Wallet opens for transaction approval

---

## Troubleshooting

### "Failed to update address"
- **Cause:** Database not set up
- **Fix:** Run `ADMIN_DATABASE_SETUP.sql` in Supabase

### Changes don't appear
- **Cause:** Browser cache
- **Fix:** Refresh the page (Ctrl+R or Cmd+R)

### Can't add new address
- **Cause:** Currency already exists (UNIQUE constraint)
- **Fix:** Edit the existing address instead of adding new one

### Not admin / Can't access
- **Cause:** Not logged in with admin email
- **Fix:**
  1. Sign out
  2. Go to `/admin`
  3. Enter `prohavenlogs@gmail.com`
  4. Check email for magic link

---

## Security Notes

✅ **Only `prohavenlogs@gmail.com` can:**
- Add wallet addresses
- Edit wallet addresses
- Delete wallet addresses
- View admin action logs

✅ **All users can:**
- View wallet addresses (read-only)
- Use addresses for deposits

✅ **All admin actions are logged:**
- Who made the change
- What was changed
- When it was changed
- Check `admin_actions_log` table

---

## Database Tables

### `wallet_addresses`
```
id          | UUID (auto-generated)
currency    | TEXT (unique) - e.g., "Bitcoin"
address     | TEXT - Your crypto wallet address
created_at  | Timestamp
updated_at  | Timestamp (auto-updated)
```

### `admin_actions_log`
```
id              | UUID (auto-generated)
admin_id        | UUID (references admin user)
action_type     | TEXT - e.g., "add_wallet_address"
affected_table  | TEXT - e.g., "wallet_addresses"
affected_id     | TEXT - ID of affected row
note            | TEXT - Human-readable description
created_at      | Timestamp
```

---

## Best Practices

1. **Always verify addresses** before saving
   - Double-check the address
   - Send a small test transaction first
   - Crypto transactions are irreversible!

2. **Update addresses cautiously**
   - Users with pending deposits may be affected
   - Announce address changes to users
   - Keep old addresses active during transition

3. **Use correct network addresses**
   - Bitcoin → Bitcoin network address only
   - Ethereum → Ethereum network address only
   - Don't mix networks!

4. **Regular audits**
   - Check `admin_actions_log` regularly
   - Verify addresses haven't been compromised
   - Monitor for unauthorized changes

---

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify RLS policies are active
3. Confirm admin email is exact: `prohavenlogs@gmail.com`
4. Check browser console for JavaScript errors
