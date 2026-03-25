// src/components/admin/ProductForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Import the types from the same place as your admin page
import type { Database } from '@/integrations/supabase/types';
type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
const PRODUCT_IMAGE_BUCKET = 'product-images';

interface ProductFormProps {
  product: Product | null;
  onSave: (product: any) => void;
  onCancel: () => void;
  categories: Category[];
  onCreateCategory: (name: string, description?: string) => Promise<Category | null>;
  initialStockQuantity?: number;
}

const ProductForm = ({ product, onSave, onCancel, categories, onCreateCategory, initialStockQuantity = 0 }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    category_id: product?.category_id || "",
    image_url: product?.image_url || "",
    is_active: product?.is_active ?? true,
    stock_quantity: initialStockQuantity,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = "Product name is required";
    if (!formData.price || formData.price <= 0) newErrors.price = "Valid price is required";
    if (Number.isNaN(formData.stock_quantity) || formData.stock_quantity < 0) {
      newErrors.stock_quantity = "Stock quantity must be 0 or more";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === "number" ? parseFloat(value) : 
              name === "is_active" ? (value === "true") : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSave({
      ...formData,
      category_id: formData.category_id || null,
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const createdCategory = await onCreateCategory(
        newCategoryName.trim(),
        newCategoryDescription.trim() || undefined
      );

      if (createdCategory) {
        setFormData((prev) => ({ ...prev, category_id: createdCategory.id }));
        setNewCategoryName("");
        setNewCategoryDescription("");
      }
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `products/${Date.now()}-${safeFileName}`;

    setIsUploadingImage(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error('Could not get image URL after upload');
      }

      setFormData((prev) => ({
        ...prev,
        image_url: publicUrlData.publicUrl,
      }));

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to upload image: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {product ? "Edit Product" : "Add New Product"}
        </h2>
        <div className="space-x-2">
          <Button type="submit" disabled={isUploadingImage}>
            {isUploadingImage ? 'Uploading image...' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleChange}
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
          </div>

          <div>
            <Label htmlFor="stock_quantity">Stock quantity</Label>
            <Input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              step="1"
              min="0"
              value={formData.stock_quantity}
              onChange={handleChange}
              className={errors.stock_quantity ? "border-red-500" : ""}
            />
            {errors.stock_quantity && <p className="text-red-500 text-sm">{errors.stock_quantity}</p>}
          </div>

          <div>
            <Label htmlFor="category_id">Category</Label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {formData.category_id && (
              <p className="text-xs text-gray-500 mt-1">
                Selected ID: {formData.category_id}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border rounded-md p-3">
          <div className="md:col-span-1">
            <Label htmlFor="new_category_name">New category name</Label>
            <Input
              id="new_category_name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Example: Hoodies"
            />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="new_category_description">Description</Label>
            <Input
              id="new_category_description"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreatingCategory}
              className="w-full"
            >
              {isCreatingCategory ? "Creating..." : "Create category"}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="is_active">Status</Label>
          <select
            id="is_active"
            name="is_active"
            value={formData.is_active === false ? "false" : "true"}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div>
          <Label htmlFor="image_upload">Upload image</Label>
          <Input
            id="image_upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploadingImage}
          />
          <p className="text-xs text-gray-500 mt-1">
            Uploading will automatically fill Image URL.
          </p>
        </div>

        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            name="image_url"
            value={formData.image_url || ""}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
          
          {formData.image_url && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-1">Image Preview:</p>
              <img 
                src={formData.image_url} 
                alt="Product preview" 
                className="h-32 object-contain border rounded p-2" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Image+Error';
                }}
              />
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProductForm;