import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
import { DEFAULT_SETTINGS } from '../config/menuData';

export class SupabaseApiClient implements ApiClient {
  public isDemo = false;
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  async getCurrentUser(): Promise<Profile | null> {
    const { data: { session }, error: sessionErr } = await this.client.auth.getSession();
    if (sessionErr || !session?.user) return null;

    const { data: profile, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) return null;
    return profile as Profile;
  }

  async login(email: string, pass: string): Promise<Profile> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    });
    if (error || !data.user) {
      throw new Error('Wrong email or password');
    }

    const { data: profile, error: profError } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profError || !profile) {
      throw new Error('User profile not found. Please contact support.');
    }
    if (profile.disabled) {
      await this.client.auth.signOut();
      throw new Error('Account disabled. Contact administrator.');
    }
    return profile as Profile;
  }

  async logout(): Promise<void> {
    await this.client.auth.signOut();
  }

  async getPets(userId: string): Promise<Pet[]> {
    const { data, error } = await this.client
      .from('pets')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createPet(petData: Omit<Pet, 'id' | 'created_at'>): Promise<Pet> {
    const { data, error } = await this.client
      .from('pets')
      .insert(petData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updatePet(petId: string, updates: Partial<Pet>): Promise<Pet> {
    const { data, error } = await this.client
      .from('pets')
      .update(updates)
      .eq('id', petId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deletePet(petId: string): Promise<void> {
    const { error } = await this.client.from('pets').delete().eq('id', petId);
    if (error) throw error;
  }

  async getAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await this.client
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async saveAddress(addressData: Omit<Address, 'id'>): Promise<Address> {
    const { data, error } = await this.client
      .from('addresses')
      .insert(addressData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await this.client
      .from('menu_items')
      .select('*')
      .order('category');
    if (error) throw error;
    return data || [];
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const { data, error } = await this.client
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getAddons(): Promise<Addon[]> {
    const { data, error } = await this.client.from('addons').select('*');
    if (error) throw error;
    return data || [];
  }

  async updateAddon(id: string, updates: Partial<Addon>): Promise<Addon> {
    const { data, error } = await this.client
      .from('addons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
    const orderNum = `ZM-${Math.floor(1000 + Math.random() * 9000)}`;

    const restrictionsSnapshot = data.groups.map((g) => ({
      pet_name: g.pet_name,
      restrictions: g.pet_restrictions,
    }));

    // 1. Insert order
    const { data: newOrder, error: orderErr } = await this.client
      .from('orders')
      .insert({
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
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 2. Insert order groups and items
    for (const grp of data.groups) {
      const { data: groupRecord, error: grpErr } = await this.client
        .from('order_groups')
        .insert({
          order_id: newOrder.id,
          pet_id: grp.pet_id || null,
          pet_name: grp.pet_name,
          pet_species: grp.pet_species,
          pet_restrictions: grp.pet_restrictions,
          is_guest_pet: grp.is_guest_pet,
        })
        .select()
        .single();

      if (grpErr) throw grpErr;

      const itemsToInsert = grp.items.map((it) => ({
        order_group_id: groupRecord.id,
        menu_item_id: it.menu_item.id?.includes('-') ? null : it.menu_item.id,
        name: it.menu_item.name,
        price: it.menu_item.price,
        quantity: it.quantity,
        is_chicken: it.menu_item.chicken || it.selected_addons.some((a) => a.chicken),
        cake_name: it.cake_name || null,
        addons_snapshot: it.selected_addons,
        custom_notes: [
          it.custom_notes,
          it.removed_ingredients && it.removed_ingredients.length > 0
            ? `Excluded ingredients: ${it.removed_ingredients.join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join(' | ') || null,
        allergy_acknowledged: !!it.allergy_acknowledged,
      }));

      const { error: itemsErr } = await this.client.from('order_items').insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }

    // 3. Create initial notification
    await this.client.from('notifications').insert({
      user_id: data.customerId,
      order_id: newOrder.id,
      title: 'Order Received 🐾',
      message: `Your order #${newOrder.order_number} has been received by Zoomies cafe!`,
      status_type: 'received',
      read: false,
    });

    return newOrder;
  }

  async getOrders(filter?: { customerId?: string }): Promise<Order[]> {
    let query = this.client
      .from('orders')
      .select(`
        *,
        groups:order_groups(
          id, pet_id, pet_name, pet_species, pet_restrictions, is_guest_pet,
          items:order_items(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (filter?.customerId) {
      query = query.eq('customer_id', filter.customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateOrderStatus(orderId: string, status: Order['status'], reason?: string): Promise<Order> {
    const { data: updatedOrder, error } = await this.client
      .from('orders')
      .update({
        status,
        rejection_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Trigger notification according to status
    const statusTitles: Record<string, { title: string; msg: string }> = {
      accepted: {
        title: 'Order Accepted 👩‍🍳',
        msg: `Cafe accepted order #${updatedOrder.order_number}. Preparing fresh ingredients!`,
      },
      cooking: {
        title: 'Food is Being Made 🍲',
        msg: `The kitchen team is gently cooking your pet's meal fresh!`,
      },
      packed: {
        title: 'Meal Packed 📦',
        msg: `Order #${updatedOrder.order_number} is packed fresh with eco-friendly seals.`,
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
        title: updatedOrder.type === 'delivery' ? 'Delivered! 🎉' : 'Picked Up! 🎉',
        msg: `Bon Appetit to your furry friends! Please rate your meal.`,
      },
      rejected: {
        title: 'Order Declined',
        msg: `We apologize: ${reason || 'Cafe reached capacity for this slot'}.`,
      },
      cancelled: {
        title: 'Order Cancelled',
        msg: `Order #${updatedOrder.order_number} was cancelled.`,
      },
    };

    if (statusTitles[status]) {
      await this.client.from('notifications').insert({
        user_id: updatedOrder.customer_id,
        order_id: updatedOrder.id,
        title: statusTitles[status].title,
        message: statusTitles[status].msg,
        status_type: status,
        read: false,
      });
    }

    return updatedOrder;
  }

  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const { data: order, error: fetchErr } = await this.client
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();
    if (fetchErr || !order) throw new Error('Order not found');

    if (order.status !== 'received') {
      throw new Error('Order is already accepted by the kitchen and cannot be cancelled.');
    }

    const { data: updated, error } = await this.client
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }

  async getSavedBowls(petId: string): Promise<SavedBowl[]> {
    const { data, error } = await this.client
      .from('saved_bowls')
      .select('*')
      .eq('pet_id', petId);
    if (error) throw error;
    return data || [];
  }

  async saveBowl(bowlData: Omit<SavedBowl, 'id' | 'created_at'>): Promise<SavedBowl> {
    const { data, error } = await this.client
      .from('saved_bowls')
      .insert(bowlData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.client
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  }

  async submitRating(ratingData: {
    orderId: string;
    customerId: string;
    rating: number;
    feedback?: string;
  }): Promise<Rating> {
    const { data, error } = await this.client
      .from('ratings')
      .insert({
        order_id: ratingData.orderId,
        customer_id: ratingData.customerId,
        rating: ratingData.rating,
        feedback: ratingData.feedback,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getRating(orderId: string): Promise<Rating | null> {
    const { data, error } = await this.client
      .from('ratings')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getSettings(): Promise<AppSettings> {
    const { data, error } = await this.client.from('app_settings').select('*');
    if (error || !data || data.length === 0) return DEFAULT_SETTINGS;

    const settingsObj: any = { ...DEFAULT_SETTINGS };
    data.forEach((row: any) => {
      settingsObj[row.key] = row.value;
    });
    return settingsObj as AppSettings;
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    for (const [k, v] of Object.entries(settings)) {
      await this.client
        .from('app_settings')
        .upsert({ key: k, value: v, updated_at: new Date().toISOString() });
    }
    return this.getSettings();
  }

  subscribeToOrders(callback: (order: Order) => void): () => void {
    const channel = this.client
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          callback(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      this.client.removeChannel(channel);
    };
  }

  subscribeToNotifications(userId: string, callback: (notification: NotificationItem) => void): () => void {
    const channel = this.client
      .channel(`public:notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          callback(payload.new as NotificationItem);
        }
      )
      .subscribe();

    return () => {
      this.client.removeChannel(channel);
    };
  }

  // Admin Tools via /api/admin-users or /netlify/functions/admin-users
  private async callAdminApi(action: string, payload: any) {
    const { data: { session } } = await this.client.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const endpoint = '/api/admin-users';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Serverless admin function failed');
    }
    return res.json();
  }

  async listUsers(): Promise<Profile[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async adminCreateUser(params: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: 'customer' | 'staff';
  }): Promise<Profile> {
    const result = await this.callAdminApi('create_user', params);
    return result.user;
  }

  async adminResetPassword(userId: string, newPass: string): Promise<void> {
    await this.callAdminApi('reset_password', { userId, newPassword: newPass });
  }

  async adminToggleDisable(userId: string, disabled: boolean): Promise<void> {
    await this.callAdminApi('toggle_disable_user', { userId, disabled });
  }

  async adminDeleteUser(userId: string): Promise<void> {
    await this.callAdminApi('delete_user', { userId });
  }

  async resetTestData(): Promise<void> {
    // Delete orders, notifications, ratings
    const { error: ordErr } = await this.client.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (ordErr) console.warn('Orders reset note:', ordErr);

    const { error: notifErr } = await this.client.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (notifErr) console.warn('Notifs reset note:', notifErr);

    const { error: ratErr } = await this.client.from('ratings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (ratErr) console.warn('Ratings reset note:', ratErr);
  }

  async seedSamplePetsAndOrders(customerId: string): Promise<void> {
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

    const menu = await this.getMenuItems();
    const dogItem = menu.find((m) => m.name === 'Woof Chicken Bowl') || menu[0];
    const catItem = menu.find((m) => m.name === 'Meow Chicken Feast') || menu[1];

    if (dogItem) {
      await this.createOrder({
        customerId,
        customerName: 'Sample Tester',
        customerPhone: '9876543210',
        type: 'delivery',
        slotStart: new Date(Date.now() - 86400000 * 2).toISOString(),
        slotLabel: 'Yesterday 12:30 PM',
        paymentMethod: 'upi',
        groups: [
          {
            group_id: 'sample-g-1',
            pet_id: dog.id,
            pet_name: dog.name,
            pet_species: 'dog',
            pet_restrictions: dog.restrictions,
            is_guest_pet: false,
            items: [
              {
                cart_item_id: 'sample-ci-1',
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
    }

    if (catItem) {
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
            group_id: 'sample-g-2',
            pet_id: cat.id,
            pet_name: cat.name,
            pet_species: 'cat',
            pet_restrictions: cat.restrictions,
            is_guest_pet: false,
            items: [
              {
                cart_item_id: 'sample-ci-2',
                menu_item: catItem,
                quantity: 1,
                selected_addons: [],
                item_total: catItem.price,
              },
            ],
          },
        ],
        subtotal: catItem.price,
        deliveryFee: 0,
        total: catItem.price,
      });
    }
  }

  async getChecklistProgress(adminId: string): Promise<string[]> {
    const { data } = await this.client
      .from('checklist_progress')
      .select('checked_items')
      .eq('user_id', adminId)
      .maybeSingle();
    return data?.checked_items || [];
  }

  async saveChecklistProgress(adminId: string, items: string[]): Promise<void> {
    await this.client.from('checklist_progress').upsert({
      user_id: adminId,
      checked_items: items,
      updated_at: new Date().toISOString(),
    });
  }
}
