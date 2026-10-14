export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  disabled?: boolean;
  created_at?: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: 'dog' | 'cat';
  breed: string;
  age_years: number;
  age_months: number;
  restrictions: string[];
  notes?: string;
  created_at?: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  name: string;
  phone: string;
  flat: string;
  area: string;
  landmark?: string;
  pincode: string;
  lat?: number;
  lng?: number;
  is_default?: boolean;
}

export interface MenuItem {
  id: string;
  species: 'dog' | 'cat' | 'both';
  category: 'mains' | 'snacks' | 'drinks' | 'specials';
  name: string;
  price: number;
  description?: string;
  emoji: string;
  chicken: boolean;
  is_available: boolean;
  default_ingredients?: string[];
}

export interface Addon {
  id: string;
  species: 'dog' | 'cat' | 'both';
  name: string;
  price_per_100g: number;
  chicken: boolean;
  is_available: boolean;
}

export interface SelectedAddon {
  addon_id?: string;
  name: string;
  grams: number; // e.g. 50, 100, 150...
  price: number;
  chicken: boolean;
}

export interface CartItem {
  cart_item_id: string;
  menu_item: MenuItem;
  quantity: number;
  cake_name?: string;
  selected_addons: SelectedAddon[];
  removed_ingredients?: string[];
  custom_notes?: string;
  item_total: number;
  allergy_acknowledged?: boolean;
}

export interface BowlGroup {
  group_id: string;
  pet_id?: string; // Optional if guest pet
  pet_name: string;
  pet_species: 'dog' | 'cat';
  pet_restrictions: string[];
  is_guest_pet: boolean;
  items: CartItem[];
}

export type OrderStatus =
  | 'received'
  | 'accepted'
  | 'cooking'
  | 'packed'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface OrderItemRecord {
  id: string;
  menu_item_id?: string;
  name: string;
  price: number;
  quantity: number;
  grams?: number;
  is_chicken: boolean;
  cake_name?: string;
  addons_snapshot: SelectedAddon[];
  removed_ingredients?: string[];
  custom_notes?: string;
  allergy_acknowledged: boolean;
}

export interface OrderGroupRecord {
  id: string;
  pet_id?: string;
  pet_name: string;
  pet_species: 'dog' | 'cat';
  pet_restrictions: string[];
  is_guest_pet: boolean;
  items: OrderItemRecord[];
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  type: 'delivery' | 'takeaway';
  slot_start: string;
  slot_label: string;
  payment_method: 'cash' | 'upi';
  payment_status: 'pending' | 'paid';
  address_snapshot?: Address | null;
  restrictions_snapshot: Array<{
    pet_name: string;
    restrictions: string[];
  }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  rejection_reason?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  groups?: OrderGroupRecord[];
}

export interface SavedBowl {
  id: string;
  user_id: string;
  pet_id: string;
  pet_name: string;
  name: string;
  bowl_data: CartItem;
  created_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  order_id?: string;
  title: string;
  message: string;
  status_type: string;
  read: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  order_id: string;
  customer_id: string;
  rating: number;
  feedback?: string;
  created_at: string;
}

export interface AppSettings {
  cafe_hours: { open: string; close: string };
  delivery: { fee: number; free_threshold: number };
  slot_capacity: { max_per_slot: number };
  order_rules: { cancellation_window_minutes: number };
}
