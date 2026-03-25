import { Link } from 'react-router-dom';
import { ShoppingCart, User, Moon, Sun, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext'
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const Header = () => {
  const { getTotalItems, cartItems, guestCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // Uppdatera totalItems när cartItems eller guestCart ändras
  useEffect(() => {
    setTotalItems(getTotalItems());
  }, [cartItems, guestCart, getTotalItems]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b bg-[rgba(78, 96, 98, 0.8)] backdrop-blur-lg shadow-lg top-0 w-full fixed z-50"> 
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-foreground">
          Sunit
        </Link>
        <Button
  variant="ghost"
  size="icon"
  onClick={toggleTheme}
  className="relative"
>
  {theme === 'dark' ? (
    <Sun className="h-5 w-5" />
  ) : (
    <Moon className="h-5 w-5" />
  )}
</Button>
        {/* <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="/products" className="text-foreground hover:text-primary transition-colors">
            Products
          </Link>
        </nav> */}

        <div className="flex items-center space-x-4">
          <Link to="/cookies">
            <Button variant="outline" size="icon" title="Cookie Explorer">
              <Cookie className="h-4 w-4" />
            </Button>
          </Link>
          
          <Link to="/cart">
            <Button variant="outline" size="lg" className="relative bg-primary">
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>
          
          {/* {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Logga ut
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm">
                <User className="h-4 w-4 mr-2" />
                Logga in
              </Button>
            </Link>
          )} */}
        </div>
      </div>
    </header>
  );
};