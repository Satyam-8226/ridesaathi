/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import API from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Restore user on refresh
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");

        // ❗ No token → auth check finished
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await API.get("/auth/me");
        setUser(res.data);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // 🔑 LOGIN (single source of truth)
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    setUser(userData);
    setLoading(false); // important
  };

  // 🔓 LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
