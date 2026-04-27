const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = {
  login: async (credentials) => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) throw new Error("Login failed");
    return res.json();
  },

  /*signup: async (data) => {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Signup failed");
    return res.json();
  },*/
  signup: async (data) => {
    const res = await fetch(`${BASE_URL}/signup`, { // ✅ FIX HERE
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  
    if (!res.ok) throw new Error("Signup failed");
    return res.json();
  },

  getBalance: async (token) => {
    const res = await fetch(`${BASE_URL}/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  deposit: async (amount, token) => {
    const res = await fetch(`${BASE_URL}/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    return res.json();
  },

  withdraw: async (amount, token) => {
    const res = await fetch(`${BASE_URL}/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    return res.json();
  },

  getTransactions: async (token) => {
    const res = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  getMe: async (token) => {
    const res = await fetch(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    return res.json();
  },
};