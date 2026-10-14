-- ==============================================================================
-- ZOOMIES SEED DATA
-- ==============================================================================

-- Clean default seed
DELETE FROM public.menu_items;
DELETE FROM public.addons;

-- 1. DOG MENU
-- Mains
INSERT INTO public.menu_items (species, category, name, price, description, emoji, chicken, is_available) VALUES
('dog', 'mains', 'Woof Chicken Bowl', 189, 'Boiled human-grade chicken, rice and veggies', '🍲', true, true),
('dog', 'mains', 'Puppy Veg Delight', 169, 'Boiled pumpkin, carrot, rice and curd', '🥕', false, true),
('dog', 'mains', 'Eggy Woof Scramble', 149, 'Scrambled egg', '🍳', false, true),
('dog', 'mains', 'Fishy Tail Treat', 219, 'Steamed fish and sweet potato', '🐟', false, true);

-- Snacks and Treats
INSERT INTO public.menu_items (species, category, name, price, description, emoji, chicken, is_available) VALUES
('dog', 'snacks', 'Peanut Butter Pup Toast', 129, 'Xylitol-free peanut butter', '🍞', false, true),
('dog', 'snacks', 'Chicken Chew Bites', 139, 'Tender human-grade chicken bites', '🦴', true, true),
('dog', 'snacks', 'Carrot Crunch Sticks', 99, 'Naturally crunchy carrot sticks', '🥕', false, true);

-- 2. CAT MENU
-- Mains
INSERT INTO public.menu_items (species, category, name, price, description, emoji, chicken, is_available) VALUES
('cat', 'mains', 'Meow Chicken Feast', 179, 'Steamed human-grade chicken and broth', '🍲', true, true),
('cat', 'mains', 'Fishy Meow Bowl', 199, 'Steamed fish and pumpkin', '🐟', false, true),
('cat', 'mains', 'Egg & Chicken Mash', 169, 'Human-grade chicken with scrambled egg', '🥚', true, true);

-- Snacks and Treats
INSERT INTO public.menu_items (species, category, name, price, description, emoji, chicken, is_available) VALUES
('cat', 'snacks', 'Tuna Lick Treat', 119, 'Smooth tuna treat', '🐟', false, true),
('cat', 'snacks', 'Chicken Catnip Bites', 129, 'Human-grade chicken with gentle catnip', '🌿', true, true);

-- Drinks
INSERT INTO public.menu_items (species, category, name, price, description, emoji, chicken, is_available) VALUES
('cat', 'drinks', 'Kitty Milk', 79, 'Lactose-free gentle milk', '🥛', false, true),
('cat', 'drinks', 'Warm Fish Broth', 89, 'Warm and comforting fresh broth', '☕', false, true);

-- 3. SPECIALS (Both Dog & Cat safe)
INSERT INTO public.menu_items (species, category, name, price, description, emoji, chicken, is_available) VALUES
('both', 'specials', 'Birthday Paw-cake', 349, 'Custom pet cake with name and candle (24h lead time)', '🎂', false, true),
('both', 'specials', 'Custom Pet Meal Plate', 299, 'Tailor a customized plate from fresh add-ons', '🍱', false, true);

-- 4. ADD-ONS
-- Dog Addons
INSERT INTO public.addons (species, name, price_per_100g, chicken, is_available) VALUES
('dog', 'Boiled Rice', 20, false, true),
('dog', 'Boiled Pumpkin', 25, false, true),
('dog', 'Carrot Slices', 25, false, true),
('dog', 'Curd', 20, false, true),
('dog', 'Sweet Potato', 30, false, true),
('dog', 'Chicken Broth', 35, true, true),
('dog', 'Vegetable Broth', 25, false, true),
('dog', 'Chicken Chew Bites Extra', 40, true, true);

-- Cat Addons (Carnivore-focused)
INSERT INTO public.addons (species, name, price_per_100g, chicken, is_available) VALUES
('cat', 'Chicken Broth', 35, true, true),
('cat', 'Fish Broth', 40, false, true),
('cat', 'Boiled Pumpkin', 25, false, true),
('cat', 'Boiled Egg', 30, false, true);

-- 5. INITIAL DEFAULT APP SETTINGS
INSERT INTO public.app_settings (key, value) VALUES
('cafe_hours', '{"open": "09:00", "close": "21:00"}'::jsonb),
('delivery', '{"fee": 30, "free_threshold": 300}'::jsonb),
('slot_capacity', '{"max_per_slot": 15}'::jsonb),
('order_rules', '{"cancellation_window_minutes": 2}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
