import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import LoginPages from "./pages/LoginPages";

function RutaPrivada({ children }) {
  const { usuario, cargando } = useContext(AuthContext);
  if (cargando) return <div>Cargando...</div>;
  return usuario ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPages />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
