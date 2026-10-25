import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

const DEFAULT_OWNER = {
  name: "Vansh Tiwari",
  email: "owner@turfease.in",
  role: "Head Turf Operator / Owner",
  facility: "Greenfield Sports Complex, Pune",
  avatar: "VT",
  badge: "Authorized Turf Owner",
  version: "Turf Engine v2.4 Commercial Edition",
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("turfease_owner_auth") === "true";
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("turfease_owner_user");
    return savedUser ? JSON.parse(savedUser) : DEFAULT_OWNER;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem("turfease_jwt_token") || "";
  });

  // Verify active JWT token on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem("turfease_jwt_token");
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          if (res?.success && res.owner) {
            setUser((prev) => ({ ...prev, ...res.owner }));
            setIsAuthenticated(true);
          }
        } catch (err) {
          // Token expired or server unreachable
          if (err.status === 401) {
            logout();
          }
        }
      }
    };
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response?.success && response.token) {
        const ownerData = response.owner || {
          ...DEFAULT_OWNER,
          email,
        };
        setIsAuthenticated(true);
        setUser(ownerData);
        setToken(response.token);
        localStorage.setItem("turfease_jwt_token", response.token);
        localStorage.setItem("turfease_owner_auth", "true");
        localStorage.setItem("turfease_owner_user", JSON.stringify(ownerData));
        return { success: true, owner: ownerData };
      }
      throw new Error(response?.message || "Authentication failed");
    } catch (error) {
      // If network unreachable in local dev demo without backend, provide helpful fallback message
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(DEFAULT_OWNER);
    setToken("");
    localStorage.removeItem("turfease_jwt_token");
    localStorage.removeItem("turfease_owner_auth");
    localStorage.removeItem("turfease_owner_user");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
