import { createContext, useContext, useState, useEffect } from 'react';
import { db, seedDemoData } from '../db';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeSacco, setActiveSacco] = useState(null);
  const [saccos, setSaccos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function init() {
      await seedDemoData();
      const all = await db.saccos.toArray();
      setSaccos(all);
      if (all.length > 0) setActiveSacco(all[0]);
      setLoading(false);
    }
    init();
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function refreshSaccos() {
    const all = await db.saccos.toArray();
    setSaccos(all);
  }

  return (
    <AppContext.Provider value={{ activeSacco, setActiveSacco, saccos, refreshSaccos, loading, showToast, toast }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
