import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Product, ProductVariant, Category } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Silk } from '@/components/Silk';

type ProductType = Database['public']['Tables']['products']['Row'];

function FeaturedProducts() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [productsRes, variantsRes, categoriesRes] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('product_variants')
            .select('*'),
          supabase
            .from('categories')
            .select('*')
        ]);

        if (cancelled) return;

        if (!productsRes.error && productsRes.data) setProducts(productsRes.data as ProductType[]);
        if (!variantsRes.error && variantsRes.data) setVariants(variantsRes.data as ProductVariant[]);
        if (!categoriesRes.error && categoriesRes.data) setCategories(categoriesRes.data as Category[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const getProductVariants = (productId: string) => {
    return variants.filter(v => v.product_id === productId);
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const aIsDrink = /drink/i.test(a.name);
    const bIsDrink = /drink/i.test(b.name);

    if (aIsDrink === bIsDrink) return 0;
    return aIsDrink ? -1 : 1;
  });

  const productsByCategory = sortedCategories
    .map(category => ({
      category,
      products: products.filter(product => product.category_id === category.id),
    }))
    .filter(group => group.products.length > 0);

  const uncategorizedProducts = products.filter(
    product => !categories.some(category => category.id === product.category_id)
  );

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="w-full aspect-square rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <div className="text-center py-10 text-muted-foreground">Inga produkter hittades.</div>;
  }

  return (
    <div className="space-y-12">
      {productsByCategory.map(({ category, products: categoryProducts }) => (
        <section key={category.id} className="space-y-4">
          <h3 className="text-2xl font-semibold">{category.name}</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categoryProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product as Product}
                variants={getProductVariants(product.id)}
                enableMagicEffects={true}
                glowColor="179, 176, 7"
                particleCount={12}
              />
            ))}
          </div>
        </section>
      ))}

      {uncategorizedProducts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-2xl font-semibold">Övrigt</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {uncategorizedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product as Product}
                variants={getProductVariants(product.id)}
                enableMagicEffects={true}
                glowColor="179, 176, 7"
                particleCount={12}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const Index = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section 
        className="relative py-32 overflow-hidden mt-8 w-10/12 mx-auto rounded-lg" 
        style={{ 
          backgroundImage: 'url(/img/nocco-posters-mockup.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 15px 40px -1px rgba(25, 29, 41, 0.8)' 
        }}
      >
        <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
        <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 style={{ fontFamily: 'Rubik Dirt, cursive' }} className="text-6xl mb-6 mt-4 text-white">
            Sunit
          </h1>
          <p className="text-2xl text-white mb-8 max-w-2xl mx-auto">
         Posters</p>
          {/* <div className="space-x-4">
            <Link to="/products">
              <Button size="lg" className="px-8">
                Handla nu
              </Button>
            </Link>

          </div> */}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Produkter</h2>
          <FeaturedProducts />
          <div className="text-center mt-10">
            {/* <Button asChild variant="outline">
              <Link to="/products">Visa alla</Link>
            </Button> */}
          </div>
        </div>
      </section>

      {/* Recently Viewed Products */}
      <RecentlyViewedSection />

      <Footer />
    </div>
  );
};

export default Index;
