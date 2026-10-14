import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib';
import { MenuItem, Addon, SavedBowl, Pet } from '../types';
import { HEADER_CHIPS } from '../config/breeds';
import { ItemDetailSheet } from '../components/ItemDetailSheet';
import { Plus, Sparkles, Heart, ChevronRight, Cake, UtensilsCrossed } from 'lucide-react';

export const MenuView: React.FC = () => {
  const { user } = useAuth();
  const { pets, activePet, setActivePet, addItemToBowl } = useCart();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [savedBowls, setSavedBowls] = useState<SavedBowl[]>([]);
  const [selectedItemForSheet, setSelectedItemForSheet] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  // If user has no pets, redirect to onboarding
  useEffect(() => {
    if (pets.length === 0 && !loading) {
      navigate('/onboarding');
    }
  }, [pets, loading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [items, addns] = await Promise.all([
          api.getMenuItems(),
          api.getAddons(),
        ]);
        setMenuItems(items);
        setAddons(addns);
      } catch (e) {
        console.error('Error loading menu:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load saved bowls for active pet
  useEffect(() => {
    if (!activePet) return;
    const fetchSavedBowls = async () => {
      try {
        const bowls = await api.getSavedBowls(activePet.id);
        setSavedBowls(bowls);
      } catch (e) {
        console.error('Error loading saved bowls:', e);
      }
    };
    fetchSavedBowls();
  }, [activePet]);

  const currentSpecies = activePet ? activePet.species : 'dog';
  const otherSpecies = currentSpecies === 'dog' ? 'cat' : 'dog';

  // Filter items
  const mains = menuItems.filter(
    (item) =>
      item.category === 'mains' &&
      (item.species === currentSpecies || item.species === 'both')
  );

  const snacks = menuItems.filter(
    (item) =>
      (item.category === 'snacks' || item.category === 'drinks') &&
      (item.species === currentSpecies || item.species === 'both')
  );

  const specials = menuItems.filter((item) => item.category === 'specials');

  const otherPetItems = menuItems.filter((item) => item.species === otherSpecies).slice(0, 2);

  const handleQuickReorderBowl = (bowl: SavedBowl) => {
    if (!activePet) return;
    addItemToBowl(
      {
        id: activePet.id,
        name: activePet.name,
        species: activePet.species,
        restrictions: activePet.restrictions,
      },
      bowl.bowl_data
    );
    navigate('/cart');
  };

  const handleSwitchToOtherSpeciesBowl = () => {
    // Navigate to cart or open multi-pet flow
    navigate('/cart');
  };

  return (
    <div className="p-4 space-y-5">
      {/* Top Pet Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {pets.map((p) => {
          const isSelected = activePet?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePet(p)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-extrabold transition-all shrink-0 ${
                isSelected
                  ? p.species === 'dog'
                    ? 'bg-[#dcedf3] dark:bg-[#24383e] border-[#326b7d] text-[#326b7d] dark:text-[#a9d2e2] shadow-sm'
                    : 'bg-[#f7e1e4] dark:bg-[#402e32] border-[#9a5261] text-[#9a5261] dark:text-[#eebfc6] shadow-sm'
                  : 'bg-white dark:bg-[#292421] border-[#e9ded2] dark:border-[#443a35] text-[#6f5c54] dark:text-[#c1b2a9]'
              }`}
            >
              <span className="text-base">{p.species === 'dog' ? '🐶' : '🐱'}</span>
              <span>{p.name}'s Bowl</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="w-9 h-9 rounded-full border border-dashed border-[#f28a4b] text-[#f28a4b] flex items-center justify-center shrink-0 hover:bg-[#fff0e5] dark:hover:bg-[#3d2c24] transition-colors"
          title="Add another pet"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Vet / Fresh Guarantee Flowing Animated Marquee Strip */}
      <div className="overflow-hidden -mx-4 py-2 bg-[#f3eadc] dark:bg-[#2c2724] border-y border-[#e9ded2] dark:border-[#443a35]">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-6 text-[10px] font-extrabold uppercase tracking-wider text-[#3b2923] dark:text-[#f5ebe3]">
          {/* Repeating array twice for seamless continuous loop */}
          {[...HEADER_CHIPS, ...HEADER_CHIPS].map((chip, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <span className="text-[#f28a4b]">✦</span>
              <span>{chip}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Active Pet Saved Bowls (One-tap Reorder) */}
      {activePet && savedBowls.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#3b2923] dark:text-[#f5ebe3] flex items-center gap-1.5">
              <Heart size={14} className="text-[#f28a4b]" />
              {activePet.name}'s Saved Bowls
            </h2>
            <span className="text-[10px] text-[#9b8b84]">One-tap reorder</span>
          </div>

          <div className="space-y-2">
            {savedBowls.map((bowl) => (
              <div
                key={bowl.id}
                className="p-3 rounded-2xl bg-gradient-to-r from-[#fff0e5] to-white dark:from-[#3d2c24] dark:to-[#292421] border border-[#f2d9c7] dark:border-[#443a35] flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-white dark:bg-[#1f1b19] flex items-center justify-center text-xl shadow-2xs">
                    {bowl.bowl_data.menu_item.emoji}
                  </span>
                  <div>
                    <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block">
                      {bowl.name}
                    </b>
                    <small className="text-[10px] text-[#9b8b84]">
                      {bowl.bowl_data.menu_item.name} • ₹{bowl.bowl_data.item_total}
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickReorderBowl(bowl)}
                  className="px-3 py-1.5 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-[11px] font-bold shadow-2xs active:scale-95 transition-all"
                >
                  Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPECIALS BANNER (Birthday Cake & Custom Meal Plate) */}
      <div>
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#3b2923] dark:text-[#f5ebe3] mb-2 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#f28a4b]" /> Fresh Specials
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Cake Card */}
          <div
            onClick={() => navigate('/cake')}
            className="p-3.5 rounded-3xl bg-[#f7e1e4] dark:bg-[#402e32] border border-[#eebfc6] dark:border-[#67464d] cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-36"
          >
            <div>
              <div className="w-8 h-8 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center text-lg mb-1.5">
                🎂
              </div>
              <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-extrabold leading-tight">
                Birthday Paw-cake
              </b>
              <span className="text-[9px] text-[#6f5c54] dark:text-[#c1b2a9]">
                Live preview & candle
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <strong className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                ₹349
              </strong>
              <span className="w-6 h-6 rounded-full bg-[#3b2923] dark:bg-[#f28a4b] text-white flex items-center justify-center">
                <ChevronRight size={14} />
              </span>
            </div>
          </div>

          {/* Custom Meal Plate */}
          <div
            onClick={() => navigate('/custom-plate')}
            className="p-3.5 rounded-3xl bg-[#dcedf3] dark:bg-[#182830] border border-[#a9d2e2] dark:border-[#244250] cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-36"
          >
            <div>
              <div className="w-8 h-8 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center text-lg mb-1.5">
                🍱
              </div>
              <b className="text-xs text-[#3b2923] dark:text-[#f4f4f6] block font-extrabold leading-tight">
                Custom Meal Plate
              </b>
              <span className="text-[9px] text-[#6f5c54] dark:text-[#a1a1aa]">
                Craft bowl from raw ingredients
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <strong className="text-xs font-extrabold text-[#3b2923] dark:text-[#f4f4f6]">
                From ₹99
              </strong>
              <span className="w-6 h-6 rounded-full bg-[#3b2923] dark:bg-[#f28a4b] text-white flex items-center justify-center">
                <ChevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAINS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3]">
            {currentSpecies === 'dog' ? 'Dog Mains' : 'Cat Mains'}
          </h2>
          <span className="text-[10px] text-[#9b8b84] uppercase font-bold tracking-wider">
            Cooked Fresh Daily
          </span>
        </div>

        <div className="space-y-3">
          {mains.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItemForSheet(item)}
              className={`p-3.5 rounded-3xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                currentSpecies === 'dog'
                  ? 'bg-[#dcedf3]/40 dark:bg-[#24383e]/40 border-[#dcedf3] dark:border-[#365761]'
                  : 'bg-[#f7e1e4]/40 dark:bg-[#402e32]/40 border-[#f7e1e4] dark:border-[#67464d]'
              } hover:shadow-md`}
            >
              <div className="w-16 h-18 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center text-3xl shrink-0 shadow-2xs">
                {item.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3] leading-snug truncate">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-[10px] text-[#6f5c54] dark:text-[#c1b2a9] line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                )}
                {item.chicken && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-white/90 dark:bg-black/30 text-[#d9692d] text-[9px] font-bold">
                    Human-grade chicken
                  </span>
                )}
                <div className="mt-1.5 flex items-center justify-between">
                  <strong className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                    ₹{item.price}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-full bg-[#3b2923] dark:bg-[#f28a4b] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SNACKS & TREATS */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3]">
            Snacks & Broths
          </h2>
          <span className="text-[10px] text-[#9b8b84] uppercase font-bold tracking-wider">
            Vet-safe bites
          </span>
        </div>

        <div className="space-y-3">
          {snacks.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItemForSheet(item)}
              className="p-3.5 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5"
            >
              <div className="w-14 h-16 rounded-2xl bg-[#fbf6ed] dark:bg-[#1f1b19] flex items-center justify-center text-2xl shrink-0">
                {item.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3] truncate">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-[10px] text-[#6f5c54] dark:text-[#c1b2a9] line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                )}
                {item.chicken && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[#fff0e5] text-[#d9692d] text-[8px] font-bold">
                    Human-grade chicken
                  </span>
                )}
                <div className="mt-1">
                  <strong className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                    ₹{item.price}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="w-8 h-8 rounded-full bg-[#3b2923] dark:bg-[#f28a4b] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* TREAT ANOTHER PET ROW */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
              Treat another pet too?
            </h3>
            <p className="text-[10px] text-[#9b8b84]">
              Start a separate bowl for your other {otherSpecies === 'dog' ? 'dog' : 'cat'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSwitchToOtherSpeciesBowl}
            className="text-[11px] font-bold text-[#f28a4b] hover:underline flex items-center gap-0.5"
          >
            <span>Multi-Pet Cart</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {otherPetItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItemForSheet(item)}
              className="p-2.5 rounded-2xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] flex items-center gap-2 cursor-pointer hover:border-[#f28a4b]"
            >
              <span className="text-2xl">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <b className="text-[11px] text-[#3b2923] dark:text-[#f5ebe3] truncate block">
                  {item.name}
                </b>
                <span className="text-[10px] font-bold text-[#f28a4b]">
                  ₹{item.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item Detail Sheet with Add-ons stepper in grams */}
      {selectedItemForSheet && activePet && (
        <ItemDetailSheet
          item={selectedItemForSheet}
          addons={addons}
          petName={activePet.name}
          petSpecies={activePet.species}
          petRestrictions={activePet.restrictions}
          onClose={() => setSelectedItemForSheet(null)}
          onAddToCart={(cartItem) => {
            addItemToBowl(
              {
                id: activePet.id,
                name: activePet.name,
                species: activePet.species,
                restrictions: activePet.restrictions,
              },
              cartItem
            );
          }}
        />
      )}
    </div>
  );
};
