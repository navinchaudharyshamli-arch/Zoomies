import React from 'react';
import { NavLink } from 'react-router-dom';
import { Utensils, ShoppingBag, Clock, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

export const TabBar: React.FC = () => {
  const { totalItemsCount } = useCart();
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-3 left-4 right-4 max-w-[430px] mx-auto z-40">
      <div className="bg-[#fffdf9]/85 dark:bg-[#292421]/90 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-3xl h-[68px] px-3 flex items-center justify-around shadow-[0_10px_28px_rgba(59,41,35,0.18)]">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all ${
              isActive
                ? 'text-[#3b2923] dark:text-[#f5ebe3] bg-[#fff0e5] dark:bg-[#3d2c24] font-bold'
                : 'text-[#9b8b84] hover:text-[#3b2923] dark:hover:text-[#f5ebe3]'
            }`
          }
        >
          <Utensils size={18} />
          <span className="text-[10px] mt-1 font-semibold">Menu</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all relative ${
              isActive
                ? 'text-[#3b2923] dark:text-[#f5ebe3] bg-[#fff0e5] dark:bg-[#3d2c24] font-bold'
                : 'text-[#9b8b84] hover:text-[#3b2923] dark:hover:text-[#f5ebe3]'
            }`
          }
        >
          <div className="relative">
            <ShoppingBag size={18} />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#f28a4b] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#292421]">
                {totalItemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">Cart</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all relative ${
              isActive
                ? 'text-[#3b2923] dark:text-[#f5ebe3] bg-[#fff0e5] dark:bg-[#3d2c24] font-bold'
                : 'text-[#9b8b84] hover:text-[#3b2923] dark:hover:text-[#f5ebe3]'
            }`
          }
        >
          <div className="relative">
            <Clock size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#d43f39] text-white w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#292421]" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold">Orders</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-12 rounded-2xl transition-all ${
              isActive
                ? 'text-[#3b2923] dark:text-[#f5ebe3] bg-[#fff0e5] dark:bg-[#3d2c24] font-bold'
                : 'text-[#9b8b84] hover:text-[#3b2923] dark:hover:text-[#f5ebe3]'
            }`
          }
        >
          <User size={18} />
          <span className="text-[10px] mt-1 font-semibold">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};
