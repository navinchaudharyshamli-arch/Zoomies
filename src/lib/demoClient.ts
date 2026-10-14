import { ApiClient } from './api';
import {
  Profile,
  Pet,
  Address,
  MenuItem,
  Addon,
  Order,
  BowlGroup,
  SavedBowl,
  NotificationItem,
  Rating,
  AppSettings,
} from '../types';
import { DEFAULT_MENU_ITEMS, DEFAULT_ADDONS, DEFAULT_SETTINGS } from '../config/menuData';

// BroadcastChannel for cross-tab realtime simulation in demo mode
const orderChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('zoomies_orders') : null;
const notifChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('zoomies_notifs') : null;

// Initial Local Storage Seeds
const STORAGE_KEYS = {
  CURRENT_USER: 'zoomies_demo_current_user',
  USERS: 'zoomies_demo_users',
  PETS: 'zoomies_demo_pets',
  ADDRESSES: 'zoomies_demo_addresses',
  MENU: 'zoomies_demo_menu',
  ADDONS: 'zoomies_demo_addons',
  ORDERS: 'zoomies_demo_orders',
  SAVED_BOWLS: 'zoomies_demo_saved_bowls',
  NOTIFICATIONS: 'zoomies_demo_notifications',
  RATINGS: 'zoomies_demo_ratings',
  SETTINGS: 'zoomies_demo_settings',
  CHECKLIST: 'zoomies_demo_checklist',
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Local storage write failed', e);
  }
}

// Seed default users if empty
function initializeDemoStorage() {
  const users = getFromStorage<Profile[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    const defaultUsers: Profile[] = [
      {
        id: 'user-admin-1',
        email: 'admin@zoomies.com',
        full_name: 'Ananya (Owner/Admin)',
        phone: '9876543210',
        role: 'admin',
        disabled: false,
      },
      {
        id: 'user-staff-1',
        email: 'staff@zoomies.com',
        full_name: 'Rahul (Kitchen Head)',
        phone: '9876543211',
        role: 'staff',
        disabled: false,
      },
      {
        id: 'user-customer-1',
        email: 'customer@zoomies.com',
        full_name: 'Vikram Malhotra',
        phone: '9876543212',
        role: 'customer',
        disabled: false,
      },
    ];
    setToStorage(STORAGE_KEYS.USERS, defaultUsers);
  }

  // Preload demo menu and addons if not present
  if (!localStorage.getItem(STORAGE_KEYS.MENU)) {
    setToStorage(STORAGE_KEYS.MENU, DEFAULT_MENU_ITEMS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ADDONS)) {
    setToStorage(STORAGE_KEYS.ADDONS, DEFAULT_ADDONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setToStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
}

initializeDemoStorage();

export class DemoApiClient implements ApiClient {
  public isDemo = true;

  async getCurrentUser(): Promise<Profile | null> {
    return getFromStorage<Profile | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  async login(email: string, pass: string): Promise<Profile> {
    const users = getFromStorage<Profile[]>(STORAGE_KEYS.USERS, []);
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      throw new Error('Wrong email or password');
    }
    if (user.disabled) {
      throw new Error('Account disabled. Contact administrator.');
    }
    setToStorage(STORAGE_KEYS.CURRENT_USER, user);
    return user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  async getPets(userId: string): Promise<Pet[]> {
    const pets = getFromStorage<Pet[]>(STORAGE_KEYS.PETS, []);
    return pets.filter((p) => p.owner_id === userId);
  }

  async createPet(petData: Omit<Pet, 'id' | 'created_at'>): Promise<Pet> {
    const pets = getFromStorage<Pet[]>(STORAGE_KEYS.PETS, []);
    const newPet: Pet = {
      ...petData,
      id: `pet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    pets.push(newPet);
    setToStorage(STORAGE_KEYS.PETS, pets);
    return newPet;
  }

  async updatePet(petId: string, updates: Partial<Pet>): Promise<Pet> {
    const pets = getFromStorage<Pet[]>(STORAGE_KEYS.PETS, []);
    const index = pets.findIndex((p) => p.id === petId);
    if (index === -1) throw new Error('Pet not found');
    pets[index] = { ...pets[index], ...updates };
    setToStorage(STORAGE_KEYS.PETS, pets);
    return pets[index];
  }

  async deletePet(petId: string): Promise<void> {
    const pets = getFromStorage<Pet[]>(STORAGE_KEYS.PETS, []);
    setToStorage(
      STORAGE_KEYS.PETS,
      pets.filter((p) => p.id !== petId)
    );
  }

  async getAddresses(userId: string): Promise<Address[]> {
    const list = getFromStorage<Address[]>(STORAGE_KEYS.ADDRESSES, []);
    return list.filter((a) => a.user_id === userId);
  }

  async saveAddress(addressData: Omit<Address, 'id'>): Promise<Address> {
    const list = getFromStorage<Address[]>(STORAGE_KEYS.ADDRESSES, []);
    const newAddress: Address = {
      ...addressData,
      id: `addr-${Date.now()}`,
    };
    list.unshift(newAddress);
    setToStorage(STORAGE_KEYS.ADDRESSES, list);
    return newAddress;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, DEFAULT_MENU_ITEMS);
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const items = getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, DEFAULT_MENU_ITEMS);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Item not found');
    items[idx] = { ...items[idx], ...updates };
    setToStorage(STORAGE_KEYS.MENU, items);
    return items[idx];
  }

  async getAddons(): Promise<Addon[]> {
    return getFromStorage<Addon[]>(STORAGE_KEYS.ADDONS, DEFAULT_ADDONS);
  }

  async updateAddon(id: string, updates: Partial<Addon>): Promise<Addon> {
    const addons = getFromStorage<Addon[]>(STORAGE_KEYS.ADDONS, DEFAULT_ADDONS);
    const idx = addons.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Addon not found');
    addons[idx] = { ...addons[idx], ...updates };
    setToStorage(STORAGE_KEYS.ADDONS, addons);
    return addons[idx];
  }

  async createOrder(data: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    type: 'delivery' | 'takeaway';
    slotStart: string;
    slotLabel: string;
    paymentMethod: 'cash' | 'upi';
    addressSnapshot?: Address | null;
    groups: BowlGroup[];
    subtotal: number;
    deliveryFee: number;
    total: number;
  }): Promise<Order> {
    const orders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const orderNum = `ZM-${Math.floor(1000 + Math.random() * 9000)}`;

    // Build restrictions snapshot
    const restrictionsSnapshot = data.groups.map((g) => ({
      pet_name: g.pet_name,
      restrictions: g.pet_restrictions,
    }));

    const groupsRecord = data.groups.map((g, gIdx) => ({
      id: `group-${Date.now()}-${gIdx}`,
      pet_id: g.pet_id,
      pet_name: g.pet_name,
      pet_species: g.pet_species,
      pet_restrictions: g.pet_restrictions,
      is_guest_pet: g.is_guest_pet,
      items: g.items.map((it, itIdx) => ({
        id: `item-${Date.now()}-${itIdx}`,
        name: it.menu_item.name,
        price: it.menu_item.price,
        quantity: it.quantity,
        is_chicken: it.menu_item.chicken || it.selected_addons.some((a) => a.chicken),
        cake_name: it.cake_name,
        addons_snapshot: it.selected_addons,
        removed_ingredients: it.removed_ingredients,
        custom_notes: it.custom_notes,
        allergy_acknowledged: !!it.allergy_acknowledged,
      })),
    }));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_number: orderNum,
      customer_id: data.customerId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      status: 'received',
      type: data.type,
      slot_start: data.slotStart,
      slot_label: data.slotLabel,
      payment_method: data.paymentMethod,
      payment_status: 'pending',
      address_snapshot: data.addressSnapshot,
      restrictions_snapshot: restrictionsSnapshot,
      subtotal: data.subtotal,
      delivery_fee: data.deliveryFee,
      total: data.total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      groups: groupsRecord,
    };

    orders.unshift(newOrder);
    setToStorage(STORAGE_KEYS.ORDERS, orders);

    // Create automatic initial notification
    const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const firstNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: data.customerId,
      order_id: newOrder.id,
      title: 'Order Received 🐾',
      message: `Your order #${newOrder.order_number} has been received by Zoomies cafe!`,
      status_type: 'received',
      read: false,
      created_at: new Date().toISOString(),
    };
    notifs.unshift(firstNotif);
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);

    // Broadcast realtime simulation
    orderChannel?.postMessage(newOrder);
    notifChannel?.postMessage(firstNotif);

    return newOrder;
  }

  async getOrders(filter?: { customerId?: string }): Promise<Order[]> {
    const orders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    if (filter?.customerId) {
      return orders.filter((o) => o.customer_id === filter.customerId);
    }
    return orders;
  }

  async updateOrderStatus(orderId: string, status: Order['status'], reason?: string): Promise<Order> {
    const orders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');

    orders[idx] = {
      ...orders[idx],
      status,
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    };
    setToStorage(STORAGE_KEYS.ORDERS, orders);

    // Create notification according to status
    const statusTitles: Record<string, { title: string; msg: string }> = {
      accepted: {
        title: 'Order Accepted 👩‍🍳',
        msg: `Cafe accepted order #${orders[idx].order_number}. Preparing fresh ingredients!`,
      },
      cooking: {
        title: 'Food is Being Made 🍲',
        msg: `The kitchen team is gently cooking your pet's meal fresh!`,
      },
      packed: {
        title: 'Meal Packed 📦',
        msg: `Order #${orders[idx].order_number} is packed fresh with eco-friendly seals.`,
      },
      out_for_delivery: {
        title: 'Out for Delivery 🛵',
        msg: `Zoomies rider is on the way to your door!`,
      },
      ready_for_pickup: {
        title: 'Ready for Pickup 🐾',
        msg: `Your bowl is ready waiting at the Zoomies counter.`,
      },
      completed: {
        title: orders[idx].type === 'delivery' ? 'Delivered! 🎉' : 'Picked Up! 🎉',
        msg: `Bon Appetit to your furry friends! Please rate your meal.`,
      },
      rejected: {
        title: 'Order Declined',
        msg: `We apologize: ${reason || 'Cafe reached capacity for this slot'}.`,
      },
      cancelled: {
        title: 'Order Cancelled',
        msg: `Order #${orders[idx].order_number} was cancelled.`,
      },
    };

    if (statusTitles[status]) {
      const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        user_id: orders[idx].customer_id,
        order_id: orders[idx].id,
        title: statusTitles[status].title,
        message: statusTitles[status].msg,
        status_type: status,
        read: false,
        created_at: new Date().toISOString(),
      };
      notifs.unshift(newNotif);
      setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
      notifChannel?.postMessage(newNotif);
    }

    orderChannel?.postMessage(orders[idx]);
    return orders[idx];
  }

  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const orders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');

    const order = orders[idx];
    if (order.status !== 'received') {
      throw new Error('Order is already accepted by the kitchen and cannot be cancelled.');
    }

    orders[idx] = {
      ...order,
      status: 'cancelled',
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
    };
    setToStorage(STORAGE_KEYS.ORDERS, orders);
    orderChannel?.postMessage(orders[idx]);
    return orders[idx];
  }

  async getSavedBowls(petId: string): Promise<SavedBowl[]> {
    const bowls = getFromStorage<SavedBowl[]>(STORAGE_KEYS.SAVED_BOWLS, []);
    return bowls.filter((b) => b.pet_id === petId);
  }

  async saveBowl(bowlData: Omit<SavedBowl, 'id' | 'created_at'>): Promise<SavedBowl> {
    const bowls = getFromStorage<SavedBowl[]>(STORAGE_KEYS.SAVED_BOWLS, []);
    const newBowl: SavedBowl = {
      ...bowlData,
      id: `bowl-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    bowls.unshift(newBowl);
    setToStorage(STORAGE_KEYS.SAVED_BOWLS, bowls);
    return newBowl;
  }

  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifs.filter((n) => n.user_id === userId);
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notifs = getFromStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const idx = notifs.findIndex((n) => n.id === notificationId);
    if (idx !== -1) {
      notifs[idx].read = true;
      setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  }

  async submitRating(ratingData: {
    orderId: string;
    customerId: string;
    rating: number;
    feedback?: string;
  }): Promise<Rating> {
    const ratings = getFromStorage<Rating[]>(STORAGE_KEYS.RATINGS, []);
    const newRating: Rating = {
      id: `rat-${Date.now()}`,
      order_id: ratingData.orderId,
      customer_id: ratingData.customerId,
      rating: ratingData.rating,
      feedback: ratingData.feedback,
      created_at: new Date().toISOString(),
    };
    ratings.unshift(newRating);
    setToStorage(STORAGE_KEYS.RATINGS, ratings);
    return newRating;
  }

  async getRating(orderId: string): Promise<Rating | null> {
    const ratings = getFromStorage<Rating[]>(STORAGE_KEYS.RATINGS, []);
    return ratings.find((r) => r.order_id === orderId) || null;
  }

  async getSettings(): Promise<AppSettings> {
    return getFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = getFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const updated = { ...current, ...settings };
    setToStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  subscribeToOrders(callback: (order: Order) => void): () => void {
    if (!orderChannel) return () => {};
    const handler = (e: MessageEvent) => {
      if (e.data) callback(e.data);
    };
    orderChannel.addEventListener('message', handler);
    return () => orderChannel.removeEventListener('message', handler);
  }

  subscribeToNotifications(userId: string, callback: (notification: NotificationItem) => void): () => void {
    if (!notifChannel) return () => {};
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.user_id === userId) {
        callback(e.data);
      }
    };
    notifChannel.addEventListener('message', handler);
    return () => notifChannel.removeEventListener('message', handler);
  }

  // Admin Tools
  async listUsers(): Promise<Profile[]> {
    return getFromStorage<Profile[]>(STORAGE_KEYS.USERS, []);
  }

  async adminCreateUser(params: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'customer' | 'staff';
  }): Promise<Profile> {
    const users = getFromStorage<Profile[]>(STORAGE_KEYS.USERS, []);
    if (users.some((u) => u.email.toLowerCase() === params.email.toLowerCase())) {
      throw new Error('User with this email already exists.');
    }
    const newUser: Profile = {
      id: `user-${Date.now()}`,
      email: params.email,
      full_name: params.fullName,
      phone: params.phone,
      role: params.role,
      disabled: false,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  async adminResetPassword(userId: string, _newPass: string): Promise<void> {
    // In demo mode, simply confirm
    const users = getFromStorage<Profile[]>(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
  }

  async adminToggleDisable(userId: string, disabled: boolean): Promise<void> {
    const users = getFromStorage<Profile[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].disabled = disabled;
      setToStorage(STORAGE_KEYS.USERS, users);
    }
  }

  async adminDeleteUser(userId: string): Promise<void> {
    const users = getFromStorage<Profile[]>(STORAGE_KEYS.USERS, []);
    setToStorage(
      STORAGE_KEYS.USERS,
      users.filter((u) => u.id !== userId)
    );
  }

  async resetTestData(): Promise<void> {
    // Deletes all orders, notifications and ratings; keeps accounts, pets and menu
    setToStorage(STORAGE_KEYS.ORDERS, []);
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    setToStorage(STORAGE_KEYS.RATINGS, []);
  }

  async seedSamplePetsAndOrders(customerId: string): Promise<void> {
    // Add one dog and one cat
    const dog = await this.createPet({
      owner_id: customerId,
      name: 'Bruno',
      species: 'dog',
      breed: 'Golden Retriever',
      age_years: 3,
      age_months: 4,
      restrictions: ['Egg'],
    });

    const cat = await this.createPet({
      owner_id: customerId,
      name: 'Misty',
      species: 'cat',
      breed: 'Persian',
      age_years: 2,
      age_months: 1,
      restrictions: ['Dairy'],
    });

    // Seed 2 past orders
    const menu = await this.getMenuItems();
    const dogItem = menu.find((m) => m.name === 'Woof Chicken Bowl') || menu[0];
    const catItem = menu.find((m) => m.name === 'Meow Chicken Feast') || menu[1];

    await this.createOrder({
      customerId,
      customerName: 'Sample Tester',
      customerPhone: '9876543210',
      type: 'delivery',
      slotStart: new Date(Date.now() - 86400000 * 2).toISOString(),
      slotLabel: 'Yesterday 12:30 PM',
      paymentMethod: 'upi',
      addressSnapshot: {
        id: 'addr-demo-1',
        user_id: customerId,
        label: 'Home',
        name: 'Sample Tester',
        phone: '9876543210',
        flat: 'Flat 402, Sunshine Apts',
        area: '12th Main, Indiranagar',
        pincode: '560038',
      },
      groups: [
        {
          group_id: 'grp-1',
          pet_id: dog.id,
          pet_name: dog.name,
          pet_species: 'dog',
          pet_restrictions: dog.restrictions,
          is_guest_pet: false,
          items: [
            {
              cart_item_id: 'ci-1',
              menu_item: dogItem,
              quantity: 1,
              selected_addons: [{ name: 'Boiled Rice', grams: 100, price: 20, chicken: false }],
              item_total: dogItem.price + 20,
            },
          ],
        },
      ],
      subtotal: dogItem.price + 20,
      deliveryFee: 30,
      total: dogItem.price + 50,
    });

    await this.createOrder({
      customerId,
      customerName: 'Sample Tester',
      customerPhone: '9876543210',
      type: 'takeaway',
      slotStart: new Date(Date.now() - 86400000).toISOString(),
      slotLabel: 'Yesterday 6:00 PM',
      paymentMethod: 'cash',
      groups: [
        {
          group_id: 'grp-2',
          pet_id: cat.id,
          pet_name: cat.name,
          pet_species: 'cat',
          pet_restrictions: cat.restrictions,
          is_guest_pet: false,
          items: [
            {
              cart_item_id: 'ci-2',
              menu_item: catItem,
              quantity: 1,
              selected_addons: [{ name: 'Warm Fish Broth', grams: 100, price: 40, chicken: false }],
              item_total: catItem.price + 40,
            },
          ],
        },
      ],
      subtotal: catItem.price + 40,
      deliveryFee: 0,
      total: catItem.price + 40,
    });
  }

  async getChecklistProgress(adminId: string): Promise<string[]> {
    const list = getFromStorage<Record<string, string[]>>(STORAGE_KEYS.CHECKLIST, {});
    return list[adminId] || [];
  }

  async saveChecklistProgress(adminId: string, items: string[]): Promise<void> {
    const list = getFromStorage<Record<string, string[]>>(STORAGE_KEYS.CHECKLIST, {});
    list[adminId] = items;
    setToStorage(STORAGE_KEYS.CHECKLIST, list);
  }
}
