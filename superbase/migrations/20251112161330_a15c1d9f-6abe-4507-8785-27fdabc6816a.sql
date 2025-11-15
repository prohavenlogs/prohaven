-- Enable realtime updates for wallet_addresses
ALTER TABLE public.wallet_addresses REPLICA IDENTITY FULL;

-- Add wallet_addresses to the supabase_realtime publication if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wallet_addresses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_addresses;
  END IF;
END $$;