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

export interface ApiClient {
  isDemo: boolean;

  // Auth / Current User
  getCurrentUser(): Promise<Profile | null>;
  login(email: string, password: string): Promise<Profile>;
  logout(): Promise<void>;

  // Pets
  getPets(userId: string): Promise<Pet[]>;
  createPet(pet: Omit<Pet, 'id' | 'created_at'>): Promise<Pet>;
  updatePet(petId: string, updates: Partial<Pet>): Promise<Pet>;
  deletePet(petId: string): Promise<void>;

  // Addresses
  getAddresses(userId: string): Promise<Address[]>;
  saveAddress(address: Omit<Address, 'id'>): Promise<Address>;

  // Menu & Addons
  getMenuItems(): Promise<MenuItem[]>;
  updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem>;
  getAddons(): Promise<Addon[]>;
  updateAddon(id: string, updates: Partial<Addon>): Promise<Addon>;

  // Orders
  createOrder(orderData: {
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
  }): Promise<Order>;
  getOrders(filter?: { customerId?: string }): Promise<Order[]>;
  updateOrderStatus(orderId: string, status: Order['status'], reason?: string): Promise<Order>;
  cancelOrder(orderId: string, reason: string): Promise<Order>;

  // Saved Bowls
  getSavedBowls(petId: string): Promise<SavedBowl[]>;
  saveBowl(bowl: Omit<SavedBowl, 'id' | 'created_at'>): Promise<SavedBowl>;

  // Notifications
  getNotifications(userId: string): Promise<NotificationItem[]>;
  markNotificationRead(notificationId: string): Promise<void>;

  // Ratings
  submitRating(rating: { orderId: string; customerId: string; rating: number; feedback?: string }): Promise<Rating>;
  getRating(orderId: string): Promise<Rating | null>;

  // Settings
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;

  // Realtime Subscriptions
  subscribeToOrders(callback: (order: Order) => void): () => void;
  subscribeToNotifications(userId: string, callback: (notification: NotificationItem) => void): () => void;

  // Admin Tools
  listUsers(): Promise<Profile[]>;
  adminCreateUser(params: { email: string; password: string; fullName: string; phone?: string; role: 'customer' | 'staff' }): Promise<Profile>;
  adminResetPassword(userId: string, newPass: string): Promise<void>;
  adminToggleDisable(userId: string, disabled: boolean): Promise<void>;
  adminDeleteUser(userId: string): Promise<void>;
  resetTestData(): Promise<void>;
  seedSamplePetsAndOrders(customerId: string): Promise<void>;
  getChecklistProgress(adminId: string): Promise<string[]>;
  saveChecklistProgress(adminId: string, items: string[]): Promise<void>;
}
