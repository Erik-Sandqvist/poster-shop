// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type DashboardMetrics = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
};

export const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const productsCountRes = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true });
        if (productsCountRes.error) throw productsCountRes.error;

        let totalOrders = 0;
        let totalRevenue = 0;

        const ordersCountRes = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true });

        if (!ordersCountRes.error) {
          totalOrders = ordersCountRes.count || 0;

          const ordersRevenueRes = await supabase
            .from('orders')
            .select('total_amount');

          if (!ordersRevenueRes.error) {
            totalRevenue = (ordersRevenueRes.data || []).reduce((sum, order) => {
              const value = Number(order.total_amount ?? 0);
              return sum + (Number.isFinite(value) ? value : 0);
            }, 0);
          }
        }

        setMetrics({
          totalProducts: productsCountRes.count || 0,
          totalOrders,
          totalRevenue,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium">Total Products</h3>
          <p className="text-3xl font-bold mt-2">{isLoading ? '-' : metrics.totalProducts}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Orders</h3>
          <p className="text-3xl font-bold mt-2">{isLoading ? '-' : metrics.totalOrders}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Revenue</h3>
          <p className="text-3xl font-bold mt-2">
            {isLoading ? '-' : formatCurrency(metrics.totalRevenue)}
          </p>
        </Card>
      </div>
    </div>
  );
};