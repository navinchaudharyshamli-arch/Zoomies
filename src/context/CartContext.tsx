import React, { createContext, useContext, useEffect, useState } from 'react';
import { Pet, CartItem, BowlGroup } from '../types';
import { api } from '../lib';
import { useAuth } from './AuthContext';

interface CartContextType {
  pets: Pet[];
  activePet: Pet | null;
  setActivePet: (pet: Pet) => void;
  loadPets: () => Promise<Pet[]>;
  groups: BowlGroup[];
  addItemToBowl: (
    pet: { id?: string; name: string; species: 'dog' | 'cat'; restrictions: string[]; isGuest?: boolean },
    item: CartItem
  ) => void;
  updateItemQuantity: (groupId: string, cartItemId: string, delta: number) => void;
  removeItem: (groupId: string, cartItemId: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'zoomies_cart_groups';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [groups, setGroups] = useState<BowlGroup[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadPets = async () => {
    if (!user) {
      setPets([]);
      setActivePet(null);
      return [];
    }
    try {
      const userPets = await api.getPets(user.id);
      setPets(userPets);
      if (userPets.length > 0 && (!activePet || !userPets.some((p) => p.id === activePet.id))) {
        setActivePet(userPets[0]);
      }
      return userPets;
    } catch (e) {
      console.error('Error fetching pets:', e);
      return [];
    }
  };

  useEffect(() => {
    loadPets();
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(groups));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [groups]);

  const addItemToBowl = (
    pet: { id?: string; name: string; species: 'dog' | 'cat'; restrictions: string[]; isGuest?: boolean },
    item: CartItem
  ) => {
    setGroups((prevGroups) => {
      // Find matching group by pet_id or guest pet name
      const existingGroupIndex = prevGroups.findIndex((g) => {
        if (pet.id && g.pet_id) return g.pet_id === pet.id;
        return g.pet_name.toLowerCase() === pet.name.toLowerCase();
      });

      if (existingGroupIndex > -1) {
        const updated = [...prevGroups];
        const grp = { ...updated[existingGroupIndex] };
        // Check if exact same item with same cake/addons exists
        const itemIdx = grp.items.findIndex(
          (it) =>
            it.menu_item.id === item.menu_item.id &&
            it.cake_name === item.cake_name &&
            JSON.stringify(it.selected_addons) === JSON.stringify(item.selected_addons)
        );

        if (itemIdx > -1) {
          const updatedItems = [...grp.items];
          updatedItems[itemIdx] = {
            ...updatedItems[itemIdx],
            quantity: updatedItems[itemIdx].quantity + item.quantity,
          };
          grp.items = updatedItems;
        } else {
          grp.items = [...grp.items, item];
        }

        updated[existingGroupIndex] = grp;
        return updated;
      } else {
        // Create new bowl group
        const newGroup: BowlGroup = {
          group_id: `grp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          pet_id: pet.id,
          pet_name: pet.name,
          pet_species: pet.species,
          pet_restrictions: pet.restrictions || [],
          is_guest_pet: !!pet.isGuest,
          items: [item],
        };
        return [...prevGroups, newGroup];
      }
    });
  };

  const updateItemQuantity = (groupId: string, cartItemId: string, delta: number) => {
    setGroups((prev) => {
      return prev
        .map((g) => {
          if (g.group_id !== groupId) return g;
          const updatedItems = g.items
            .map((it) => {
              if (it.cart_item_id !== cartItemId) return it;
              const newQty = it.quantity + delta;
              return newQty > 0 ? { ...it, quantity: newQty } : null;
            })
            .filter(Boolean) as CartItem[];
          return { ...g, items: updatedItems };
        })
        .filter((g) => g.items.length > 0);
    });
  };

  const removeItem = (groupId: string, cartItemId: string) => {
    setGroups((prev) => {
      return prev
        .map((g) => {
          if (g.group_id !== groupId) return g;
          return {
            ...g,
            items: g.items.filter((it) => it.cart_item_id !== cartItemId),
          };
        })
        .filter((g) => g.items.length > 0);
    });
  };

  const clearCart = () => {
    setGroups([]);
  };

  const totalItemsCount = groups.reduce((acc, g) => acc + g.items.reduce((sum, it) => sum + it.quantity, 0), 0);

  const subtotal = groups.reduce(
    (acc, g) =>
      acc +
      g.items.reduce((sum, it) => {
        const baseAndAddons = it.item_total;
        return sum + baseAndAddons * it.quantity;
      }, 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        pets,
        activePet,
        setActivePet,
        loadPets,
        groups,
        addItemToBowl,
        updateItemQuantity,
        removeItem,
        clearCart,
        totalItemsCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
