// src/components/admin/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { Home, Package, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
  return (
    <div className="w-64 bg-slate-800 text-white p-4 h-full">
      <div className="text-xl font-bold mb-8">Shop Admin</div>
      <nav className="space-y-2">
        <NavLink 
          to="/admin" 
          end
          className={({ isActive }) => 
            cn("flex items-center gap-2 p-2 rounded hover:bg-slate-700", 
              isActive && "bg-slate-700")
          }
        >
          <Home size={18} /> Dashboard
        </NavLink>
        <NavLink 
          to="/admin/products" 
          className={({ isActive }) => 
            cn("flex items-center gap-2 p-2 rounded hover:bg-slate-700", 
              isActive && "bg-slate-700")
          }
        >
          <Package size={18} /> Products
        </NavLink>
        
        <div className="pt-4 mt-4 border-t border-slate-700">
          <NavLink 
            to="/" 
            className="flex items-center gap-2 p-2 rounded hover:bg-slate-700"
          >
            <LogOut size={18} /> Back to Shop
          </NavLink>
        </div>
      </nav>
    </div>
  );
};