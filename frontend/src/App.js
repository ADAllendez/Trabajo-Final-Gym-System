import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import LoginPages from "./pages/LoginPages";
import HomePage from "./pages/HomePage";

function RutaPrivada({ children }) {
  const { usuario, cargando } = useContext(AuthContext);
  if (cargando) return <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">Cargando...</div>;
  return usuario ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPages />} />
          <Route path="/" element={<RutaPrivada><HomePage /></RutaPrivada>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
