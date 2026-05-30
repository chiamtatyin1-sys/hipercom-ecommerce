import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
      setSubtotal(0);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setItems(res.data.items);
      setSubtotal(res.data.subtotal);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      if (error.response?.status === 401) {
        setItems([]);
        setSubtotal(0);
      }
    }
  };

  const addToCart = async (productId, variantId = null, quantity = 1) => {
    try {
      await api.post('/cart/add', { productId, variantId, quantity });
      await fetchCart();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to add to cart' };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }
    try {
      await api.put(`/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`);
      await fetchCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setItems([]);
      setSubtotal(0);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      subtotal,
      itemCount,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);