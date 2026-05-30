import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    currency: 'RM',
    taxRate: 6,
    taxEnabled: true,
    shippingFlatRate: 5,
    storeName: 'HiperCom',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      const data = res.data;
      setSettings({
        currency: data.currency_symbol || 'RM',
        taxRate: data.tax?.rate || 6,
        taxEnabled: data.tax?.isActive !== false,
        shippingFlatRate: parseFloat(data.shipping_flat_rate) || 5,
        storeName: data.store_name || 'HiperCom',
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `${settings.currency} ${(price || 0).toFixed(2)}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, formatPrice, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
