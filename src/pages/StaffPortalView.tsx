import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib';
import { Order, Profile, MenuItem, Addon, AppSettings } from '../types';
import { TestBanner } from '../components/TestBanner';
import {
  Bell,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Users,
  CheckSquare,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  LogOut,
  Utensils,
  Moon,
  Sun,
  Copy,
  Plus,
} from 'lucide-react';

export const StaffPortalView: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'accounts' | 'checklist' | 'settings'>('orders');
  const [orderFilter, setOrderFilter] = useState<'active' | 'today' | 'delivery' | 'takeaway' | 'completed'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  // Admin states
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('password123');
  const [newUserRole, setNewUserRole] = useState<'customer' | 'staff'>('customer');
  const [seedSampleData, setSeedSampleData] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Checklist state
  const checklistItems = [
    { id: 'c1', label: 'Customer onboarding flow (woof/meow audio cards & breed search)' },
    { id: 'c2', label: 'Allergy warning banner notification & confirmation sheet' },
    { id: 'c3', label: 'Add-ons stepper in grams (50g increments, running live price)' },
    { id: 'c4', label: 'Birthday Paw-cake preview updating live as typed with candle' },
    { id: 'c5', label: 'Multi-pet cart with separate bowl groups & restrictions per bowl' },
    { id: 'c6', label: 'Delivery with GPS location & Takeaway slot picker' },
    { id: 'c7', label: 'Notched pass ticket receipt with QR SVG code' },
    { id: 'c8', label: 'Save bowl to pet profile & 1-tap reorder' },
    { id: 'c9', label: 'Staff status taps (instant realtime update on customer phone)' },
    { id: 'c10', label: 'Realtime customer notifications on staff taps' },
    { id: 'c11', label: 'Cancel within 2 minutes restriction testing' },
    { id: 'c12', label: '1-5 star post-delivery meal rating' },
  ];
  const [checkedChecklist, setCheckedChecklist] = useState<string[]>([]);

  // Menu items & Addons for Admin editing
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  const isAdmin = user?.role === 'admin';

  // Sound notification player
  const playNewOrderChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // Audio autoplay policy
    }
  };

  const loadAllData = async () => {
    try {
      const [ordList, menu, addns, sett] = await Promise.all([
        api.getOrders(),
        api.getMenuItems(),
        api.getAddons(),
        api.getSettings(),
      ]);
      setOrders(ordList);
      setMenuItems(menu);
      setAddons(addns);
      setAppSettings(sett);

      if (user && isAdmin) {
        const [uList, progress] = await Promise.all([
          api.listUsers(),
          api.getChecklistProgress(user.id),
        ]);
        setUsersList(uList);
        setCheckedChecklist(progress);
      }
    } catch (e) {
      console.error('Error loading staff portal data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Subscribe to new incoming orders in realtime
    const unsubscribe = api.subscribeToOrders((newOrder) => {
      setOrders((prev) => {
        const existingIdx = prev.findIndex((o) => o.id === newOrder.id);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = newOrder;
          return updated;
        }
        playNewOrderChime();
        return [newOrder, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Order status transition buttons in order
  const handleUpdateStatus = async (orderId: string, nextStatus: Order['status']) => {
    try {
      const updated = await api.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e: any) {
      alert(e.message || 'Status update failed');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Reason for declining this order:', 'Kitchen capacity full for this time slot');
    if (!reason) return;
    try {
      const updated = await api.updateOrderStatus(orderId, 'rejected', reason);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e: any) {
      alert(e.message || 'Failed to reject order');
    }
  };

  const handlePrintTicket = (order: Order) => {
    window.print();
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'active') {
      return !['completed', 'cancelled', 'rejected'].includes(o.status);
    }
    if (orderFilter === 'today') {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today;
    }
    if (orderFilter === 'delivery') return o.type === 'delivery';
    if (orderFilter === 'takeaway') return o.type === 'takeaway';
    if (orderFilter === 'completed') return o.status === 'completed';
    return true;
  });

  // Admin User Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    try {
      const created = await api.adminCreateUser({
        email: newUserEmail.trim(),
        password: newUserPass,
        fullName: newUserName.trim() || 'Test User',
        role: newUserRole,
      });

      if (seedSampleData && newUserRole === 'customer') {
        await api.seedSamplePetsAndOrders(created.id);
      }

      alert(`Account created: ${created.email}`);
      setNewUserName('');
      setNewUserEmail('');
      const updated = await api.listUsers();
      setUsersList(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const copyCredentials = (email: string, pass: string = 'password123') => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${pass}`);
    setCopiedText(email);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleToggleDisable = async (userId: string, currentDisabled: boolean) => {
    try {
      await api.adminToggleDisable(userId, !currentDisabled);
      const updated = await api.listUsers();
      setUsersList(updated);
    } catch (e: any) {
      alert(e.message || 'Failed to disable/enable user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user account?')) return;
    try {
      await api.adminDeleteUser(userId);
      const updated = await api.listUsers();
      setUsersList(updated);
    } catch (e: any) {
      alert(e.message || 'Failed to delete user');
    }
  };

  const handleResetTestData = async () => {
    if (!confirm('⚠️ Delete all orders, notifications, and ratings? (Accounts, pets, and menu will be kept)')) return;
    try {
      await api.resetTestData();
      setOrders([]);
      alert('Test orders, ratings and notifications have been cleanly reset.');
    } catch (e: any) {
      alert('Reset failed: ' + e.message);
    }
  };

  const toggleChecklist = async (id: string) => {
    if (!user) return;
    const next = checkedChecklist.includes(id)
      ? checkedChecklist.filter((c) => c !== id)
      : [...checkedChecklist, id];
    setCheckedChecklist(next);
    await api.saveChecklistProgress(user.id, next);
  };

  return (
    <div className="min-h-screen bg-[#f5f1eb] dark:bg-[#1a1715] text-[#3b2923] dark:text-[#f5ebe3] flex flex-col">
      <TestBanner />

      {/* Staff / Admin Tablet Navigation Bar */}
      <header className="h-16 px-6 bg-white dark:bg-[#25201d] border-b border-[#e9ded2] dark:border-[#3d3531] flex items-center justify-between sticky top-8 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f28a4b] text-white flex items-center justify-center font-bold text-lg -rotate-3">
            🐾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <b className="text-sm tracking-tight font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                Zoomies Kitchen Console
              </b>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34775d]/10 text-[#34775d] text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34775d] animate-pulse" />
                Live Realtime
              </span>
            </div>
            <span className="text-[10px] text-[#9b8b84]">
              Logged in as {user?.full_name || user?.email} ({user?.role})
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-[#3b2923] dark:bg-[#f28a4b] text-white shadow-xs'
                : 'text-[#6f5c54] dark:text-[#c1b2a9] hover:bg-[#f3eadc] dark:hover:bg-[#302a27]'
            }`}
          >
            Orders ({orders.filter((o) => !['completed', 'cancelled', 'rejected'].includes(o.status)).length})
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('accounts')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'accounts'
                    ? 'bg-[#3b2923] dark:bg-[#f28a4b] text-white shadow-xs'
                    : 'text-[#6f5c54] dark:text-[#c1b2a9] hover:bg-[#f3eadc] dark:hover:bg-[#302a27]'
                }`}
              >
                Test Accounts
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'checklist'
                    ? 'bg-[#3b2923] dark:bg-[#f28a4b] text-white shadow-xs'
                    : 'text-[#6f5c54] dark:text-[#c1b2a9] hover:bg-[#f3eadc] dark:hover:bg-[#302a27]'
                }`}
              >
                Tester Checklist ({checkedChecklist.length}/{checklistItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-[#3b2923] dark:bg-[#f28a4b] text-white shadow-xs'
                    : 'text-[#6f5c54] dark:text-[#c1b2a9] hover:bg-[#f3eadc] dark:hover:bg-[#302a27]'
                }`}
              >
                Admin Menu & Fees
              </button>
            </>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-9 h-9 rounded-xl border border-[#e9ded2] dark:border-[#3d3531] flex items-center justify-center text-[#6f5c54] dark:text-[#c1b2a9] hover:bg-white transition-colors"
            title={soundEnabled ? 'Order sound ON' : 'Order sound MUTED'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-[#e9ded2] dark:border-[#3d3531] flex items-center justify-center text-[#6f5c54] dark:text-[#c1b2a9] hover:bg-white transition-colors"
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Customer App Link */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3 py-1.5 rounded-xl border border-[#e9ded2] dark:border-[#3d3531] text-xs font-bold text-[#6f5c54] dark:text-[#c1b2a9] hover:bg-white"
          >
            Customer View
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-9 h-9 rounded-xl border border-[#d43f39]/30 text-[#d43f39] flex items-center justify-center hover:bg-[#fff0ee]"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        {/* TAB 1: ORDERS CONSOLE */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#25201d] p-1 rounded-2xl border border-[#e9ded2] dark:border-[#3d3531] shadow-2xs">
                {(['active', 'today', 'delivery', 'takeaway', 'completed'] as const).map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setOrderFilter(flt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      orderFilter === flt
                        ? 'bg-[#3b2923] dark:bg-[#f28a4b] text-white shadow-2xs'
                        : 'text-[#6f5c54] dark:text-[#c1b2a9]'
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleResetTestData}
                  className="px-3.5 py-1.5 rounded-xl bg-[#fff0ee] dark:bg-[#412725] text-[#d43f39] text-xs font-bold hover:bg-[#d43f39] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Reset Test Data</span>
                </button>
              )}
            </div>

            {/* Orders Grid */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#25201d] rounded-3xl border border-[#e9ded2] dark:border-[#3d3531] text-[#9b8b84] text-xs">
                No orders found under "{orderFilter}".
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => {
                  const isNewOrder = order.status === 'received';

                  // Compile restrictions for banners
                  const allRestrictions = order.restrictions_snapshot || [];

                  return (
                    <div
                      key={order.id}
                      className={`bg-white dark:bg-[#25201d] rounded-3xl border shadow-md overflow-hidden transition-all ${
                        isNewOrder
                          ? 'border-[#f28a4b] ring-4 ring-[#f28a4b]/20 animate-pulse'
                          : 'border-[#e9ded2] dark:border-[#3d3531]'
                      }`}
                    >
                      {/* 1. CRITICAL SPEC REQUIREMENT: RED RESTRICTIONS BANNER AT THE VERY TOP */}
                      <div className="bg-[#d43f39] text-white px-5 py-2.5 flex items-center justify-between text-xs font-extrabold tracking-wider uppercase">
                        <div className="flex items-center gap-2">
                          <ShieldAlert size={16} />
                          <span>
                            RESTRICTIONS (KITCHEN ALERT):{' '}
                            {allRestrictions.length > 0
                              ? allRestrictions
                                  .map(
                                    (r) =>
                                      `${r.pet_name}: ${
                                        r.restrictions && r.restrictions.length > 0
                                          ? r.restrictions.join(', ')
                                          : 'None'
                                      }`
                                  )
                                  .join(' | ')
                              : 'None'}
                          </span>
                        </div>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
                          Top Warning
                        </span>
                      </div>

                      {/* Order Header */}
                      <div className="p-5 border-b border-[#e9ded2] dark:border-[#3d3531] flex items-center justify-between bg-[#faf8f4] dark:bg-[#201c1a]">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {order.type === 'delivery' ? '🛵' : '☕'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-base font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                                Order #{order.order_number}
                              </h2>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#f28a4b] text-white text-[10px] font-bold uppercase">
                                {order.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <span className="text-xs text-[#6f5c54] dark:text-[#c1b2a9]">
                              Slot: <strong className="text-[#f28a4b]">{order.slot_label}</strong> • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePrintTicket(order)}
                            className="px-3 py-1.5 rounded-xl border border-[#e9ded2] dark:border-[#3d3531] bg-white dark:bg-[#292421] text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3] flex items-center gap-1.5 hover:bg-[#f3eadc]"
                          >
                            <Printer size={13} />
                            <span>Print Ticket</span>
                          </button>
                        </div>
                      </div>

                      {/* Order Details: Pet-wise items, Add-ons with grams, cake name, notes */}
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bowls Column */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9b8b84]">
                            Prepared Bowls
                          </h3>

                          {order.groups?.map((grp, gIdx) => (
                            <div
                              key={grp.id || gIdx}
                              className="p-3.5 rounded-2xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#3d3531] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <b className="text-xs font-bold text-[#3b2923] dark:text-[#f5ebe3] flex items-center gap-1.5">
                                  <span>{grp.pet_species === 'dog' ? '🐶' : '🐱'}</span>
                                  <span>{grp.pet_name}'s Bowl</span>
                                </b>
                                {grp.pet_restrictions.length > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-[#fff0ee] text-[#d43f39] text-[9px] font-extrabold">
                                    Allergic: {grp.pet_restrictions.join(', ')}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1.5 pt-1">
                                {grp.items.map((it, itIdx) => (
                                  <div
                                    key={it.id || itIdx}
                                    className="p-2 rounded-xl bg-white dark:bg-[#25201d] text-xs flex justify-between items-start"
                                  >
                                    <div>
                                      <div className="font-bold text-[#3b2923] dark:text-[#f5ebe3] flex items-center gap-1">
                                        <span>{it.quantity}x {it.name}</span>
                                        {it.is_chicken && (
                                          <span className="text-[8px] bg-[#fff0e5] text-[#d9692d] px-1 py-0.2 rounded font-bold">
                                            Human-grade chicken
                                          </span>
                                        )}
                                      </div>

                                      {it.cake_name && (
                                        <p className="text-[10px] text-[#f28a4b] font-extrabold">
                                          🎂 Name on Cake: "{it.cake_name}"
                                        </p>
                                      )}

                                      {it.removed_ingredients && it.removed_ingredients.length > 0 && (
                                        <p className="text-[10px] bg-[#fff0ee] dark:bg-[#412725] text-[#d43f39] px-2 py-0.5 rounded font-extrabold mt-0.5">
                                          ⚠️ EXCLUDE INGREDIENTS: {it.removed_ingredients.join(', ')}
                                        </p>
                                      )}

                                      {it.addons_snapshot && it.addons_snapshot.length > 0 && (
                                        <p className="text-[10px] text-[#6f5c54] dark:text-[#c1b2a9]">
                                          + {it.addons_snapshot.map((a: any) => `${a.name} (${a.grams}g)`).join(', ')}
                                        </p>
                                      )}

                                      {it.custom_notes && (
                                        <p className="text-[10px] text-[#d43f39] font-semibold italic">
                                          Note: {it.custom_notes}
                                        </p>
                                      )}
                                    </div>
                                    <span className="font-bold">₹{it.price * it.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Customer & Delivery Column */}
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9b8b84]">
                            Delivery & Customer
                          </h3>

                          <div className="p-3.5 rounded-2xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#3d3531] space-y-2 text-xs">
                            <div>
                              <span className="text-[10px] text-[#9b8b84] block">Customer</span>
                              <b className="text-[#3b2923] dark:text-[#f5ebe3]">
                                {order.customer_name}
                              </b>
                              <span className="text-[11px] text-[#6f5c54] dark:text-[#c1b2a9] block">
                                Phone: {order.customer_phone}
                              </span>
                            </div>

                            {order.type === 'delivery' && order.address_snapshot && (
                              <div className="pt-2 border-t border-[#e9ded2] dark:border-[#3d3531]">
                                <span className="text-[10px] text-[#9b8b84] block">Drop Address</span>
                                <p className="text-[#3b2923] dark:text-[#f5ebe3] text-xs">
                                  {order.address_snapshot.flat}, {order.address_snapshot.area}
                                  {order.address_snapshot.landmark && ` (Near ${order.address_snapshot.landmark})`}
                                  <br />
                                  PIN: {order.address_snapshot.pincode}
                                </p>
                              </div>
                            )}

                            <div className="pt-2 border-t border-[#e9ded2] dark:border-[#3d3531] flex justify-between">
                              <span className="text-[#9b8b84]">Payment</span>
                              <span className="font-bold uppercase text-[#3b2923] dark:text-[#f5ebe3]">
                                {order.payment_method === 'upi' ? 'UPI (QR at Door)' : 'Cash'} • Total ₹{order.total}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. CRITICAL SPEC REQUIREMENT: RED RESTRICTIONS BANNER REPEATED AT THE VERY END */}
                      <div className="bg-[#d43f39] text-white px-5 py-2.5 flex items-center justify-between text-xs font-extrabold tracking-wider uppercase">
                        <div className="flex items-center gap-2">
                          <ShieldAlert size={16} />
                          <span>
                            RESTRICTIONS (VERIFY BEFORE PACKING):{' '}
                            {allRestrictions.length > 0
                              ? allRestrictions
                                  .map(
                                    (r) =>
                                      `${r.pet_name}: ${
                                        r.restrictions && r.restrictions.length > 0
                                          ? r.restrictions.join(', ')
                                          : 'None'
                                      }`
                                  )
                                  .join(' | ')
                              : 'None'}
                          </span>
                        </div>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
                          Bottom Verification
                        </span>
                      </div>

                      {/* Status Action Buttons in Exact Spec Order: Accept, Start making, Packed, Out for delivery / Ready for pickup, Complete */}
                      <div className="p-4 bg-[#faf8f4] dark:bg-[#201c1a] border-t border-[#e9ded2] dark:border-[#3d3531] flex flex-wrap items-center gap-2">
                        {order.status === 'received' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'accepted')}
                              className="px-5 h-11 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-xs font-bold active:scale-95 shadow-sm"
                            >
                              1. Accept Order
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectOrder(order.id)}
                              className="px-4 h-11 rounded-xl bg-[#fff0ee] text-[#d43f39] text-xs font-bold hover:bg-[#d43f39] hover:text-white transition-colors"
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {order.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'cooking')}
                            className="px-5 h-11 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-xs font-bold active:scale-95 shadow-sm"
                          >
                            2. Start Making Food
                          </button>
                        )}

                        {order.status === 'cooking' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'packed')}
                            className="px-5 h-11 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-xs font-bold active:scale-95 shadow-sm"
                          >
                            3. Packed & Sealed
                          </button>
                        )}

                        {order.status === 'packed' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(
                                order.id,
                                order.type === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
                              )
                            }
                            className="px-5 h-11 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-xs font-bold active:scale-95 shadow-sm"
                          >
                            4. {order.type === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}
                          </button>
                        )}

                        {(order.status === 'out_for_delivery' || order.status === 'ready_for_pickup') && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="px-5 h-11 rounded-xl bg-[#34775d] text-white text-xs font-bold active:scale-95 shadow-sm"
                          >
                            5. Complete Order
                          </button>
                        )}

                        {order.status === 'completed' && (
                          <span className="text-xs font-bold text-[#34775d] flex items-center gap-1">
                            <CheckCircle size={15} /> Order Completed
                          </span>
                        )}

                        {order.status === 'rejected' && (
                          <span className="text-xs font-bold text-[#d43f39] flex items-center gap-1">
                            <XCircle size={15} /> Declined: {order.rejection_reason}
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="text-xs font-bold text-[#d43f39] flex items-center gap-1">
                            <XCircle size={15} /> Cancelled by user: {order.cancellation_reason}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TEST ACCOUNTS MANAGER (ADMIN ONLY) */}
        {activeTab === 'accounts' && isAdmin && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#25201d] border border-[#e9ded2] dark:border-[#3d3531] shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                Create Tester Account
              </h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Full Name (e.g. Tester Rahul)"
                    className="h-11 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#3d3531] text-xs outline-none"
                  />
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Email address"
                    className="h-11 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#3d3531] text-xs outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={newUserPass}
                    onChange={(e) => setNewUserPass(e.target.value)}
                    placeholder="Password"
                    className="h-11 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#3d3531] text-xs outline-none"
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="h-11 px-3 rounded-xl bg-[#fbf6ed] dark:bg-[#1f1b19] border border-[#e9ded2] dark:border-[#3d3531] text-xs font-bold outline-none"
                  >
                    <option value="customer">Customer Role</option>
                    <option value="staff">Kitchen Staff Role</option>
                  </select>
                </div>

                {newUserRole === 'customer' && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#6f5c54] dark:text-[#c1b2a9]">
                    <input
                      type="checkbox"
                      checked={seedSampleData}
                      onChange={(e) => setSeedSampleData(e.target.checked)}
                      className="w-4 h-4 rounded text-[#f28a4b]"
                    />
                    <span>
                      Add sample pets (Bruno dog, Misty cat) and 2 past orders so tester sees a lively app immediately
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  className="px-6 h-11 rounded-xl bg-[#3b2923] dark:bg-[#f28a4b] text-white text-xs font-bold shadow-sm"
                >
                  Create Account
                </button>
              </form>
            </div>

            {/* Existing Accounts Table */}
            <div className="bg-white dark:bg-[#25201d] rounded-3xl border border-[#e9ded2] dark:border-[#3d3531] overflow-hidden">
              <div className="p-4 border-b border-[#e9ded2] dark:border-[#3d3531] flex justify-between items-center">
                <b className="text-xs font-extrabold uppercase tracking-wider text-[#9b8b84]">
                  Registered Test Accounts ({usersList.length})
                </b>
              </div>

              <div className="divide-y divide-[#e9ded2] dark:divide-[#3d3531]">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <b className="text-[#3b2923] dark:text-[#f5ebe3] block">
                        {u.full_name || 'No name'}
                      </b>
                      <span className="text-[11px] text-[#9b8b84]">{u.email}</span>
                      <span className="ml-2 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-[#f3eadc] dark:bg-[#3d2c24]">
                        {u.role}
                      </span>
                      {u.disabled && (
                        <span className="ml-2 text-[9px] text-[#d43f39] font-bold">
                          [DISABLED]
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyCredentials(u.email)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#e9ded2] dark:border-[#3d3531] text-[11px] font-bold flex items-center gap-1 hover:bg-[#f3eadc]"
                        title="Copy Email & Password to send to tester"
                      >
                        <Copy size={12} />
                        <span>{copiedText === u.email ? 'Copied!' : 'Copy Login'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleDisable(u.id, !!u.disabled)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#e9ded2] dark:border-[#3d3531] text-[11px] font-bold hover:bg-[#f3eadc]"
                      >
                        {u.disabled ? 'Enable' : 'Disable'}
                      </button>

                      {u.id !== user?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#fff0ee] text-[#d43f39] text-[11px] font-bold hover:bg-[#d43f39] hover:text-white"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TESTER CHECKLIST (ADMIN ONLY) */}
        {activeTab === 'checklist' && isAdmin && (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#25201d] border border-[#e9ded2] dark:border-[#3d3531] space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                Owner & QA Tester Checklist
              </h2>
              <p className="text-xs text-[#9b8b84]">
                Check off flows as you test them on phones and laptops. Saved per admin account.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {checklistItems.map((item) => {
                const checked = checkedChecklist.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#34775d]/10 border-[#34775d]/40'
                        : 'bg-[#fbf6ed] dark:bg-[#1f1b19] border-[#e9ded2] dark:border-[#3d3531]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-xs ${
                        checked
                          ? 'bg-[#34775d] text-white border-transparent'
                          : 'border-[#9b8b84] bg-white dark:bg-[#25201d]'
                      }`}
                    >
                      {checked && '✓'}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        checked
                          ? 'line-through text-[#34775d]'
                          : 'text-[#3b2923] dark:text-[#f5ebe3]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ADMIN SETTINGS & MENU EDITOR (ADMIN ONLY) */}
        {activeTab === 'settings' && isAdmin && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#25201d] border border-[#e9ded2] dark:border-[#3d3531] space-y-4">
              <h2 className="text-base font-extrabold text-[#3b2923] dark:text-[#f5ebe3]">
                Menu Items & Pricing
              </h2>
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-[#e9ded2] dark:border-[#3d3531] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.emoji}</span>
                      <div>
                        <b className="text-[#3b2923] dark:text-[#f5ebe3]">{item.name}</b>
                        <span className="text-[10px] text-[#9b8b84] block">
                          ₹{item.price} • {item.species} • {item.category}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await api.updateMenuItem(item.id, {
                          is_available: !item.is_available,
                        });
                        setMenuItems((prev) =>
                          prev.map((m) => (m.id === item.id ? updated : m))
                        );
                      }}
                      className={`px-3 py-1 rounded-xl font-bold text-xs ${
                        item.is_available
                          ? 'bg-[#34775d]/10 text-[#34775d]'
                          : 'bg-[#d43f39]/10 text-[#d43f39]'
                      }`}
                    >
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
