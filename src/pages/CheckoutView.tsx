import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../lib';
import { Address } from '../types';
import { CAFE_INFO } from '../config/menuData';
import {
  MapPin,
  Clock,
  Banknote,
  Smartphone,
  Navigation,
  ArrowLeft,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, subtotal, clearCart } = useCart();

  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('delivery');
  const [selectedSlot, setSelectedSlot] = useState<string>('ASAP (about 30 min)');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('upi');

  // Address fields
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [flat, setFlat] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [locating, setLocating] = useState(false);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Check if any item is a cake (cakes cannot be ASAP, must be 24hr lead time)
  const hasCake = groups.some((g) => g.items.some((it) => !!it.cake_name));

  // Time slots generator (30-min increments)
  const availableSlots: string[] = [];
  if (!hasCake) {
    availableSlots.push('ASAP (about 30 min)');
  }
  // Today remaining / Tomorrow slots
  availableSlots.push('Today 6:00 PM - 6:30 PM');
  availableSlots.push('Today 7:00 PM - 7:30 PM');
  availableSlots.push('Today 8:00 PM - 8:30 PM');
  availableSlots.push('Tomorrow 11:00 AM - 11:30 AM');
  availableSlots.push('Tomorrow 1:00 PM - 1:30 PM');
  availableSlots.push('Tomorrow 6:00 PM - 6:30 PM');
  if (hasCake) {
    availableSlots.push('In 24 Hours (Fresh Baked Slot)');
  }

  useEffect(() => {
    if (hasCake && selectedSlot.startsWith('ASAP')) {
      setSelectedSlot('Tomorrow 1:00 PM - 1:30 PM');
    }
  }, [hasCake]);

  // Load user saved addresses
  useEffect(() => {
    if (!user) return;
    const fetchAddresses = async () => {
      try {
        const list = await api.getAddresses(user.id);
        setSavedAddresses(list);
        if (list.length > 0) {
          const lastUsed = list[0];
          setName(lastUsed.name);
          setPhone(lastUsed.phone);
          setFlat(lastUsed.flat);
          setArea(lastUsed.area);
          setLandmark(lastUsed.landmark || '');
          setPincode(lastUsed.pincode);
        }
      } catch (e) {
        console.error('Error fetching addresses:', e);
      }
    };
    fetchAddresses();
  }, [user]);

  // GPS "Use my location" via free Nominatim reverse geocode
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data && data.address) {
            const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
            const city = data.address.city || data.address.town || 'Bengaluru';
            const code = data.address.postcode || '560038';
            setArea(`${road}, ${city}`);
            setPincode(code.replace(/[^0-9]/g, '').slice(0, 6));
            setGpsAddress(`GPS pinned: ${data.display_name.slice(0, 50)}...`);
          }
        } catch (e) {
          console.warn('Reverse geocode note:', e);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
      }
    );
  };

  const deliveryFee = orderType === 'takeaway' || subtotal >= 300 ? 0 : 30;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || groups.length === 0) return;

    // Validate 6-digit Indian pincode if delivery
    if (orderType === 'delivery') {
      if (!/^\d{6}$/.test(pincode.trim())) {
        alert('Please enter a valid 6-digit Indian PIN code.');
        return;
      }
      if (!phone.trim() || phone.trim().length < 10) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setSubmitting(true);
    try {
      let addressSnapshot: Address | null = null;
      if (orderType === 'delivery') {
        addressSnapshot = {
          id: `addr-${Date.now()}`,
          user_id: user.id,
          label: 'Home',
          name: name.trim(),
          phone: phone.trim(),
          flat: flat.trim(),
          area: area.trim(),
          landmark: landmark.trim(),
          pincode: pincode.trim(),
        };
        // Save to user address book for future preselection
        await api.saveAddress(addressSnapshot);
      }

      const order = await api.createOrder({
        customerId: user.id,
        customerName: name.trim() || user.full_name || 'Pet Parent',
        customerPhone: phone.trim() || user.phone || '9876543210',
        type: orderType,
        slotStart: new Date().toISOString(),
        slotLabel: selectedSlot,
        paymentMethod,
        addressSnapshot,
        groups,
        subtotal,
        deliveryFee,
        total: grandTotal,
      });

      clearCart();
      navigate(`/receipt/${order.id}`, { state: { order, isNew: true } });
    } catch (err: any) {
      alert(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] flex items-center justify-center text-[#3b2923] dark:text-[#f5ebe3]"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f28a4b] block">
            Step 3 of 3
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3b2923] dark:text-[#f5ebe3]">
            Checkout
          </h1>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="space-y-5">
        {/* Delivery / Takeaway Segmented Control */}
        <div className="h-12 rounded-2xl bg-[#f3eadc] dark:bg-[#292421] p-1 grid grid-cols-2 gap-1 border border-[#e9ded2] dark:border-[#443a35]">
          <button
            type="button"
            onClick={() => setOrderType('delivery')}
            className={`rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'delivery'
                ? 'bg-white dark:bg-[#302a27] text-[#3b2923] dark:text-[#f5ebe3] shadow-xs'
                : 'text-[#6f5c54] dark:text-[#c1b2a9]'
            }`}
          >
            <span>🛵 Home Delivery</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderType('takeaway')}
            className={`rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              orderType === 'takeaway'
                ? 'bg-white dark:bg-[#302a27] text-[#3b2923] dark:text-[#f5ebe3] shadow-xs'
                : 'text-[#6f5c54] dark:text-[#c1b2a9]'
            }`}
          >
            <span>☕ Cafe Takeaway</span>
          </button>
        </div>

        {/* Time Slot Picker */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#3b2923] dark:text-[#f5ebe3] flex items-center gap-1.5">
            <Clock size={14} className="text-[#f28a4b]" />
            Select Preparation Slot
          </label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3] outline-none"
          >
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Address OR Takeaway Info */}
        {orderType === 'delivery' ? (
          <div className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3b2923] dark:text-[#f5ebe3] flex items-center gap-1.5">
                <MapPin size={14} className="text-[#f28a4b]" />
                Delivery Address
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="text-[11px] font-bold text-[#f28a4b] hover:underline flex items-center gap-1"
              >
                <Navigation size={12} />
                <span>{locating ? 'Locating...' : 'Use my GPS'}</span>
              </button>
            </div>

            {gpsAddress && (
              <p className="text-[10px] text-[#34775d] bg-[#34775d]/10 p-2 rounded-lg">
                {gpsAddress}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Receiver Name"
                className="h-10 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] text-xs outline-none"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit Phone"
                className="h-10 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] text-xs outline-none"
              />
            </div>

            <input
              type="text"
              required
              value={flat}
              onChange={(e) => setFlat(e.target.value)}
              placeholder="House / Flat / Building No."
              className="w-full h-10 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] text-xs outline-none"
            />

            <input
              type="text"
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Street / Area / Colony"
              className="w-full h-10 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] text-xs outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Landmark (Optional)"
                className="h-10 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] text-xs outline-none"
              />
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="6-digit Pincode"
                className="h-10 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#443a35] text-xs outline-none"
              />
            </div>
          </div>
        ) : (
          /* Cafe Takeaway Location Card */
          <div className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] space-y-2">
            <b className="text-xs font-extrabold text-[#3b2923] dark:text-[#f5ebe3] block">
              {CAFE_INFO.name}
            </b>
            <p className="text-xs text-[#6f5c54] dark:text-[#c1b2a9]">
              {CAFE_INFO.address}
            </p>
            <p className="text-[11px] text-[#9b8b84]">
              Phone: {CAFE_INFO.phone}
            </p>
            <a
              href={CAFE_INFO.maps_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#f28a4b] hover:underline pt-1"
            >
              <MapPin size={12} /> View Cafe on Google Maps
            </a>
          </div>
        )}

        {/* Payment Simulated Selection */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#292421] border border-[#e9ded2] dark:border-[#443a35] space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#3b2923] dark:text-[#f5ebe3]">
            Payment (Pay at Delivery/Pickup)
          </label>
          <p className="text-[10px] text-[#9b8b84]">
            Simulated checkout for prototype. No real money moves.
          </p>

          <div className="space-y-2">
            <div
              onClick={() => setPaymentMethod('upi')}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'upi'
                  ? 'bg-[#fff0e5] dark:bg-[#3d2c24] border-[#f28a4b]'
                  : 'bg-white dark:bg-[#302a27] border-[#e9ded2] dark:border-[#443a35]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone size={18} className="text-[#f28a4b]" />
                <div>
                  <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-bold">
                    UPI QR on Delivery / Pickup
                  </b>
                  <span className="text-[10px] text-[#9b8b84]">
                    GPay, PhonePe, Paytm
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'upi' ? 'border-[#f28a4b] bg-[#f28a4b] text-white' : 'border-[#e9ded2]'
                }`}
              >
                {paymentMethod === 'upi' && <Check size={12} />}
              </div>
            </div>

            <div
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-[#fff0e5] dark:bg-[#3d2c24] border-[#f28a4b]'
                  : 'bg-white dark:bg-[#302a27] border-[#e9ded2] dark:border-[#443a35]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Banknote size={18} className="text-[#34775d]" />
                <div>
                  <b className="text-xs text-[#3b2923] dark:text-[#f5ebe3] block font-bold">
                    Cash on Delivery / Pickup
                  </b>
                  <span className="text-[10px] text-[#9b8b84]">
                    Exact cash preferred
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'cash' ? 'border-[#f28a4b] bg-[#f28a4b] text-white' : 'border-[#e9ded2]'
                }`}
              >
                {paymentMethod === 'cash' && <Check size={12} />}
              </div>
            </div>
          </div>
        </div>

        {/* Place Order CTA */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-13 rounded-2xl bg-[#3b2923] dark:bg-[#f28a4b] text-white font-bold text-sm flex items-center justify-between px-6 shadow-md active:scale-95 transition-all disabled:opacity-50"
        >
          <span>{submitting ? 'Placing Order...' : 'Place Order'}</span>
          <span>₹{grandTotal}</span>
        </button>
      </form>
    </div>
  );
};
