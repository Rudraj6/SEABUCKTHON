import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'sbh-customer-token';
const USER_KEY = 'sbh-customer';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || ''
  );
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY))
  );
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  });

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken('');
    setCustomer(null);
  }, []);

  const saveSession = useCallback((nextToken, nextCustomer) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextCustomer));
    setToken(nextToken);
    setCustomer(nextCustomer);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    let alive = true;
    fetch('/api/account/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        if (alive) {
          setCustomer(data.customer);
          localStorage.setItem(USER_KEY, JSON.stringify(data.customer));
        }
      })
      .catch(() => {
        if (alive) signOut();
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, signOut]);

  const value = useMemo(
    () => ({
      token,
      customer,
      isLoading,
      isSignedIn: Boolean(token && customer),
      saveSession,
      signOut,
    }),
    [token, customer, isLoading, saveSession, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
