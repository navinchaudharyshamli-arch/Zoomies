import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Order, CartItem } from '../types';
import { api } from '../lib';
import { useAuth } from '../context/AuthContext';
import { Check, Heart, QrCode, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ReceiptView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(
    (location.state as any)?.order || null
  );
  const [loading, setLoading] = useState(!order);
  const [saveBowlPetIndex, setSaveBowlPetIndex] = useState<number>(0);
  const [bowlNameInput, setBowlNameInput] = useState('');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fire celebratory confetti on first mount
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f28a4b', '#dcedf3', '#f7e1e4', '#3b2923'],
      });
    } catch (e) {
      // ignore
    }

    if (!order && id) {
      const fetchOrder = async () => {
        try {
          const list = await api.getOrders();
          const match = list.find((o) => o.id === id);
          if (match) setOrder(match);
        } catch (e) {
          console.error('Error fetching order receipt', e);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, order]);

  // Set default bowl name when pet changes
  useEffect(() => {
    if (order && order.groups && order.groups[saveBowlPetIndex]) {
      const currentGrp = order.groups[saveBowlPetIndex];
      setBowlNameInput(`${currentGrp.pet_name}'s usual`);
    }
  }, [order, saveBowlPetIndex]);

  const handleSaveBowl = async (grp: any) => {
    if (!user || !grp.pet_id || grp.items.length === 0) return;

    try {
      const firstItem = grp.items[0];
      const cartItem: CartItem = {
        cart_item_id: `saved-${Date.now()}`,
        menu_item: {
          id: firstItem.menu_item_id || 'saved-item',
          species: grp.pet_species,
          category: 'mains',
          name: firstItem.name,
          price: firstItem.price,
          emoji: '🍲',
          chicken: firstItem.is_chicken,
          is_available: true,
        },
        quantity: firstItem.quantity,
        selected_addons: firstItem.addons_snapshot || [],
        custom_notes: firstItem.custom_notes,
        item_total: firstItem.price,
        allergy_acknowledged: firstItem.allergy_acknowledged,
      };

      await api.saveBowl({
        user_id: user.id,
        pet_id: grp.pet_id,
        pet_name: grp.pet_name,
        name: bowlNameInput.trim() || `${grp.pet_name}'s usual`,
        bowl_data: cartItem,
      });

      setSavedSuccessMessage(`Saved to ${grp.pet_name}'s profile!`);
      setTimeout(() => setSavedSuccessMessage(null), 3000);
      setSaveBowlPetIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to save bowl', err);
    }
  };

  if (loading || !order) {
    return (
      <div className="p-8 text-center text-xs text-[#9b8b84]">
        Loading pass ticket receipt...
      </div>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentSaveGroup =
    order.groups && order.groups[saveBowlPetIndex] && order.groups[saveBowlPetIndex].pet_id
      ? order.groups[saveBowlPetIndex]
      : null;

  return (
    <div className="p-4 space-y-5">
      {/* Success Badge */}
      <div className="text-center space-y-1.5 pt-2">
        <div className="w-14 h-14 rounded-2xl bg-[#34775d] text-white flex items-center justify-center mx-auto shadow-md">
          <Check size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
          Order Confirmed!
        </h1>
        <p className="text-xs text-[#6f5c54] dark:text-[#c1b2a9]">
          The kitchen is reviewing your bowls right now.
        </p>
      </div>

      {/* PASS TICKET RECEIPT LOOK (With Notched Edges) */}
      <div className="relative bg-[#fffdf9] dark:bg-[#292421] rounded-3xl p-5 border border-[#e9ded2] dark:border-[#443a35] shadow-[0_10px_30px_rgba(59,41,35,0.08)]">
        {/* Ticket Left & Right Notches */}
        <div className="absolute top-28 -left-3 w-6 h-6 rounded-full bg-[#fbf6ed] dark:bg-[#1f1b19] border-r border-[#e9ded2] dark:border-[#443a35]" />
        <div className="absolute top-28 -right-3 w-6 h-6 rounded-full bg-[#fbf6ed] dark:bg-[#1f1b19] border-l border-[#e9ded2] dark:border-[#443a35]" />

        {/* Ticket Header */}
        <div className="flex justify-between items-start pb-4 border-b border-dashed border-[#e9ded2] dark:border-[#443a35]">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#9b8b84]">
              Pass Ticket
            </span>
            <b className="text-base text-[#3b2923] dark:text-[#f5ebe3] block font-extrabold">
              #{order.order_number}
            </b>
            <span className="text-[10px] text-[#9b8b84]">{orderDate}</span>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#9b8b84]">
              Slot
            </span>
            <b className="text-xs text-[#f28a4b] block font-extrabold">
              {order.slot_label}
            </b>
            <span className="text-[10px] text-[#6f5c54] dark:text-[#c1b2a9] uppercase font-bold">
              {order.type === 'delivery' ? '🛵 Delivery' : '☕ Takeaway'}
            </span>
          </div>
        </div>

        {/* Items per pet bowl */}
        <div className="py-4 space-y-4">
          {order.groups?.map((grp, gIdx) => (
            <div key={grp.id || gIdx} className="space-y-2">
              <div className="flex items-center justify-between">
                <b className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3] flex items-center gap-1.5">
                  <span>{grp.pet_species === 'dog' ? '🐶' : '🐱'}</span>
                  <span>{grp.pet_name}'s Bowl</span>
                </b>
              </div>

              {/* Restrictions Highlighted */}
              {grp.pet_restrictions && grp.pet_restrictions.length > 0 && (
                <div className="p-2 rounded-xl bg-[#fff0ee] dark:bg-[#412725] text-[#d43f39] text-[10px] font-bold flex items-center gap-1.5 border border-[#d43f39]/20">
                  <ShieldAlert size={12} className="shrink-0" />
                  <span>Dietary restrictions: {grp.pet_restrictions.join(', ')}</span>
                </div>
              )}

              {/* Items */}
              <div className="space-y-1.5 pl-2">
                {grp.items?.map((it, itIdx) => (
                  <div key={it.id || itIdx} className="flex justify-between text-xs">
                    <div>
                      <span className="text-[#3b2923] dark:text-[#f5ebe3] font-medium">
                        {it.quantity}x {it.name}
                      </span>
                      {it.is_chicken && (
                        <span className="text-[8px] font-bold text-[#d9692d] bg-[#fff0e5] ml-1 px-1 py-0.2 rounded">
                          Human-grade chicken
                        </span>
                      )}
                      {it.cake_name && (
                        <p className="text-[9px] text-[#f28a4b] font-bold">
                          Cake Name: "{it.cake_name}"
                        </p>
                      )}
                      {it.addons_snapshot && it.addons_snapshot.length > 0 && (
                        <p className="text-[9px] text-[#9b8b84]">
                          + {it.addons_snapshot.map((a: any) => `${a.name} (${a.grams}g)`).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-[#3b2923] dark:text-[#f5ebe3]">
                      ₹{it.price * it.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Totals & Payment Method */}
        <div className="border-t border-[#e9ded2] dark:border-[#443a35] pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-[#6f5c54] dark:text-[#c1b2a9]">
            <span>Payment Method</span>
            <span className="font-bold text-[#3b2923] dark:text-[#f5ebe3] uppercase">
              {order.payment_method === 'upi' ? 'UPI on Delivery/Pickup' : 'Cash'}
            </span>
          </div>
          <div className="flex justify-between text-[#6f5c54] dark:text-[#c1b2a9]">
            <span>Delivery Fee</span>
            <span className="font-bold text-[#3b2923] dark:text-[#f5ebe3]">
              {order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee}`}
            </span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-[#3b2923] dark:text-[#f5ebe3] pt-1">
            <span>Grand Total</span>
            <span>₹{order.total}</span>
          </div>
        </div>

        {/* QR-like SVG Code */}
        <div className="mt-4 pt-3 border-t border-dashed border-[#e9ded2] dark:border-[#443a35] flex items-center gap-3">
          <div className="w-14 h-14 bg-white dark:bg-[#1f1b19] p-1.5 rounded-xl border border-[#e9ded2] dark:border-[#443a35] flex items-center justify-center">
            <QrCode size={38} className="text-[#3b2923] dark:text-[#f5ebe3]" />
          </div>
          <div className="text-[10px] text-[#9b8b84]">
            <b className="text-[11px] text-[#3b2923] dark:text-[#f5ebe3] block font-bold">
              Show ticket at counter
            </b>
            <span>Order verified for kitchen preparation</span>
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET / PROMPT PER PET: "Save this bowl to Bruno's profile?" */}
      {currentSaveGroup && (
        <div className="p-4 rounded-3xl bg-[#fff0e5] dark:bg-[#3d2c24] border border-[#f28a4b]/30 space-y-2.5 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-[#f28a4b]" />
            <b className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
              Save this bowl to {currentSaveGroup.pet_name}'s profile?
            </b>
          </div>
          <p className="text-[10px] text-[#6f5c54] dark:text-[#c1b2a9]">
            Save as a 1-tap reorder favorite for future visits.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={bowlNameInput}
              onChange={(e) => setBowlNameInput(e.target.value)}
              placeholder="e.g. Bruno's usual"
              className="flex-1 h-10 px-3 rounded-xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3] outline-none"
            />
            <button
              type="button"
              onClick={() => handleSaveBowl(currentSaveGroup)}
              className="px-4 h-10 rounded-xl bg-[#f28a4b] text-white text-xs font-bold shadow-xs active:scale-95"
            >
              Save Bowl
            </button>
          </div>
          {savedSuccessMessage && (
            <p className="text-[10px] font-bold text-[#34775d]">
              ✓ {savedSuccessMessage}
            </p>
          )}
        </div>
      )}

      {/* Track Current Order CTA */}
      <button
        type="button"
        onClick={() => navigate('/orders')}
        className="w-full h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
      >
        <span>Track Live Order Status</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
