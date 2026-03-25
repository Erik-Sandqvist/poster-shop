DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'public'
			AND table_name = 'products'
	) THEN
		DROP POLICY IF EXISTS "Everyone can manage products" ON public.products;
		CREATE POLICY "Everyone can manage products"
		ON public.products
		FOR ALL
		USING (true)
		WITH CHECK (true);
	END IF;
END
$$;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'public'
			AND table_name = 'product_variants'
	) THEN
		DROP POLICY IF EXISTS "Everyone can manage product variants" ON public.product_variants;
		CREATE POLICY "Everyone can manage product variants"
		ON public.product_variants
		FOR ALL
		USING (true)
		WITH CHECK (true);
	END IF;
END
$$;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'public'
			AND table_name = 'order_items'
	) THEN
		ALTER TABLE public.order_items
		DROP CONSTRAINT IF EXISTS order_items_product_variant_id_fkey;

		ALTER TABLE public.order_items
		ADD CONSTRAINT order_items_product_variant_id_fkey
		FOREIGN KEY (product_variant_id)
		REFERENCES public.product_variants(id)
		ON DELETE SET NULL;
	END IF;
END
$$;
