import React, { createContext, useState, useEffect } from "react";
import api from "../api/client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rolGuardado = localStorage.getItem("rol");
    const usernameGuardado = localStorage.getItem("usuario");

    if (token && rolGuardado) {
      setUsuario({ username: usernameGuardado, rol: rolGuardado });
    }
    setCargando(false);
  }, []);

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await api.post("/api/usuarios/login", formData);
    const token = res.data.access_token;
    localStorage.setItem("token", token);

    // Decodificar el JWT para obtener rol y sub
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);

    localStorage.setItem("rol", payload.rol);
    localStorage.setItem("usuario", payload.sub);
    localStorage.setItem("userId", payload.id);
    setUsuario({ username: payload.sub, rol: payload.rol, id: payload.id });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};