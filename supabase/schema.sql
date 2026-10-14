-- ==============================================================================
-- ZOOMIES SCHEMA (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Pets Table
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat')),
  breed TEXT NOT NULL,
  age_years INT NOT NULL DEFAULT 0,
  age_months INT NOT NULL DEFAULT 0,
  restrictions TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Addresses Table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  flat TEXT NOT NULL,
  area TEXT NOT NULL,
  landmark TEXT,
  pincode TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'both')),
  category TEXT NOT NULL CHECK (category IN ('mains', 'snacks', 'drinks', 'specials')),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL DEFAULT '🍲',
  chicken BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Add-ons Table
CREATE TABLE IF NOT EXISTS public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'both')),
  name TEXT NOT NULL,
  price_per_100g NUMERIC NOT NULL DEFAULT 30,
  chicken BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (
    status IN ('received', 'accepted', 'cooking', 'packed', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled', 'rejected')
  ),
  type TEXT NOT NULL CHECK (type IN ('delivery', 'takeaway')),
  slot_start TIMESTAMPTZ NOT NULL,
  slot_label TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  address_snapshot JSONB,
  restrictions_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  rejection_reason TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Order Groups (Per Pet bowl)
CREATE TABLE IF NOT EXISTS public.order_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  pet_id UUID,
  pet_name TEXT NOT NULL,
  pet_species TEXT NOT NULL CHECK (pet_species IN ('dog', 'cat')),
  pet_restrictions TEXT[] NOT NULL DEFAULT '{}',
  is_guest_pet BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_group_id UUID NOT NULL REFERENCES public.order_groups(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  grams INT,
  is_chicken BOOLEAN NOT NULL DEFAULT FALSE,
  cake_name TEXT,
  addons_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_notes TEXT,
  allergy_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Saved Bowls (Bruno's usual, etc.)
CREATE TABLE IF NOT EXISTS public.saved_bowls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  pet_name TEXT NOT NULL,
  name TEXT NOT NULL,
  bowl_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status_type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. App Settings (Configurable by admin)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Admin Checklist Progress (per admin user)
CREATE TABLE IF NOT EXISTS public.checklist_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checked_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_bowls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_progress ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Profiles: Users see own, staff & admin see all
CREATE POLICY "Profiles access policy" ON public.profiles
  FOR ALL USING (
    auth.uid() = id OR public.get_current_role() IN ('staff', 'admin')
  );

-- Pets: Owners see own, staff & admin see all
CREATE POLICY "Pets access policy" ON public.pets
  FOR ALL USING (
    auth.uid() = owner_id OR public.get_current_role() IN ('staff', 'admin')
  );

-- Addresses: Owners see own, staff & admin see all
CREATE POLICY "Addresses access policy" ON public.addresses
  FOR ALL USING (
    auth.uid() = user_id OR public.get_current_role() IN ('staff', 'admin')
  );

-- Menu & Addons: Read all, write admin only
CREATE POLICY "Public read menu" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admin write menu" ON public.menu_items FOR ALL USING (public.get_current_role() = 'admin');

CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);
CREATE POLICY "Admin write addons" ON public.addons FOR ALL USING (public.get_current_role() = 'admin');

-- Orders: Customer sees own, staff & admin see all
CREATE POLICY "Orders read policy" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_id OR public.get_current_role() IN ('staff', 'admin')
  );
CREATE POLICY "Orders insert policy" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Orders update policy" ON public.orders
  FOR UPDATE USING (
    auth.uid() = customer_id OR public.get_current_role() IN ('staff', 'admin')
  );

-- Order Groups & Items: Cascade read through orders
CREATE POLICY "Order groups policy" ON public.order_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_groups.order_id
      AND (o.customer_id = auth.uid() OR public.get_current_role() IN ('staff', 'admin'))
    )
  );

CREATE POLICY "Order items policy" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.order_groups og
      JOIN public.orders o ON o.id = og.order_id
      WHERE og.id = order_items.order_group_id
      AND (o.customer_id = auth.uid() OR public.get_current_role() IN ('staff', 'admin'))
    )
  );

-- Saved Bowls: Own only
CREATE POLICY "Saved bowls policy" ON public.saved_bowls
  FOR ALL USING (auth.uid() = user_id);

-- Notifications: Own only
CREATE POLICY "Notifications policy" ON public.notifications
  FOR ALL USING (auth.uid() = user_id OR public.get_current_role() IN ('staff', 'admin'));

-- Ratings: Customer inserts own, all can view
CREATE POLICY "Ratings view policy" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Ratings insert policy" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Settings: Everyone reads, admin writes
CREATE POLICY "Settings read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Settings write" ON public.app_settings FOR ALL USING (public.get_current_role() = 'admin');

-- Checklist: Admin only
CREATE POLICY "Checklist policy" ON public.checklist_progress
  FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- REALTIME REPLICATION SETUP
-- ==============================================================================
-- Add orders, order_groups, and notifications to supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_groups;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
