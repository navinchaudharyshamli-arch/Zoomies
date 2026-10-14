import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { MenuItem, CartItem } from '../types';
import { ArrowLeft, Sparkles, Clock } from 'lucide-react';

interface CakeCustomizerViewProps {
  onBack?: () => void;
}

export const CakeCustomizerView: React.FC<CakeCustomizerViewProps> = () => {
  const navigate = useNavigate();
  const { activePet, addItemToBowl } = useCart();

  const [cakeName, setCakeName] = useState(activePet ? activePet.name : 'Bruno');
  const [petSpecies, setPetSpecies] = useState<'dog' | 'cat'>(activePet ? activePet.species : 'dog');

  const cakePrice = 349;

  const handleAddToCart = () => {
    if (!cakeName.trim()) return;

    const cakeItem: MenuItem = {
      id: 'special-1',
      species: 'both',
      category: 'specials',
      name: 'Birthday Paw-cake',
      price: cakePrice,
      emoji: '🎂',
      chicken: false,
      is_available: true,
    };

    const cartItem: CartItem = {
      cart_item_id: `cake-${Date.now()}`,
      menu_item: cakeItem,
      quantity: 1,
      cake_name: cakeName.trim(),
      selected_addons: [],
      item_total: cakePrice,
      allergy_acknowledged: false,
    };

    addItemToBowl(
      {
        id: activePet?.id,
        name: activePet?.name || cakeName.trim(),
        species: petSpecies,
        restrictions: activePet?.restrictions || [],
      },
      cartItem
    );

    navigate('/cart');
  };

  return (
    <div className="p-5 space-y-5">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] flex items-center justify-center text-[#3b2923] dark:text-[#f5ebe3]"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f28a4b] block">
            Custom Paw Bakery
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3]">
            Birthday Paw-cake
          </h1>
        </div>
      </div>

      {/* 24-Hour Notice Banner */}
      <div className="p-3 rounded-2xl bg-[#fff0e5] dark:bg-[#3d2c24] border border-[#f28a4b]/30 flex items-center gap-2.5 text-xs text-[#d9692d] font-bold">
        <Clock size={18} className="shrink-0" />
        <span>Freshly baked from scratch! Requires 24-hour advance booking.</span>
      </div>

      {/* LIVE CSS/SVG CAKE PREVIEW */}
      <div className="h-64 rounded-3xl bg-gradient-to-b from-[#f7e1e4] via-[#fff0e5] to-[#fbf6ed] dark:from-[#402e32] dark:via-[#3d2c24] dark:to-[#1f1b19] relative flex flex-col items-center justify-end p-4 border border-[#e9ded2] dark:border-[#443a35] shadow-inner overflow-hidden">
        {/* Floating Sparkles */}
        <div className="absolute top-4 inset-x-0 flex justify-around text-xs text-[#f28a4b] animate-pulse">
          <span>✨</span>
          <span>🐾</span>
          <span>✨</span>
          <span>🎉</span>
          <span>✨</span>
        </div>

        {/* Candle Flame & Wick */}
        <div className="relative z-10 flex flex-col items-center mb-1">
          <div className="w-3.5 h-5 rounded-full bg-gradient-to-t from-[#f28a4b] to-[#fbbf24] animate-bounce shadow-[0_0_12px_#f28a4b]" />
          <div className="w-0.5 h-2 bg-[#3b2923]" />
          <div className="w-3.5 h-8 bg-gradient-to-b from-[#a9d2e2] to-white rounded-sm shadow-xs border border-white/50" />
        </div>

        {/* Cake Name Ribbon */}
        <div className="relative z-20 -mb-3 px-5 py-1.5 rounded-full bg-[#f28a4b] text-white font-extrabold text-sm tracking-wide shadow-md max-w-[220px] truncate text-center uppercase border-2 border-white/80">
          {cakeName.trim() || 'Your Pet'}
        </div>

        {/* Cake Frosting Top Tier */}
        <div className="w-48 h-10 rounded-full bg-[#fed7aa] dark:bg-[#9a5261] relative z-10 shadow-sm border border-white/40" />

        {/* Cake Base Tier */}
        <div className="w-48 h-16 bg-[#ea580c] dark:bg-[#704536] -mt-5 rounded-b-3xl shadow-lg border border-black/10 relative overflow-hidden flex items-end justify-center pb-2">
          <div className="w-full flex justify-around opacity-30 text-white text-xs">
            <span>🐾</span>
            <span>🍖</span>
            <span>🐾</span>
            <span>🦴</span>
            <span>🐾</span>
          </div>
        </div>

        {/* Cake Plate Shadow */}
        <div className="w-56 h-3 rounded-full bg-black/10 dark:bg-black/40 blur-xs mt-1" />
      </div>

      {/* Inputs */}
      <div className="space-y-4 pt-1">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1">
            Name on Cake (Max 20 chars)
          </label>
          <input
            type="text"
            maxLength={20}
            value={cakeName}
            onChange={(e) => setCakeName(e.target.value)}
            placeholder="e.g. Happy 3rd Bruno!"
            className="w-full h-12 px-4 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-sm font-bold text-[#3b2923] dark:text-[#f5ebe3] outline-none focus:ring-2 focus:ring-[#f28a4b]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1">
            Pet Species
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPetSpecies('dog')}
              className={`h-11 rounded-xl font-bold text-xs border transition-all ${
                petSpecies === 'dog'
                  ? 'bg-[#dcedf3] text-[#326b7d] border-[#a9d2e2]'
                  : 'bg-white dark:bg-[#292421] text-[#6f5c54] border-[#e9ded2] dark:border-[#443a35]'
              }`}
            >
              🐶 Dog Safe (Pumpkin & Peanut)
            </button>
            <button
              type="button"
              onClick={() => setPetSpecies('cat')}
              className={`h-11 rounded-xl font-bold text-xs border transition-all ${
                petSpecies === 'cat'
                  ? 'bg-[#f7e1e4] text-[#9a5261] border-[#eebfc6]'
                  : 'bg-white dark:bg-[#292421] text-[#6f5c54] border-[#e9ded2] dark:border-[#443a35]'
              }`}
            >
              🐱 Cat Safe (Salmon & Egg)
            </button>
          </div>
        </div>
      </div>

      {/* Add To Cart Button */}
      <button
        type="button"
        disabled={!cakeName.trim()}
        onClick={handleAddToCart}
        className="w-full h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-between px-6 shadow-md active:scale-95 transition-all disabled:opacity-50 mt-4"
      >
        <span>Add Birthday Paw-cake</span>
        <span>₹{cakePrice}</span>
      </button>
    </div>
  );
};
