import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib';
import { Pet, Address, SavedBowl } from '../types';
import {
  User,
  Plus,
  Trash2,
  LogOut,
  MapPin,
  Moon,
  Sun,
  ShieldAlert,
  Heart,
  ChevronRight,
  Shield,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, logout } = useAuth();
  const { pets, loadPets } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [savedBowls, setSavedBowls] = useState<SavedBowl[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const addr = await api.getAddresses(user.id);
        setAddresses(addr);

        if (pets.length > 0) {
          const bowls = await api.getSavedBowls(pets[0].id);
          setSavedBowls(bowls);
        }
      } catch (e) {
        console.error('Error fetching profile data', e);
      }
    };
    fetchUserData();
  }, [user, pets]);

  const handleDeletePet = async (petId: string) => {
    if (!confirm('Are you sure you want to remove this pet?')) return;
    try {
      await api.deletePet(petId);
      await loadPets();
    } catch (e) {
      console.error('Error deleting pet', e);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-4 space-y-6">
      {/* User Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f28a4b] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#3b2923] dark:text-[#f5ebe3] leading-snug">
              {user?.full_name || 'Pet Parent'}
            </h1>
            <span className="text-xs text-[#9b8b84]">{user?.email}</span>
          </div>
        </div>

        {/* Staff/Admin quick portal link if user has role */}
        {(user?.role === 'staff' || user?.role === 'admin') && (
          <button
            type="button"
            onClick={() => navigate('/staff')}
            className="px-3 py-1.5 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs"
          >
            <Shield size={12} />
            <span>Staff Portal</span>
          </button>
        )}
      </div>

      {/* PETS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9b8b84]">
            Your Pets ({pets.length})
          </h2>
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="text-xs font-bold text-[#f28a4b] hover:underline flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Add another pet</span>
          </button>
        </div>

        <div className="space-y-2">
          {pets.map((p) => (
            <div
              key={p.id}
              className={`p-3.5 rounded-3xl border flex items-center justify-between ${
                p.species === 'dog'
                  ? 'bg-[#dcedf3]/40 dark:bg-[#24383e]/40 border-[#dcedf3] dark:border-[#365761]'
                  : 'bg-[#f7e1e4]/40 dark:bg-[#402e32]/40 border-[#f7e1e4] dark:border-[#67464d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.species === 'dog' ? '🐶' : '🐱'}</span>
                <div>
                  <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-bold">
                    {p.name}
                  </b>
                  <span className="text-[10px] text-[#6f5c54] dark:text-[#c1b2a9]">
                    {p.breed} • {p.age_years}y {p.age_months}m
                  </span>
                  {p.restrictions.length > 0 && (
                    <div className="flex items-center gap-1 text-[9px] text-[#d43f39] font-bold mt-0.5">
                      <ShieldAlert size={10} />
                      <span>{p.restrictions.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeletePet(p.id)}
                className="w-8 h-8 rounded-full text-[#9b8b84] hover:text-[#d43f39] flex items-center justify-center transition-colors"
                title="Remove pet"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SAVED ADDRESSES */}
      <div className="space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9b8b84]">
          Saved Addresses
        </h2>

        {addresses.length === 0 ? (
          <p className="text-xs text-[#9b8b84] italic">
            Addresses will automatically be saved upon your first delivery order.
          </p>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-2xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-xs flex items-start gap-2.5"
              >
                <MapPin size={16} className="text-[#f28a4b] shrink-0 mt-0.5" />
                <div>
                  <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block">
                    {a.label} ({a.name})
                  </b>
                  <p className="text-[11px] text-[#6f5c54] dark:text-[#c1b2a9]">
                    {a.flat}, {a.area} - {a.pincode}
                  </p>
                  <span className="text-[10px] text-[#9b8b84]">{a.phone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* THEME TOGGLE & SETTINGS */}
      <div className="space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9b8b84]">
          Preferences
        </h2>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Moon size={18} className="text-[#f28a4b]" />
            ) : (
              <Sun size={18} className="text-[#f28a4b]" />
            )}
            <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3]">
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </b>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3 py-1 rounded-xl bg-[#f3eadc] dark:bg-[#3d2c24] text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3]"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* LOGOUT */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full h-12 rounded-2xl border border-[#d43f39]/30 text-[#d43f39] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#fff0ee] dark:hover:bg-[#412725] transition-colors"
      >
        <LogOut size={16} />
        <span>Switch Account / Log out</span>
      </button>
    </div>
  );
};
