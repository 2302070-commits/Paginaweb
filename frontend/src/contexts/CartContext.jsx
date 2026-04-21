import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user || user === false) { setItems([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setItems(data.items || []);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = async (product_id, quantity = 1) => {
    const { data } = await api.post("/cart", { product_id, quantity });
    setItems(data.items || []);
    setOpen(true);
  };
  const updateItem = async (product_id, quantity) => {
    const { data } = await api.put(`/cart/${product_id}`, { product_id, quantity });
    setItems(data.items || []);
  };
  const removeItem = async (product_id) => {
    const { data } = await api.delete(`/cart/${product_id}`);
    setItems(data.items || []);
  };
  const clearCart = async () => {
    const { data } = await api.delete("/cart");
    setItems(data.items || []);
  };

  const subtotal = items.reduce((s, it) => s + (it.product?.price || 0) * it.quantity, 0);
  const totalQty = items.reduce((s, it) => s + it.quantity, 0);

  return (
    <CartContext.Provider value={{ items, subtotal, totalQty, open, setOpen, loading, addItem, updateItem, removeItem, clearCart, refresh: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
