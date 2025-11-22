-- Add sender_address column to transactions table for tracking deposit sender wallets
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS sender_address TEXT;

-- Add index for faster lookups on pending deposits
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(type, status);
