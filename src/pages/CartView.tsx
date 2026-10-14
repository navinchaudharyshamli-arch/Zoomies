import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ALLERGY_OPTIONS } from '../config/breeds';
import { Plus, Trash2, ArrowRight, ShieldAlert, HeartHandshake, X } from 'lucide-react';
import { ContactModal } from '../components/ContactModal';

export const CartView: React.FC = () => {
  const navigate = useNavigate();
  const {
    groups,
    pets,
    setActivePet,
    updateItemQuantity,
    removeItem,
    clearCart,
    subtotal,
  } = useCart();

  const [showContact, setShowContact] = useState(false);
  const [showAddBowlModal, setShowAddBowlModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestSpecies, setGuestSpecies] = useState<'dog' | 'cat'>('dog');
  const [guestRestrictions, setGuestRestrictions] = useState<string[]>([]);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const deliveryFee = subtotal >= 300 || subtotal === 0 ? 0 : 30;
  const grandTotal = subtotal + deliveryFee;

  const handleSelectPetForBowl = (pet: { id?: string; name: string; species: 'dog' | 'cat'; restrictions: string[] }) => {
    // If it's one of user's saved pets
    const matchingSaved = pets.find((p) => p.id === pet.id);
    if (matchingSaved) {
      setActivePet(matchingSaved);
    }
    setShowAddBowlModal(false);
    navigate('/');
  };

  const handleCreateGuestPetBowl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    // Set pseudo active pet & navigate to menu
    setShowAddBowlModal(false);
    navigate('/');
  };

  const toggleGuestRestriction = (res: string) => {
    setGuestRestrictions((prev) =>
      prev.includes(res) ? prev.filter((r) => r !== res) : [...prev, res]
    );
  };

  if (groups.length === 0) {
    return (
      <div className="p-6 text-center space-y-4 pt-16">
        <div className="w-20 h-20 rounded-full bg-[#fff0e5] dark:bg-[#3d2c24] text-4xl flex items-center justify-center mx-auto shadow-inner">
          🥣
        </div>
        <h1 className="text-2xl font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
          Your pet bowls are empty
        </h1>
        <p className="text-xs text-[#6f5c54] dark:text-[#c1b2a9] max-w-[260px] mx-auto">
          Choose freshly prepared chicken bowls, broths or custom birthday cakes!
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-6 h-12 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-xs inline-flex items-center gap-2 shadow-md"
        >
          <span>Explore Fresh Menu</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f28a4b] block">
            Checkout Review
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3]">
            Pet Bowls ({groups.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-bold text-[#d43f39] hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Bowl Groups per Pet */}
      <div className="space-y-4">
        {groups.map((grp) => (
          <div
            key={grp.group_id}
            className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] shadow-xs space-y-3"
          >
            {/* Bowl Header with Pet Name & Restrictions Badge */}
            <div className="flex items-center justify-between border-b border-[#e9ded2] dark:border-[#443a35] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{grp.pet_species === 'dog' ? '🐶' : '🐱'}</span>
                <div>
                  <h2 className="text-sm font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                    {grp.pet_name}'s Bowl
                  </h2>
                  {grp.is_guest_pet && (
                    <span className="text-[9px] text-[#9b8b84] font-medium">Guest Pet</span>
                  )}
                </div>
              </div>

              {grp.pet_restrictions.length > 0 ? (
                <div className="px-2 py-0.5 rounded-full bg-[#fff0ee] dark:bg-[#412725] text-[#d43f39] text-[9px] font-extrabold flex items-center gap-1">
                  <ShieldAlert size={11} />
                  <span>{grp.pet_restrictions.join(', ')}</span>
                </div>
              ) : (
                <span className="text-[9px] text-[#34775d] font-bold">No restrictions</span>
              )}
            </div>

            {/* Items inside this Pet's Bowl */}
            <div className="space-y-3">
              {grp.items.map((it) => (
                <div
                  key={it.cart_item_id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] truncate">
                        {it.menu_item.name}
                      </b>
                      {it.menu_item.chicken && (
                        <span className="text-[8px] font-bold text-[#d9692d] bg-[#fff0e5] px-1 py-0.2 rounded">
                          Human-grade chicken
                        </span>
                      )}
                    </div>

                    {it.cake_name && (
                      <p className="text-[10px] text-[#f28a4b] font-bold">
                        Name on cake: "{it.cake_name}"
                      </p>
                    )}

                    {it.removed_ingredients && it.removed_ingredients.length > 0 && (
                      <p className="text-[10px] text-[#d43f39] font-semibold">
                        ✕ Excluded: {it.removed_ingredients.join(', ')}
                      </p>
                    )}

                    {it.selected_addons.length > 0 && (
                      <p className="text-[10px] text-[#9b8b84] truncate">
                        + {it.selected_addons.map((a) => `${a.name} (${a.grams}g)`).join(', ')}
                      </p>
                    )}

                    {it.custom_notes && (
                      <p className="text-[9px] text-[#9b8b84] italic">
                        Note: {it.custom_notes}
                      </p>
                    )}

                    <strong className="text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3] block mt-0.5">
                      ₹{it.item_total * it.quantity}
                    </strong>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-[#f3eadc] dark:bg-[#1f1b19] rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(grp.group_id, it.cart_item_id, -1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-[#292421] flex items-center justify-center text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3]"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3]">
                      {it.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(grp.group_id, it.cart_item_id, 1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-[#292421] flex items-center justify-center text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Clear Card: "Order for another pet too? Tap here" */}
      <button
        type="button"
        onClick={() => setShowAddBowlModal(true)}
        className="w-full p-4 rounded-3xl border border-dashed border-[#f28a4b] bg-[#fff0e5]/60 dark:bg-[#3d2c24]/50 flex items-center gap-3.5 text-left hover:bg-[#fff0e5] transition-all"
      >
        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#292421] text-[#f28a4b] flex items-center justify-center text-lg shadow-2xs">
          <HeartHandshake size={22} />
        </div>
        <div className="flex-1">
          <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-extrabold">
            Order for another pet too? Tap here
          </b>
          <span className="text-[10px] text-[#6f5c54] dark:text-[#c1b2a9]">
            Add a dog or cat bowl in the same checkout
          </span>
        </div>
        <Plus size={18} className="text-[#f28a4b]" />
      </button>

      {/* Contact Zoomies Team Row in Cart */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] flex items-center justify-between">
        <div>
          <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-bold">
            Questions about ingredients?
          </b>
          <span className="text-[10px] text-[#9b8b84]">
            Call or WhatsApp our kitchen nutritionists directly
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowContact(true)}
          className="px-3 py-1.5 rounded-xl bg-[#fff0e5] dark:bg-[#3d2c24] text-[#f28a4b] text-xs font-bold hover:bg-[#f28a4b] hover:text-white transition-colors"
        >
          Contact Team
        </button>
      </div>

      {/* Price Summary Breakdown */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] space-y-2 text-xs">
        <div className="flex justify-between text-[#6f5c54] dark:text-[#c1b2a9]">
          <span>Subtotal</span>
          <span className="font-bold text-[#3b2923] dark:text-[#f5ebe3]">₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-[#6f5c54] dark:text-[#c1b2a9]">
          <span>Delivery Fee</span>
          <span className="font-bold text-[#3b2923] dark:text-[#f5ebe3]">
            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
          </span>
        </div>
        {subtotal < 300 && (
          <p className="text-[10px] text-[#f28a4b] font-medium">
            Add ₹{300 - subtotal} more for free delivery!
          </p>
        )}
        <div className="border-t border-[#e9ded2] dark:border-[#443a35] pt-2 flex justify-between text-sm font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
          <span>Total</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      {/* Checkout CTA */}
      <button
        type="button"
        onClick={() => navigate('/checkout')}
        className="w-full h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-between px-6 shadow-md active:scale-95 transition-all"
      >
        <span>Proceed to Checkout</span>
        <span>₹{grandTotal}</span>
      </button>

      <ContactModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
        title="Contact Zoomies Kitchen"
        subtitle="Special diets, allergy double-checks or bowl queries"
      />

      {/* Multi-Pet Bottom Sheet */}
      {showAddBowlModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-[430px] bg-[#fffdf9] dark:bg-[#292421] rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl relative animate-in fade-in">
            <div className="w-10 h-1 bg-[#e9ded2] dark:bg-[#443a35] rounded-full mx-auto" />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                Which pet is this bowl for?
              </h2>
              <button
                type="button"
                onClick={() => setShowAddBowlModal(false)}
                className="w-8 h-8 rounded-full bg-[#f3eadc] dark:bg-[#3d2c24] flex items-center justify-center text-[#6f5c54] dark:text-[#c1b2a9]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Saved Pets List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9b8b84]">
                Your Saved Pets
              </span>
              {pets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPetForBowl(p)}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-[#302a27] border border-[#e9ded2] dark:border-[#443a35] flex items-center justify-between hover:border-[#f28a4b] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.species === 'dog' ? '🐶' : '🐱'}</span>
                    <div>
                      <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-bold">
                        {p.name} ({p.breed})
                      </b>
                      <span className="text-[10px] text-[#9b8b84]">
                        {p.restrictions.length > 0
                          ? `Restrictions: ${p.restrictions.join(', ')}`
                          : 'No restrictions'}
                      </span>
                    </div>
                  </div>
                  <Plus size={16} className="text-[#f28a4b]" />
                </button>
              ))}
            </div>

            {/* Someone Else's Pet (Guest Pet Flow) */}
            <div className="pt-2 border-t border-[#e9ded2] dark:border-[#443a35]">
              {!isGuestMode ? (
                <button
                  type="button"
                  onClick={() => setIsGuestMode(true)}
                  className="w-full p-3 rounded-2xl border border-dashed border-[#e9ded2] text-xs font-bold text-[#f28a4b] flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>Someone else's pet (friend or neighbor)</span>
                </button>
              ) : (
                <form onSubmit={handleCreateGuestPetBowl} className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <b className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                      Friend's Pet Details
                    </b>
                    <button
                      type="button"
                      onClick={() => setIsGuestMode(false)}
                      className="text-[10px] text-[#9b8b84] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Pet Name (e.g. Leo)"
                    className="w-full h-11 px-3 rounded-xl bg-white dark:bg-[#302a27] border border-[#e9ded2] dark:border-[#443a35] text-xs outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGuestSpecies('dog')}
                      className={`h-9 rounded-xl font-bold text-xs border ${
                        guestSpecies === 'dog'
                          ? 'bg-[#dcedf3] text-[#326b7d] border-[#a9d2e2]'
                          : 'bg-white dark:bg-[#302a27] border-[#e9ded2]'
                      }`}
                    >
                      🐶 Dog
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestSpecies('cat')}
                      className={`h-9 rounded-xl font-bold text-xs border ${
                        guestSpecies === 'cat'
                          ? 'bg-[#f7e1e4] text-[#9a5261] border-[#eebfc6]'
                          : 'bg-white dark:bg-[#302a27] border-[#e9ded2]'
                      }`}
                    >
                      🐱 Cat
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#9b8b84] uppercase mb-1">
                      Dietary Restrictions
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALLERGY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleGuestRestriction(opt)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            guestRestrictions.includes(opt)
                              ? 'bg-[#3b2923] text-white border-transparent'
                              : 'bg-white dark:bg-[#302a27] text-[#6f5c54] border-[#e9ded2]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-xs font-bold"
                  >
                    Start Bowl for {guestName || 'Friend’s Pet'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
