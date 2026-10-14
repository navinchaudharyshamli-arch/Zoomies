import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Addon, CartItem, MenuItem } from '../types';
import { ArrowLeft, Plus, Minus, ShieldAlert, Sparkles, Check, Info } from 'lucide-react';

interface CustomPlateBuilderProps {
  addons: Addon[];
  onBack?: () => void;
}

export const CustomPlateBuilderView: React.FC<CustomPlateBuilderProps> = ({ addons }) => {
  const navigate = useNavigate();
  const { activePet, addItemToBowl } = useCart();

  const petName = activePet?.name || 'Your Pet';
  const petSpecies = activePet?.species || 'dog';
  const petRestrictions = activePet?.restrictions || [];

  const [plateName, setPlateName] = useState(`${petName}'s Fresh Custom Plate`);
  const [selectedIngredients, setSelectedIngredients] = useState<Record<string, number>>({});
  const [customNotes, setCustomNotes] = useState('');
  const [showAllergyWarning, setShowAllergyWarning] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);

  // Available base ingredients & add-ons for this species
  const availableItems = addons.filter(
    (a) => a.is_available && (a.species === petSpecies || a.species === 'both')
  );

  const handleStepper = (addonId: string, deltaGrams: number) => {
    setSelectedIngredients((prev) => {
      const current = prev[addonId] || 0;
      const next = current + deltaGrams;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      }
      return { ...prev, [addonId]: next };
    });
  };

  // Base plate cost is ₹99 (kitchen preparation, bone broth base & fresh cooking) + chosen ingredients in grams
  const basePrepCost = 99;
  const ingredientsCost = Object.entries(selectedIngredients).reduce((sum, [addonId, grams]) => {
    const addon = addons.find((a) => a.id === addonId);
    if (addon && grams > 0) {
      return sum + (addon.price_per_100g * grams) / 100;
    }
    return sum;
  }, 0);

  const grandTotal = Math.round(basePrepCost + ingredientsCost);
  const totalGrams = Object.values(selectedIngredients).reduce((sum, g) => sum + g, 0);

  const handleAddToCart = () => {
    if (totalGrams === 0) {
      alert('Please add at least one ingredient to build your custom pet plate.');
      return;
    }

    const finalAddons = Object.entries(selectedIngredients).map(([addonId, grams]) => {
      const addon = addons.find((a) => a.id === addonId)!;
      return {
        addon_id: addon.id,
        name: addon.name,
        grams,
        price: (addon.price_per_100g * grams) / 100,
        chicken: addon.chicken,
      };
    });

    const plateMenuItem: MenuItem = {
      id: 'special-2',
      species: petSpecies,
      category: 'specials',
      name: plateName.trim() || 'Custom Pet Meal Plate',
      price: basePrepCost,
      emoji: '🍱',
      chicken: finalAddons.some((a) => a.chicken),
      is_available: true,
    };

    const cartItem: CartItem = {
      cart_item_id: `custom-plate-${Date.now()}`,
      menu_item: plateMenuItem,
      quantity: 1,
      selected_addons: finalAddons,
      custom_notes: customNotes.trim() ? `Custom recipe: ${customNotes.trim()}` : undefined,
      item_total: grandTotal,
      allergy_acknowledged: false,
    };

    // Check allergy conflict
    const hasChicken = finalAddons.some((a) => a.chicken);
    const petAllergicToChicken = petRestrictions.some((r) => r.toLowerCase().includes('chicken'));
    const petAllergicToFish = petRestrictions.some((r) => r.toLowerCase().includes('fish')) && finalAddons.some((a) => a.name.toLowerCase().includes('fish'));
    const petAllergicToEgg = petRestrictions.some((r) => r.toLowerCase().includes('egg')) && finalAddons.some((a) => a.name.toLowerCase().includes('egg'));
    const petAllergicToDairy = petRestrictions.some((r) => r.toLowerCase().includes('dairy')) && finalAddons.some((a) => a.name.toLowerCase().includes('curd') || a.name.toLowerCase().includes('milk'));

    if ((hasChicken && petAllergicToChicken) || petAllergicToFish || petAllergicToEgg || petAllergicToDairy) {
      setPendingCartItem(cartItem);
      setShowAllergyWarning(true);
      return;
    }

    addItemToBowl(
      {
        id: activePet?.id,
        name: petName,
        species: petSpecies,
        restrictions: petRestrictions,
      },
      cartItem
    );
    navigate('/cart');
  };

  const confirmAllergyWarning = () => {
    if (pendingCartItem) {
      addItemToBowl(
        {
          id: activePet?.id,
          name: petName,
          species: petSpecies,
          restrictions: petRestrictions,
        },
        { ...pendingCartItem, allergy_acknowledged: true }
      );
    }
    setShowAllergyWarning(false);
    navigate('/cart');
  };

  return (
    <div className="p-4 space-y-5">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#1e1e24] border border-[#e9ded2] dark:border-[#2e2e38] flex items-center justify-center text-[#3b2923] dark:text-[#f4f4f6]"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f28a4b] block">
            Craft Your Own Bowl
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3b2923] dark:text-[#f4f4f6]">
            Custom Meal Plate
          </h1>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-3.5 rounded-2xl bg-[#fff0e5] dark:bg-[#2c2018] border border-[#f28a4b]/30 flex items-start gap-2.5 text-xs text-[#d9692d] dark:text-[#f28a4b]">
        <Sparkles size={18} className="shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <b className="block font-bold">100% Customized For {petName}</b>
          <p className="text-[11px] leading-relaxed text-[#6f5c54] dark:text-[#a1a1aa]">
            Select exact ingredients & portion sizes in grams. No premade items — our chef prepares this fresh from scratch!
          </p>
        </div>
      </div>

      {/* Plate Summary Tracker Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#1e1e24] border border-[#e9ded2] dark:border-[#2e2e38] shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9b8b84] dark:text-[#71717a]">
            Plate Contents
          </span>
          <b className="text-sm text-[#3b2923] dark:text-[#f4f4f6] block">
            {Object.keys(selectedIngredients).length} ingredients ({totalGrams}g total)
          </b>
          <span className="text-[10px] text-[#f28a4b] font-medium">
            Base prep fee: ₹{basePrepCost} included
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#9b8b84] dark:text-[#71717a] block">Current Total</span>
          <strong className="text-xl font-extrabold text-[#3b2923] dark:text-[#f4f4f6]">
            ₹{grandTotal}
          </strong>
        </div>
      </div>

      {/* Custom Plate Title Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#a1a1aa] mb-1">
          Bowl Title (Optional)
        </label>
        <input
          type="text"
          value={plateName}
          onChange={(e) => setPlateName(e.target.value)}
          placeholder={`e.g. ${petName}'s Special High Protein Plate`}
          className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#26262e] border border-[#e9ded2] dark:border-[#2e2e38] text-xs font-bold text-[#3b2923] dark:text-[#f4f4f6] outline-none focus:ring-2 focus:ring-[#f28a4b]"
        />
      </div>

      {/* AVAILABLE INGREDIENTS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#3b2923] dark:text-[#f4f4f6]">
            Select Ingredients & Grams
          </h2>
          <span className="text-[10px] text-[#9b8b84] dark:text-[#71717a]">50g steps</span>
        </div>

        <div className="space-y-2">
          {availableItems.map((item) => {
            const currentGrams = selectedIngredients[item.id] || 0;
            const price = Math.round((item.price_per_100g * (currentGrams || 50)) / 100);

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  currentGrams > 0
                    ? 'bg-[#fff0e5]/70 dark:bg-[#2c2018] border-[#f28a4b] shadow-2xs'
                    : 'bg-white dark:bg-[#1e1e24] border-[#e9ded2] dark:border-[#2e2e38]'
                }`}
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <b className="text-xs font-bold text-[#3b2923] dark:text-[#f4f4f6]">
                      {item.name}
                    </b>
                    {item.chicken && (
                      <span className="text-[8px] bg-[#fff0e5] dark:bg-[#3d2c24] text-[#ea580c] dark:text-[#f28a4b] px-1.5 py-0.2 rounded font-bold">
                        Human-grade chicken
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#9b8b84] dark:text-[#71717a] block mt-0.5">
                    ₹{item.price_per_100g} per 100g
                  </span>
                </div>

                {/* Grams stepper */}
                <div className="flex items-center gap-1.5 bg-[#f3eadc] dark:bg-[#26262e] rounded-xl p-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStepper(item.id, -50)}
                    disabled={currentGrams === 0}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e1e24] flex items-center justify-center text-xs font-bold text-[#3b2923] dark:text-[#f4f4f6] disabled:opacity-40 active:scale-90"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="min-w-10 text-center text-[11px] font-extrabold text-[#3b2923] dark:text-[#f4f4f6]">
                    {currentGrams > 0 ? `${currentGrams}g` : '0g'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepper(item.id, 50)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e1e24] flex items-center justify-center text-xs font-bold text-[#3b2923] dark:text-[#f4f4f6] active:scale-90"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Kitchen Notes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#a1a1aa] mb-1">
          Special Preparation Instructions (Optional)
        </label>
        <input
          type="text"
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder="e.g. Mash finely, serve warm, no salt"
          className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#26262e] border border-[#e9ded2] dark:border-[#2e2e38] text-xs text-[#3b2923] dark:text-[#f4f4f6] outline-none"
        />
      </div>

      {/* Add To Cart CTA */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={totalGrams === 0}
        className="w-full h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-between px-6 shadow-md active:scale-95 transition-all disabled:opacity-50 mt-4"
      >
        <span>Add Custom Plate to {petName}'s Bowl</span>
        <span>₹{grandTotal}</span>
      </button>

      {/* Allergy Warning Confirm Sheet */}
      {showAllergyWarning && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-[430px] bg-[#fffdf9] dark:bg-[#1e1e24] rounded-t-3xl p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#fff0ee] dark:bg-[#381a1a] text-[#ef4444] flex items-center justify-center mx-auto">
              <ShieldAlert size={36} />
            </div>
            <h2 className="text-xl font-extrabold text-[#3b2923] dark:text-[#f4f4f6]">
              Allergy Warning
            </h2>
            <p className="text-xs text-[#6f5c54] dark:text-[#a1a1aa] max-w-[280px] mx-auto">
              <strong className="text-[#ef4444]">{petName}</strong> is allergic to ({petRestrictions.join(', ')}). Your custom plate contains matching items. Continue?
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAllergyWarning(false)}
                className="h-12 rounded-xl border border-[#e9ded2] dark:border-[#2e2e38] text-xs font-bold text-[#6f5c54] dark:text-[#a1a1aa]"
              >
                Change Ingredients
              </button>
              <button
                type="button"
                onClick={confirmAllergyWarning}
                className="h-12 rounded-xl bg-[#ef4444] text-white text-xs font-bold shadow-md"
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
