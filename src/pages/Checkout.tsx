import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Ladda Stripe (ska vara utanför komponenten)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const hasValidStripePublishableKey =
  typeof stripePublishableKey === 'string' &&
  stripePublishableKey.startsWith('pk_') &&
  !stripePublishableKey.includes('your_publishable_key');
const stripePromise = hasValidStripePublishableKey ? loadStripe(stripePublishableKey) : null;

export const Checkout = () => {
  const { cartItems, guestCart, getTotalPrice, getTotalItems } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Kombinera user cart och guest cart
  const allCartItems = [...cartItems, ...guestCart];

  useEffect(() => {
    // Redirecta om cart är tom
    if (allCartItems.length === 0) {
      navigate('/cart');
    }
  }, [allCartItems.length, navigate]);

  const fetchClientSecret = useCallback(async () => {
    try {
      setError(null);

      // Anropa Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { cartItems: allCartItems }
      });

      if (error) throw error;

      if (!data?.clientSecret) {
        throw new Error('No client secret returned');
      }

      return data.clientSecret;
    } catch (err) {
      console.error('Error fetching client secret:', err);
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      throw err;
    }
  }, [allCartItems]);

  const options = { fetchClientSecret };

  if (allCartItems.length === 0) {
    return null;
  }

  if (!stripePromise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/cart')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka till kundvagn
        </Button>
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p className="font-semibold">Stripe-nyckel saknas</p>
          <p>
            Sätt <strong>VITE_STRIPE_PUBLISHABLE_KEY</strong> i .env.local och starta om dev-servern.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/cart')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tillbaka till kundvagn
      </Button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Ordersammanfattning</h2>
              
              <div className="space-y-3 mb-4">
                {allCartItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="flex-1">
                      {item.product_variants?.products?.name || 'Product'}
                      {' × '}{item.quantity}
                    </span>
                    <span className="font-medium">
                      {((item.product_variants?.products?.price || 0) * item.quantity).toFixed(2)} kr
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Totalt:</span>
                  <span>{getTotalPrice().toFixed(2)} kr</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {getTotalItems()} {getTotalItems() === 1 ? 'vara' : 'varor'}
                </p>
              </div>
            </div>
          </div>

          {/* Stripe Checkout */}
          <div className="lg:col-span-2">
            <div id="checkout">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={options}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};