import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const DEMO_OWNER = {
  name: "Marcus Vance",
  email: "manager@wembleyturf.com",
  role: "Head Turf Operator / Owner",
  facility: "Wembley Sports Complex",
  avatar: "MV",
  badge: "Authorized Turf Owner",
  version: "Turf Engine v2.4 Commercial Edition"
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("turfease_owner_auth") === "true";
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("turfease_owner_user");
    return savedUser ? JSON.parse(savedUser) : DEMO_OWNER;
  });

  const login = (email, password) => {
    // Demo authentication for frontend demonstration
    setIsAuthenticated(true);
    const ownerData = {
      ...DEMO_OWNER,
      email: email || DEMO_OWNER.email,
    };
    setUser(ownerData);
    localStorage.setItem("turfease_owner_auth", "true");
    localStorage.setItem("turfease_owner_user", JSON.stringify(ownerData));
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("turfease_owner_auth");
    localStorage.removeItem("turfease_owner_user");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
