// src/pages/admin/Products.tsx
import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ProductForm from '@/components/admin/ProductForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from '@/components/ui/skeleton';

// Use the same type as in your Index.tsx
import type { Database } from '@/integrations/supabase/types';
type Product = Database['public']['Tables']['products']['Row'];
type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

const getSupabaseErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
};

export const ProductsAdmin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [variantsMap, setVariantsMap] = useState<Record<string, ProductVariant[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    setCategories(data || []);
  };

  // Fetch products and variants
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const [productsRes, variantsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('product_variants')
          .select('*'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (variantsRes.error) throw variantsRes.error;

      setProducts(productsRes.data || []);
      
      // Organize variants by product ID
      const variants: Record<string, ProductVariant[]> = {};
      variantsRes.data?.forEach(variant => {
        if (variant.product_id) {
          if (!variants[variant.product_id]) {
            variants[variant.product_id] = [];
          }
          variants[variant.product_id].push(variant);
        }
      });
      
      setVariantsMap(variants);
      
      toast({
        title: "Success",
        description: "Products loaded successfully",
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (error) {
        console.error('Error loading admin data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin data. Please try again.',
          variant: 'destructive',
        });
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    try {
      await Promise.all([fetchProducts(), fetchCategories()]);
    } catch (error) {
      console.error('Error refreshing admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'No category';
    const category = categories.find((item) => item.id === categoryId);
    return category ? category.name : `Unknown (${categoryId})`;
  };

  const getTotalStock = (productId: string) => {
    const productVariants = variantsMap[productId] || [];
    return productVariants.reduce((sum, variant) => {
      const stock = Number((variant as unknown as { stock_quantity?: number | string | null }).stock_quantity ?? 0);
      return sum + (Number.isFinite(stock) ? stock : 0);
    }, 0);
  };

  const handleCreateCategory = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCategories((prev) => {
          const next = [...prev, data];
          next.sort((a, b) => a.name.localeCompare(b.name));
          return next;
        });

        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }

      return data;
    } catch (error) {
      const errorMessage = getSupabaseErrorMessage(error);
      toast({
        title: 'Error',
        description: `Failed to create category: ${errorMessage}`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        setProducts(products.filter(p => p.id !== id));
        const updatedVariants = { ...variantsMap };
        delete updatedVariants[id];
        setVariantsMap(updatedVariants);
        
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        const errorMessage = getSupabaseErrorMessage(error);
        toast({
          title: "Error",
          description: `Failed to delete product: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveProduct = async (product: any) => {
    try {
      const stockQuantity = Number.isFinite(Number(product.stock_quantity))
        ? Math.max(0, Math.floor(Number(product.stock_quantity)))
        : 0;
      const selectedSize = typeof product.size === 'string' && product.size.trim().length > 0
        ? product.size.trim()
        : 'ONE';

      if (editingProduct) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update({
            name: product.name,
            description: product.description,
            price: product.price,
            category_id: product.category_id,
            image_url: product.image_url,
            is_active: product.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id)
          .select();
          
        if (error) throw error;
        if (data && data.length > 0) {
          setProducts(products.map(p => p.id === editingProduct.id ? data[0] : p));
        }

        const existingVariants = variantsMap[editingProduct.id] || [];

        if (existingVariants.length > 0) {
          const primaryVariant = existingVariants[0];
          const { data: updatedVariantData, error: variantError } = await supabase
            .from('product_variants')
            .update({
              size: selectedSize,
              stock_quantity: stockQuantity,
            })
            .eq('id', primaryVariant.id)
            .select();

          if (variantError) throw variantError;

          if (updatedVariantData && updatedVariantData.length > 0) {
            const updatedPrimaryVariant = updatedVariantData[0];
            setVariantsMap((prev) => ({
              ...prev,
              [editingProduct.id]: [
                updatedPrimaryVariant,
                ...existingVariants.slice(1),
              ],
            }));
          }
        } else {
          const variantPayload: Record<string, unknown> = {
            product_id: editingProduct.id,
            name: product.name,
            size: selectedSize,
            stock_quantity: stockQuantity,
          };

          const { data: createdVariant, error: createVariantError } = await (supabase
            .from('product_variants') as any)
            .insert([variantPayload])
            .select();

          if (createVariantError) throw createVariantError;

          setVariantsMap((prev) => ({
            ...prev,
            [editingProduct.id]: createdVariant || [],
          }));
        }
        
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: product.name,
            description: product.description,
            price: product.price,
            category_id: product.category_id,
            image_url: product.image_url,
            is_active: product.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
          
        if (error) throw error;
        if (data && data.length > 0) {
          const createdProduct = data[0];

          const variantPayload: Record<string, unknown> = {
            product_id: createdProduct.id,
            name: createdProduct.name,
            size: selectedSize,
            stock_quantity: stockQuantity,
          };

          const { data: createdVariant, error: variantError } = await (supabase
            .from('product_variants') as any)
            .insert([variantPayload])
            .select();

          if (variantError) {
            await supabase
              .from('products')
              .delete()
              .eq('id', createdProduct.id);
            throw variantError;
          }

          setProducts([...products, createdProduct]);
          setVariantsMap({
            ...variantsMap,
            [createdProduct.id]: createdVariant || [],
          });
        }
        
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }
      
      setShowForm(false);
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = getSupabaseErrorMessage(error);
      toast({
        title: "Error",
        description: `Failed to save product: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {showForm ? (
        <ProductForm 
          product={editingProduct} 
          onSave={handleSaveProduct} 
          categories={categories}
          onCreateCategory={handleCreateCategory}
          initialStockQuantity={editingProduct ? (variantsMap[editingProduct.id]?.[0]?.stock_quantity ?? 0) : 0}
          initialVariantSize={editingProduct ? (variantsMap[editingProduct.id]?.[0]?.size ?? 'ONE') : 'ONE'}
          onCancel={() => setShowForm(false)} 
        />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          {products.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-md">
              <p className="text-gray-500">No products found. Click "Add Product" to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="h-12 w-12 object-cover rounded"
                        />
                      )}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{getCategoryName(product.category_id)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{getTotalStock(product.id)}</TableCell>
                    <TableCell>{variantsMap[product.id]?.length || 0}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsAdmin;