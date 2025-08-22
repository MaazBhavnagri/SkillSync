"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { NotificationModal } from "../components/ui/Animatedmodal";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });

  const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

  const fetchWithTimeout = async (url, options = {}, timeoutMs = 20000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Verify session on initial load
  useEffect(() => {
    verifySession().finally(() => setLoading(false));
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/login`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      setUser(data.user);
      setModalVisible(true);
      setModalContent({
        title: "Login Successful",
        description: `Welcome back, ${data.user.name}!`,
      });

      return data.user;
    } catch (err) {
      setModalVisible(true);
      setModalContent({
        title: "Login Failed",
        description: err.message || "An error occurred",
      });
      console.error("Login error:", err);
      throw err;
    }
  };

  // Signup function
  const signup = async (email, password, name) => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/signup`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      setUser(data.user);
      setModalContent({
        title: "Signup Successful",
        description: `Welcome, ${data.user.name}!`,
      });
      setModalVisible(true);

      return data.user;
    } catch (err) {
      setModalContent({
        title: "Signup Failed",
        description: err.message || "An error occurred",
      });
      setModalVisible(true);
      console.error("Signup error:", err);
      throw err;
    }
  };

  // Verify session
  const verifySession = async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/verify-session`, { credentials: 'include' }, 5000);

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session verification error:", err);
      setUser(null);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await fetchWithTimeout(`${API_BASE}/logout`, {
        method: "POST",
        credentials: 'include',
      }, 4000);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  // Update user in memory only
  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
  };

  return (
    <>
      <NotificationModal
        show={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalContent.title}
        description={modalContent.description}
      />
      <AuthContext.Provider
        value={{
          user,
          login,
          signup,
          logout,
          updateUser,
          isAuthenticated: !!user,
          loading,
        }}
      >
        {children}
      </AuthContext.Provider>
    </>
  );
};
//   const verifyToken = async () => {
//   const token = localStorage.getItem("access_token");
//   console.log("Verifying token:", token);  // 🔍 Check token in devtools
//   if (!token) return;

//   try {
//     const res = await fetch("http://localhost:5000/api/verify", {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     const data = await res.json();
//     console.log("Verify response:", data);  // 🔍

//     if (res.ok) {
//       setUser(data.user);
//     } else {
//       console.warn("Token invalid:", data?.error);
//       logout();
//     }
//   } catch (err) {
//     console.error("Verify error:", err);
//     logout();
//   }
// };

// const login = async (email, password) => {
  //   // Simulate API call
  //   await new Promise((resolve) => setTimeout(resolve, 1500))

//   const userData = {
//     id: 1,
//     email,
//     name: email.split("@")[0],
//     avatar: "/placeholder.svg?height=40&width=40",
//     xp: 2450,
//     level: 12,
//     joinDate: new Date().toISOString(),
//   }

//   setUser(userData)
//   localStorage.setItem("user", JSON.stringify(userData))
//   return userData
// }

// const signup = async (email, password, name) => {
//   // Simulate API call
//   await new Promise((resolve) => setTimeout(resolve, 1500))

//   const userData = {
//     id: 1,
//     email,
//     name,
//     avatar: "/placeholder.svg?height=40&width=40",
//     xp: 0,
//     level: 1,
//     joinDate: new Date().toISOString(),
//   }

//   setUser(userData)
//   localStorage.setItem("user", JSON.stringify(userData))
//   return userData
// }

// useEffect(() => {
//   // Simulate checking for existing session
//   const checkAuth = async () => {
//     const savedUser = localStorage.getItem("user")
//     if (savedUser) {
//       setUser(JSON.parse(savedUser))
//     }
//     setLoading(false)
//   }

//   setTimeout(checkAuth, 1000) // Simulate API call delay
// }, [])
