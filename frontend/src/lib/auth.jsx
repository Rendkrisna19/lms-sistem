import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, TOKEN_STORAGE_KEY, UNAUTHORIZED_EVENT, USER_STORAGE_KEY } from "./api";

const AuthContext = createContext(null);

function readCachedUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStorage() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  // Sisa kunci versi lama
  localStorage.removeItem("lms_login_time");
}

/**
 * Sumber kebenaran sesi login. Data user selalu diverifikasi ulang ke server (/me),
 * sehingga role tidak bisa dimanipulasi lewat localStorage.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(() => (localStorage.getItem(TOKEN_STORAGE_KEY) ? readCachedUser() : null));
  const [isVerifying, setIsVerifying] = useState(() => !!localStorage.getItem(TOKEN_STORAGE_KEY));

  const endSession = useCallback(() => {
    clearStorage();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get("/me");
    updateUser(res.data.data);
    return res.data.data;
  }, [updateUser]);

  // Verifikasi token ke server setiap aplikasi dibuka
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      return;
    }
    let active = true;
    setIsVerifying(true);
    api
      .get("/me")
      .then((res) => active && updateUser(res.data.data))
      .catch((error) => {
        if (active && error.response?.status === 401) endSession();
      })
      .finally(() => active && setIsVerifying(false));
    return () => {
      active = false;
    };
  }, [token, updateUser, endSession]);

  // Token ditolak server di tengah sesi
  useEffect(() => {
    const handleUnauthorized = () => {
      if (!localStorage.getItem(TOKEN_STORAGE_KEY)) return;
      endSession();
      toast.warning("Sesi Anda telah berakhir. Silakan masuk kembali.");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [endSession]);

  const login = useCallback(
    async (nomorInduk, password) => {
      const res = await api.post("/login", { nomor_induk: nomorInduk, password });
      const { user: loggedInUser, token: newToken } = res.data.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      updateUser(loggedInUser);
      setToken(newToken);
      return loggedInUser;
    },
    [updateUser]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch {
      // Token mungkin sudah kedaluwarsa; sesi lokal tetap diakhiri
    } finally {
      endSession();
    }
  }, [endSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isAuthenticated: !!token && !!user,
      isVerifying,
      login,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, token, isVerifying, login, logout, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>.");
  }
  return context;
}
