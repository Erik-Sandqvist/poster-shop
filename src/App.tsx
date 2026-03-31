import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from './pages/Index';
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Auth } from "./pages/Auth";
import { About } from "./pages/About";
import { CookiePage } from "./pages/CookiePage";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { Layout } from "./components/Layout";
import NotFound from "./pages/NotFound";
import { Header } from "./components/Header";
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Checkout } from './pages/Checkout';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { CheckoutReturn } from './pages/CheckoutReturn';

// Import Admin components
import { ProductsAdmin } from "./pages/admin/Products";
import { AdminLayout } from "./components/admin/AdminLayout";
import { Dashboard } from "./pages/admin/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieConsentBanner />
        <BrowserRouter>
          <CartProvider>
            {/* Routes will determine whether to show Header or not */}
            <Routes>
              {/* Admin routes - no Header */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProductsAdmin />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
                {/* Add more admin routes as needed */}
                {/* <Route path="orders" element={<OrdersAdmin />} /> */}
                {/* <Route path="settings" element={<SettingsAdmin />} /> */}
              </Route>
              
              {/* Public routes with Header */}
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/products" element={<Layout><Products /></Layout>} />
              <Route path="/about" element={<Layout><About /></Layout>} />
              <Route path="/cookies" element={<Layout><CookiePage /></Layout>} />
              <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
              <Route path="/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/auth" element={<Layout><Auth /></Layout>} />
              <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
              <Route path="/checkout/return" element={<Layout><CheckoutReturn /></Layout>} />
              <Route path="/checkout/success" element={<Layout><CheckoutSuccess /></Layout>} />
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </CartProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;