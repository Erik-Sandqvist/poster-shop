import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProductVariant, Product } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface CombinedCartItem {
  id: string;
  quantity: number;
  product_variants?: ProductVariant & { products?: Product };
  type: 'user' | 'guest';
}

export const Cart = () => {
  const { cartItems, guestCart, updateQuantity, removeFromCart, getTotalPrice, loading } = useCart();
  const [combinedCart, setCombinedCart] = useState<CombinedCartItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const mappedGuest: CombinedCartItem[] = guestCart.map(item => ({
      id: item.product_variant_id,
      quantity: item.quantity,
      product_variants: item.product_variants,
      type: 'guest' as const
    }));

    const mappedUser: CombinedCartItem[] = cartItems.map(item => ({
      ...item,
      type: 'user' as const
    }));

    setCombinedCart([...mappedUser, ...mappedGuest]);
  }, [cartItems, guestCart]);

  const handleCheckout = () => {
    if (combinedCart.length === 0) {
      toast({
        title: "Tom kundvagn",
        description: "Din kundvagn är tom.",
        variant: "destructive",
      });
      return;
    }

    navigate('/checkout');
  };

  if (loading) {
    return <div className="text-center py-8">Laddar kundvagn...</div>;
  }

  if (combinedCart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="h-24 w-24 mx-auto text-gray-300 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Din kundvagn är tom</h1>
          <p className="text-muted-foreground mb-6">
            Börja handla och lägg till produkter i din kundvagn
          </p>
          <Link to="/products">
            <Button size="lg">Börja handla</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Din kundvagn</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {combinedCart.map(item => {
            const product = item.product_variants?.products;
            const variant = item.product_variants;
            
            if (!variant || !product) {
              return null;
            }

            return (
              <Card key={item.id}>
                <CardContent className="p-6 flex items-center space-x-4">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-20 h-20 object-cover rounded" 
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {variant.color && <Badge variant="outline">{variant.color}</Badge>}
                      {variant.size && <Badge variant="outline">{variant.size}</Badge>}
                    </div>
                    <p className="text-lg font-bold mt-2">{product.price} kr</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => removeFromCart(item.id)} 
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Ordersammanfattning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delsumma</span>
                  <span>{getTotalPrice().toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frakt</span>
                  <span>Beräknas vid kassan</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Totalt:</span>
                  <span>{getTotalPrice().toFixed(2)} kr</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
              >
                Gå till kassan
              </Button>
              
              <Link to="/products" className="block">
                <Button variant="outline" className="w-full">
                  Fortsätt handla
                </Button>
              </Link>

              <p className="text-xs text-muted-foreground text-center pt-2">
                Säker betalning med Stripe
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};