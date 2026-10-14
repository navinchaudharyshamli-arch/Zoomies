import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../lib';
import { Order, Rating } from '../types';
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  ChefHat,
  XCircle,
  Star,
  RotateCcw,
  Bell,
} from 'lucide-react';

export const OrdersView: React.FC = () => {
  const { user } = useAuth();
  const { addItemToBowl } = useCart();
  const { notifications, markAsRead } = useNotifications();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratedOrders, setRatedOrders] = useState<Record<string, number>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const list = await api.getOrders({ customerId: user.id });
      setOrders(list);

      // Check existing ratings
      for (const ord of list.filter((o) => o.status === 'completed')) {
        const rat = await api.getRating(ord.id);
        if (rat) {
          setRatedOrders((prev) => ({ ...prev, [ord.id]: rat.rating }));
        }
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to live order status updates
    const unsubscribe = api.subscribeToOrders((updatedOrder) => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === updatedOrder.id);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...updatedOrder };
          return copy;
        }
        return [updatedOrder, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const activeOrder = orders.find(
    (o) => !['completed', 'cancelled', 'rejected'].includes(o.status)
  );

  const pastOrders = orders.filter((o) =>
    ['completed', 'cancelled', 'rejected'].includes(o.status)
  );

  // Check 2-minute cancellation rule
  const canCancel = (order: Order) => {
    if (order.status !== 'received') return false;
    const createdAtTime = new Date(order.created_at).getTime();
    const now = Date.now();
    return now - createdAtTime < 2 * 60 * 1000;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      await api.cancelOrder(orderId, 'Cancelled by customer within 2 minutes');
      await fetchOrders();
    } catch (e: any) {
      alert(e.message || 'Cannot cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = (order: Order) => {
    if (!order.groups) return;
    order.groups.forEach((grp) => {
      grp.items.forEach((it) => {
        addItemToBowl(
          {
            id: grp.pet_id,
            name: grp.pet_name,
            species: grp.pet_species,
            restrictions: grp.pet_restrictions,
          },
          {
            cart_item_id: `reorder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            menu_item: {
              id: it.menu_item_id || 'item',
              species: grp.pet_species,
              category: 'mains',
              name: it.name,
              price: it.price,
              emoji: '🍲',
              chicken: it.is_chicken,
              is_available: true,
            },
            quantity: it.quantity,
            cake_name: it.cake_name,
            selected_addons: it.addons_snapshot || [],
            custom_notes: it.custom_notes,
            item_total: it.price,
            allergy_acknowledged: it.allergy_acknowledged,
          }
        );
      });
    });
    alert('Items added back to your cart!');
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingOrder || !user) return;

    try {
      await api.submitRating({
        orderId: ratingOrder.id,
        customerId: user.id,
        rating: selectedStars,
        feedback: feedbackText,
      });
      setRatedOrders((prev) => ({ ...prev, [ratingOrder.id]: selectedStars }));
      setRatingOrder(null);
      setFeedbackText('');
    } catch (e: any) {
      alert('Rating submitted or already recorded.');
      setRatingOrder(null);
    }
  };

  // Helper for progress tracker steps
  const getStepProgress = (status: Order['status'], type: 'delivery' | 'takeaway') => {
    const steps = [
      { key: 'received', label: 'Order Received' },
      { key: 'accepted', label: 'Accepted by Cafe' },
      { key: 'cooking', label: 'Food Being Made' },
      { key: 'packed', label: 'Meal Packed' },
      {
        key: type === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup',
        label: type === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup',
      },
      { key: 'completed', label: type === 'delivery' ? 'Delivered' : 'Picked Up' },
    ];

    const orderIndex = steps.findIndex((s) => s.key === status);
    return { steps, currentIndex: orderIndex >= 0 ? orderIndex : 0 };
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f28a4b] block">
          Live Status & History
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3]">
          Your Orders
        </h1>
      </div>

      {/* ACTIVE ORDER PROGRESS TRACKER */}
      {activeOrder && (
        <div className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#f28a4b] shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-extrabold">
                Active Order #{activeOrder.order_number}
              </b>
              <span className="text-[10px] text-[#f28a4b] font-bold">
                Slot: {activeOrder.slot_label}
              </span>
            </div>

            {canCancel(activeOrder) && (
              <button
                type="button"
                onClick={() => handleCancelOrder(activeOrder.id)}
                disabled={cancellingId === activeOrder.id}
                className="px-2.5 py-1 rounded-xl bg-[#fff0ee] dark:bg-[#412725] text-[#d43f39] text-[10px] font-extrabold hover:bg-[#d43f39] hover:text-white transition-colors"
              >
                {cancellingId === activeOrder.id ? 'Cancelling...' : 'Cancel (2 min)'}
              </button>
            )}
          </div>

          {/* Stepper Steps */}
          {(() => {
            const { steps, currentIndex } = getStepProgress(
              activeOrder.status,
              activeOrder.type
            );
            return (
              <div className="space-y-3 pt-2">
                {steps.map((st, idx) => {
                  const isDone = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  return (
                    <div key={st.key} className="flex items-start gap-3 relative">
                      {/* Line connector */}
                      {idx < steps.length - 1 && (
                        <div
                          className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-3 ${
                            idx < currentIndex ? 'bg-[#f28a4b]' : 'bg-[#e9ded2] dark:bg-[#443a35]'
                          }`}
                        />
                      )}

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all z-10 ${
                          isDone
                            ? 'bg-[#f28a4b] text-white'
                            : 'bg-[#f3eadc] dark:bg-[#1f1b19] text-[#9b8b84] border border-[#e9ded2] dark:border-[#443a35]'
                        } ${isCurrent ? 'ring-4 ring-[#f28a4b]/20 scale-105' : ''}`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>

                      <div className="pt-0.5">
                        <b
                          className={`text-xs block ${
                            isCurrent
                              ? 'text-[#f28a4b] font-extrabold'
                              : isDone
                              ? 'text-[#3b2923] dark:text-[#f5ebe3] font-bold'
                              : 'text-[#9b8b84]'
                          }`}
                        >
                          {st.label}
                        </b>
                        {isCurrent && (
                          <span className="text-[10px] text-[#f28a4b] font-medium">
                            In progress...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* NOTIFICATIONS LIST */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9b8b84] flex items-center gap-1.5">
            <Bell size={13} className="text-[#f28a4b]" />
            Kitchen Updates
          </h2>

          <div className="space-y-2">
            {notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-colors ${
                  n.read
                    ? 'bg-white/60 dark:bg-[#292421]/60 border-[#e9ded2] dark:border-[#443a35] opacity-75'
                    : 'bg-white dark:bg-[#292421] border-[#f28a4b] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] font-bold">
                    {n.title}
                  </b>
                  <span className="text-[9px] text-[#9b8b84]">
                    {new Date(n.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-[#6f5c54] dark:text-[#c1b2a9] mt-0.5">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAST ORDERS */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#9b8b84]">
          Past Orders
        </h2>

        {pastOrders.length === 0 && !activeOrder && (
          <p className="text-xs text-[#9b8b84] py-4 text-center">
            No past orders yet. Place a bowl to get started!
          </p>
        )}

        {pastOrders.map((ord) => {
          const userRating = ratedOrders[ord.id];

          return (
            <div
              key={ord.id}
              className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-bold">
                    #{ord.order_number}
                  </b>
                  <span className="text-[10px] text-[#9b8b84]">
                    {new Date(ord.created_at).toLocaleDateString()} • ₹{ord.total}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    ord.status === 'completed'
                      ? 'bg-[#34775d]/10 text-[#34775d]'
                      : 'bg-[#d43f39]/10 text-[#d43f39]'
                  }`}
                >
                  {ord.status}
                </span>
              </div>

              {/* Items summary */}
              <div className="text-[11px] text-[#6f5c54] dark:text-[#c1b2a9]">
                {ord.groups?.map((g) => (
                  <span key={g.id || g.pet_name} className="block">
                    • {g.pet_name}'s Bowl: {g.items.map((i) => i.name).join(', ')}
                  </span>
                ))}
              </div>

              {/* Actions: Order Again & Rating */}
              <div className="flex items-center justify-between pt-2 border-t border-[#e9ded2] dark:border-[#443a35]">
                {ord.status === 'completed' && (
                  <div>
                    {userRating ? (
                      <div className="flex items-center gap-1 text-[#f28a4b] text-xs font-bold">
                        <Star size={13} fill="#f28a4b" />
                        <span>Rated {userRating}/5</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRatingOrder(ord)}
                        className="text-xs font-bold text-[#f28a4b] hover:underline flex items-center gap-1"
                      >
                        <Star size={13} />
                        <span>Rate Meal</span>
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleReorder(ord)}
                  className="px-3 py-1.5 rounded-xl bg-[#f3eadc] dark:bg-[#3d2c24] text-[#3b2923] dark:text-[#f5ebe3] text-xs font-bold flex items-center gap-1.5 active:scale-95 ml-auto"
                >
                  <RotateCcw size={12} />
                  <span>Order again</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating Bottom Sheet */}
      {ratingOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-[430px] bg-[#fffdf9] dark:bg-[#292421] rounded-t-3xl p-5 space-y-4 animate-in fade-in">
            <h2 className="text-base font-extrabold text-[#3b2923] dark:text-[#f5ebe3] text-center">
              How did your pet like the meal?
            </h2>
            <p className="text-xs text-[#9b8b84] text-center">
              Order #{ratingOrder.order_number}
            </p>

            {/* 1-5 Stars */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStars(star)}
                  className="p-1 text-2xl transition-transform active:scale-125"
                >
                  <Star
                    size={32}
                    className={
                      star <= selectedStars
                        ? 'text-[#f28a4b] fill-[#f28a4b]'
                        : 'text-[#e9ded2]'
                    }
                  />
                </button>
              ))}
            </div>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Any feedback for the chef?"
              rows={3}
              className="w-full p-3 rounded-xl bg-white dark:bg-[#302a27] border border-[#e9ded2] dark:border-[#443a35] text-xs outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRatingOrder(null)}
                className="h-11 rounded-xl border border-[#e9ded2] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRating}
                className="h-11 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-xs font-bold"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
