DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'categories'
  ) THEN
    DROP POLICY IF EXISTS "Everyone can manage categories" ON public.categories;
    CREATE POLICY "Everyone can manage categories"
    ON public.categories
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END
$$;
