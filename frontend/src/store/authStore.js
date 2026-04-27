/*import { create } from "zustand";
import { api } from "../services/api";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || null,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const data = await api.login(credentials);

      localStorage.setItem("token", data.access_token);
      set({ token: data.access_token, isLoading: false });

      return true;
    } catch (err) {
      set({ error: "Invalid credentials", isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null });
  },
}));*/
import { create } from "zustand";
import { api } from "../services/api";

export const useAuthStore = create((set) => ({
  // 🔐 State
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user")) || null,
  isLoading: false,
  error: null,

  // ✅ Set token (used in Google login)
  setToken: (token) => set({ token }),

  // ✅ Set user (used in Google login)
  setUser: (user) => set({ user }),

  // 🔑 Login (email/password)
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });

      const data = await api.login(credentials);

      // Save token
      localStorage.setItem("token", data.access_token);

      set({
        token: data.access_token,
        isLoading: false,
      });

      return true;
    } catch (err) {
      set({
        error: "Invalid credentials",
        isLoading: false,
      });
      return false;
    }
  },
  

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
  
      const res = await api.signup(data);
  
      localStorage.setItem("token", res.access_token);
  
      set({
        token: res.access_token,
        isLoading: false,
      });
  
      return true;
    } catch (err) {
      set({
        error: "Registration failed",
        isLoading: false,
      });
      return false;
    }
  },

  // 🆕 Register (you NEED this)
  /*register: async (userData) => {
    try {
      set({ isLoading: true, error: null });

      const data = await api.register(userData);

      localStorage.setItem("token", data.access_token);

      set({
        token: data.access_token,
        isLoading: false,
      });

      return true;
    } catch (err) {
      set({
        error: "Registration failed",
        isLoading: false,
      });
      return false;
    }
  },*/

  // 🚪 Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    set({
      token: null,
      user: null,
    });
  },
}));