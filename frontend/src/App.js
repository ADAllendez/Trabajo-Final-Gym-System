import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import LoginPages from "./pages/LoginPages";
import HomePage from "./pages/HomePage";
import MiembrosPage from "./pages/MiembrosPage";
import DisciplinasPage from "./pages/DisciplinasPage";
import InstructoresPage from "./pages/InstructoresPage";
import MembresiaPage from "./pages/MembresiaPage";
import DeudoresPage from "./pages/DeudoresPage";
import TrabajadoresPage from "./pages/TrabajadoresPage";
import PerfilPage from "./pages/PerfilPage";
import FinanzasPage from "./pages/FinanzasPage";


function RutaPrivada({ children }) {
  const { usuario, cargando } = useContext(AuthContext);

  if (cargando) return <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center text-2xl font-bold">Cargando aplicación...</div>;

  return usuario ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPages />} />
          <Route path="/" element={<RutaPrivada><HomePage /></RutaPrivada>} />
          <Route path="/miembros" element={<RutaPrivada><MiembrosPage /></RutaPrivada>} />
          <Route path="/disciplinas" element={<RutaPrivada><DisciplinasPage /></RutaPrivada>} />
          <Route path="/instructores" element={<RutaPrivada><InstructoresPage /></RutaPrivada>} />
          <Route path="/membresias" element={<RutaPrivada><MembresiaPage /></RutaPrivada>} />
          <Route path="/deudores" element={<RutaPrivada><DeudoresPage /></RutaPrivada>} />
          <Route path="/trabajadores" element={<RutaPrivada><TrabajadoresPage /></RutaPrivada>} />
          <Route path="/perfil" element={<RutaPrivada><PerfilPage /></RutaPrivada>} />
          <Route path="/finanzas" element={<RutaPrivada><FinanzasPage /></RutaPrivada>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

