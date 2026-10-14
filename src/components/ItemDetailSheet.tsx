import React, { useState } from 'react';
import { MenuItem, Addon, SelectedAddon, CartItem } from '../types';
import { X, Plus, Minus, ShieldAlert } from 'lucide-react';

interface ItemDetailSheetProps {
  item: MenuItem;
  addons: Addon[];
  petName: string;
  petSpecies: 'dog' | 'cat';
  petRestrictions: string[];
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const ItemDetailSheet: React.FC<ItemDetailSheetProps> = ({
  item,
  addons,
  petName,
  petSpecies,
  petRestrictions,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [customNotes, setCustomNotes] = useState('');
  const [showAllergyWarning, setShowAllergyWarning] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);

  // Filter available addons matching species or both
  const applicableAddons = addons.filter(
    (a) => a.is_available && (a.species === petSpecies || a.species === 'both')
  );

  const handleStepper = (addonId: string, deltaGrams: number) => {
    setSelectedAddons((prev) => {
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

  // Calculate live running price
  const calculateTotal = () => {
    let base = item.price;
    let addonsTotal = 0;

    Object.entries(selectedAddons).forEach(([addonId, grams]) => {
      const addon = addons.find((a) => a.id === addonId);
      if (addon && grams > 0) {
        const cost = (addon.price_per_100g * grams) / 100;
        addonsTotal += cost;
      }
    });

    return (base + addonsTotal) * quantity;
  };

  const handleAddClick = () => {
    // 1. Build selected addons payload
    const finalAddons: SelectedAddon[] = Object.entries(selectedAddons).map(([addonId, grams]) => {
      const addon = addons.find((a) => a.id === addonId)!;
      return {
        addon_id: addon.id,
        name: addon.name,
        grams,
        price: (addon.price_per_100g * grams) / 100,
        chicken: addon.chicken,
      };
    });

    const itemTotal =
      item.price +
      finalAddons.reduce((sum, a) => sum + a.price, 0);

    const cartItem: CartItem = {
      cart_item_id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      menu_item: item,
      quantity,
      selected_addons: finalAddons,
      custom_notes: customNotes.trim() || undefined,
      item_total: itemTotal,
      allergy_acknowledged: false,
    };

    // 2. Check for allergy conflicts
    const hasChicken = item.chicken || finalAddons.some((a) => a.chicken);
    const petAllergicToChicken = petRestrictions.some((r) => r.toLowerCase().includes('chicken'));
    const petAllergicToFish = petRestrictions.some((r) => r.toLowerCase().includes('fish')) && item.name.toLowerCase().includes('fish');
    const petAllergicToEgg = petRestrictions.some((r) => r.toLowerCase().includes('egg')) && (item.name.toLowerCase().includes('egg') || finalAddons.some((a) => a.name.toLowerCase().includes('egg')));
    const petAllergicToDairy = petRestrictions.some((r) => r.toLowerCase().includes('dairy')) && (item.name.toLowerCase().includes('curd') || item.name.toLowerCase().includes('milk') || finalAddons.some((a) => a.name.toLowerCase().includes('curd')));
    const petAllergicToPeanut = petRestrictions.some((r) => r.toLowerCase().includes('peanut')) && item.name.toLowerCase().includes('peanut');

    if ((hasChicken && petAllergicToChicken) || petAllergicToFish || petAllergicToEgg || petAllergicToDairy || petAllergicToPeanut) {
      setPendingCartItem(cartItem);
      setShowAllergyWarning(true);
      return;
    }

    onAddToCart(cartItem);
    onClose();
  };

  const confirmAllergyWarning = () => {
    if (pendingCartItem) {
      onAddToCart({ ...pendingCartItem, allergy_acknowledged: true });
    }
    setShowAllergyWarning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[430px] bg-[#fffdf9] dark:bg-[#292421] rounded-t-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl relative">
        <div className="w-10 h-1 bg-[#e9ded2] dark:bg-[#443a35] rounded-full mx-auto mb-3" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl w-14 h-14 rounded-2xl bg-[#dcedf3] dark:bg-[#24383e] flex items-center justify-center">
              {item.emoji}
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[#3b2923] dark:text-[#f5ebe3] leading-tight">
                {item.name}
              </h2>
              {item.chicken && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#fff0e5] text-[#d9692d] text-[10px] font-bold">
                  Human-grade chicken
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f3eadc] dark:bg-[#3d2c24] flex items-center justify-center text-[#6f5c54] dark:text-[#c1b2a9]"
          >
            <X size={18} />
          </button>
        </div>

        {item.description && (
          <p className="text-xs text-[#6f5c54] dark:text-[#c1b2a9] mb-4">
            {item.description}
          </p>
        )}

        {/* Scrollable Add-ons Section */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
          {applicableAddons.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3b2923] dark:text-[#f5ebe3]">
                  Fresh Add-ons
                </h3>
                <span className="text-[10px] text-[#9b8b84]">Default 100g (Step 50g)</span>
              </div>

              <div className="space-y-2">
                {applicableAddons.map((addon) => {
                  const currentGrams = selectedAddons[addon.id] || 0;
                  const price = (addon.price_per_100g * (currentGrams || 100)) / 100;

                  return (
                    <div
                      key={addon.id}
                      className="p-2.5 rounded-xl border border-[#e9ded2] dark:border-[#443a35] bg-white dark:bg-[#302a27] flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block">
                          {addon.name}
                        </b>
                        <span className="text-[10px] text-[#9b8b84]">
                          ₹{addon.price_per_100g} / 100g
                          {addon.chicken && ' • Human-grade chicken'}
                        </span>
                      </div>

                      {/* Stepper with grams */}
                      <div className="flex items-center gap-1.5 bg-[#f3eadc] dark:bg-[#24201e] rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleStepper(addon.id, -50)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#302a27] flex items-center justify-center text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3] active:scale-90"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-10 text-center text-[11px] font-bold text-[#3b2923] dark:text-[#f5ebe3]">
                          {currentGrams > 0 ? `${currentGrams}g` : '0g'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStepper(addon.id, 50)}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#302a27] flex items-center justify-center text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3] active:scale-90"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6f5c54] dark:text-[#c1b2a9] mb-1">
              Kitchen Instructions (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Extra warm, mash thoroughly"
              className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#302a27] border border-[#e9ded2] dark:border-[#443a35] text-xs text-[#3b2923] dark:text-[#f5ebe3] outline-none"
            />
          </div>
        </div>

        {/* Live Running Price & Add to Cart */}
        <div className="pt-2 border-t border-[#e9ded2] dark:border-[#443a35] flex items-center gap-3">
          <div className="flex items-center bg-[#f3eadc] dark:bg-[#3d2c24] rounded-2xl p-1 h-13">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-full rounded-xl bg-white dark:bg-[#292421] flex items-center justify-center text-sm font-bold text-[#3b2923] dark:text-[#f5ebe3]"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-full rounded-xl bg-white dark:bg-[#292421] flex items-center justify-center text-sm font-bold text-[#3b2923] dark:text-[#f5ebe3]"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddClick}
            className="flex-1 h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-between px-5 shadow-md active:scale-95 transition-all"
          >
            <span>Add to {petName}'s Bowl</span>
            <span>₹{calculateTotal()}</span>
          </button>
        </div>

        {/* Allergy Warning Confirm Sheet */}
        {showAllergyWarning && (
          <div className="absolute inset-0 bg-[#fffdf9] dark:bg-[#292421] rounded-t-3xl p-6 z-20 flex flex-col justify-center items-center text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#fff0ee] text-[#d43f39] flex items-center justify-center mb-4">
              <ShieldAlert size={36} />
            </div>
            <h2 className="text-xl font-extrabold text-[#3b2923] dark:text-[#f5ebe3] leading-tight mb-2">
              Allergy Warning
            </h2>
            <p className="text-sm text-[#6f5c54] dark:text-[#c1b2a9] max-w-[280px] mb-6">
              <strong className="text-[#d43f39]">{petName}</strong> is marked with dietary restrictions ({petRestrictions.join(', ')}). Continue?
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowAllergyWarning(false)}
                className="h-12 rounded-xl border border-[#e9ded2] dark:border-[#443a35] text-xs font-bold text-[#6f5c54] dark:text-[#c1b2a9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAllergyWarning}
                className="h-12 rounded-xl bg-[#d43f39] text-white text-xs font-bold shadow-md"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
