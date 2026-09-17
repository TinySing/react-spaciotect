import React, { createContext, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 1900);
    return () => window.clearTimeout(timer);
  }, [message]);
  return <ToastContext.Provider value={setMessage}>{children}{message && <div className="toast show">{message}</div>}</ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext);
}

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* local storage is optional */ }
  }, [key, value]);
  return [value, setValue];
}
