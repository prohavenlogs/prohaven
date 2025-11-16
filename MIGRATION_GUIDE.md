# Multi-Wallet System Migration Guide

## Overview
This migration adds support for multiple wallets per user account while maintaining backward compatibility with existing users.

## Migration File
`superbase/migrations/20251116181112_add_user_wallets_table.sql`

## What This Migration Does

### 1. Creates `user_wallets` Table
- Stores multiple wallet addresses per user
- Tracks which wallet is primary
- Allows optional nicknames for wallets
- Maintains wallet creation timestamps

### 2. Adds Database Functions
- `link_wallet()` - Links a new wallet to a user account
- `set_primary_wallet()` - Sets a wallet as primary (unsets others)
- `get_user_by_wallet()` - Finds user by any linked wallet address

### 3. Updates Existing Tables
- Adds `wallet_address` column to `transactions` table
- Adds `wallet_address` column to `orders` table
- Creates indexes for performance

### 4. Migrates Existing Data
- Automatically migrates existing wallet addresses from user metadata
- Sets them as primary wallets
- No data loss occurs

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Login to your account
   - Select project: `vuvqdivqzcoqttyidlew`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy and Execute Migration**
   - Open the migration file: `superbase/migrations/20251116181112_add_user_wallets_table.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - Check for any error messages
   - If successful, you should see "Success. No rows returned"

### Option 2: Supabase CLI (If Installed)

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref vuvqdivqzcoqttyidlew

# Apply migrations
supabase db push
```

### Option 3: Direct Database Connection

If you have direct PostgreSQL access:

```bash
psql "postgresql://[connection-string]" < superbase/migrations/20251116181112_add_user_wallets_table.sql
```

## Verification Steps

After applying the migration, verify it worked:

### 1. Check Table Exists
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'user_wallets';
```
Should return: `user_wallets`

### 2. Check Existing Users Migrated
```sql
SELECT
  uw.wallet_address,
  uw.is_primary,
  p.email
FROM user_wallets uw
JOIN profiles p ON p.id = uw.user_id
LIMIT 10;
```
Should show existing users with their wallets marked as primary

### 3. Test Functions
```sql
-- Test get_user_by_wallet function
SELECT * FROM get_user_by_wallet('0x...');
```

## Post-Migration Testing

1. **Test Existing User Login**
   - Existing users should be able to log in with their wallet
   - Their wallet should appear as "Primary Wallet" in Profile settings

2. **Test New User Signup**
   - New users can sign up normally
   - Their first wallet is automatically set as primary

3. **Test Wallet Linking**
   - Go to Profile → Linked Wallets
   - Click "Link Wallet"
   - Connect a different wallet
   - Add a nickname and link it
   - Should appear in the list

4. **Test Primary Wallet Switching**
   - Click "Set as Primary" on a non-primary wallet
   - The badge should move to the new primary wallet

5. **Test Wallet Unlinking**
   - Try to unlink primary wallet → Should fail with error message
   - Set another wallet as primary first
   - Then unlink the old one → Should succeed

## Rollback (If Needed)

If something goes wrong, you can rollback with:

```sql
-- Drop the user_wallets table and related objects
DROP TABLE IF EXISTS user_wallets CASCADE;
DROP FUNCTION IF EXISTS link_wallet CASCADE;
DROP FUNCTION IF EXISTS set_primary_wallet CASCADE;
DROP FUNCTION IF EXISTS get_user_by_wallet CASCADE;

-- Remove added columns
ALTER TABLE transactions DROP COLUMN IF EXISTS wallet_address;
ALTER TABLE orders DROP COLUMN IF EXISTS wallet_address;
```

## Troubleshooting

### Migration Fails with "Table already exists"
- The migration may have already been applied
- Check if `user_wallets` table exists
- If it does, skip the migration

### Existing users can't login
- Check if their wallet was migrated to `user_wallets` table
- Manually insert if needed:
```sql
INSERT INTO user_wallets (user_id, wallet_address, is_primary, nickname)
VALUES ('user-uuid', 'wallet-address', true, 'Primary Wallet');
```

### Functions don't work
- Verify they were created:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('link_wallet', 'set_primary_wallet', 'get_user_by_wallet');
```

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Review the migration SQL file for syntax errors
3. Verify your Supabase project has the required permissions

## Next Steps After Migration

1. Test all wallet-related functionality
2. Update any existing orders/transactions to include wallet_address if needed
3. Monitor the system for any issues
4. Consider updating documentation for users about multi-wallet support
