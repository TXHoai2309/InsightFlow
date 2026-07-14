-- Run once in Supabase SQL Editor to publish Alert workflow changes.
-- Safe to run repeatedly.
ALTER TABLE public.annotations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'annotations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.annotations;
  END IF;
END
$$;
