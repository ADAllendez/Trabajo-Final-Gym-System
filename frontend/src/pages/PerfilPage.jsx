import React, { useContext, useEffect, useState } from "react";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { parsearError } from "../api/client";
import { getUsuarios, crearUsuario, eliminarUsuario } from "../api/usuarios";

// ── Estilos base ─────────────────────────────────────────
const CARD  = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px" };
const INPUT = {
  width: "100%", backgroundColor: "#111", border: "1px solid #333",
  borderRadius: "8px", color: "#fff", padding: "9px 12px",
  fontSize: "14px", outline: "none", boxSizing: "border-box",
};
const LABEL = { display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "5px", fontWeight: 600 };

// ── Modal de confirmación ─────────────────────────────────
function ModalEliminar({ nombre, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
      <div style={{ ...CARD, maxWidth: 380, width: "90%" }}>
        <h2 className="text-base font-bold text-white mb-2">¿Eliminar trabajador?</h2>
        <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>
          Se eliminará la cuenta de <strong className="text-white">{nombre}</strong>. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} style={{ flex: 1, padding: "8px", borderRadius: "8px", backgroundColor: "#2a2a2a", color: "#9ca3af", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "8px", borderRadius: "8px", backgroundColor: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ── Página de Perfil ──────────────────────────────────────
export default function PerfilPage() {
  const { usuario } = useContext(AuthContext);

  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [eliminando, setEliminar]       = useState(null); // trabajador a confirmar eliminación
  const [guardando, setGuardando]       = useState(false);
  const [exito, setExito]               = useState("");
  const [error, setError]               = useState("");

  const [form, setForm] = useState({
    nombre: "", apellido: "", username: "", password: "",
  });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try { setTrabajadores(await getUsuarios()); }
    catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  function cambiar(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function crearCuenta(e) {
    e.preventDefault();
    setError(""); setExito("");

    if (!form.nombre.trim() || !form.apellido.trim())
      return setError("Nombre y apellido son obligatorios.");
    if (!form.username.trim())
      return setError("El nombre de usuario es obligatorio.");
    if (form.password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.");

    setGuardando(true);
    try {
      await crearUsuario({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        username: form.username.trim(),
        password: form.password,
        rol: "admin",
      });
      setForm({ nombre: "", apellido: "", username: "", password: "" });
      setExito(`✓ Cuenta de "${form.username.trim()}" creada exitosamente.`);
      cargar();
      setTimeout(() => setExito(""), 4000);
    } catch (e) {
      setError(parsearError(e, "Error al crear la cuenta. Revisá los datos."));
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar(t) {
    try {
      await eliminarUsuario(t.id_usuario);
      setEliminar(null);
      cargar();
    } catch (e) { console.error(e); }
  }

  return (
    <Layout>
      {eliminando && (
        <ModalEliminar
          nombre={`${eliminando.nombre || ""} ${eliminando.apellido || ""} (${eliminando.username})`}
          onConfirm={() => confirmarEliminar(eliminando)}
          onCancel={() => setEliminar(null)}
        />
      )}

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          Gestión de tu cuenta y trabajadores del sistema
        </p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1.4fr" }}>

        {/* ── Columna izquierda: info de root ── */}
        <div className="flex flex-col gap-5">

          {/* Card de perfil root */}
          <div style={CARD}>
            {/* Avatar grande */}
            <div className="flex flex-col items-center text-center mb-6">
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                backgroundColor: "#f9731620",
                border: "3px solid #f97316",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                <svg style={{ width: 34, height: 34, color: "#f97316" }} fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-white capitalize">{usuario?.username}</p>
              <span style={{
                display: "inline-block", marginTop: 6,
                padding: "3px 12px", borderRadius: 999,
                backgroundColor: "#f9731622", color: "#f97316",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
              }}>
                ROOT — Dueño del Gym
              </span>
            </div>

            {/* Detalles */}
            <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: 18 }} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "#6b7280" }}>Rol</span>
                <span className="text-sm font-semibold" style={{ color: "#f97316" }}>Administrador Root</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "#6b7280" }}>Acceso</span>
                <span className="text-sm font-semibold text-white">Total (sin restricciones)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "#6b7280" }}>Trabajadores activos</span>
                <span className="text-sm font-bold" style={{ color: "#22c55e" }}>{trabajadores.length}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Columna derecha: gestión de trabajadores ── */}
        <div className="flex flex-col gap-5">

          {/* Formulario crear trabajador */}
          <div style={CARD}>
            <h2 className="text-base font-bold text-white mb-1">Crear cuenta de trabajador</h2>
            <p className="text-xs mb-5" style={{ color: "#6b7280" }}>
              El trabajador podrá iniciar sesión y acceder al sistema (excepto Finanzas).
            </p>

            {exito && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: "#16a34a22", color: "#22c55e", border: "1px solid #22c55e44" }}>
                {exito}
              </div>
            )}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" }}>
                {error}
              </div>
            )}

            <form onSubmit={crearCuenta}>
              <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label style={LABEL}>Nombre</label>
                  <input
                    id="input-nombre-trabajador"
                    style={INPUT} value={form.nombre}
                    onChange={e => cambiar("nombre", e.target.value)}
                    placeholder="Ej: Juan"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label style={LABEL}>Apellido</label>
                  <input
                    id="input-apellido-trabajador"
                    style={INPUT} value={form.apellido}
                    onChange={e => cambiar("apellido", e.target.value)}
                    placeholder="Ej: Pérez"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: 16, marginBottom: 16 }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#4b5563" }}>
                  Credenciales de acceso
                </p>
                <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <label style={LABEL}>Usuario</label>
                    <input
                      id="input-username-trabajador"
                      style={INPUT} value={form.username}
                      onChange={e => cambiar("username", e.target.value)}
                      placeholder="Ej: juan.perez"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label style={LABEL}>Contraseña</label>
                    <input
                      id="input-password-trabajador"
                      style={INPUT} type="password"
                      value={form.password}
                      onChange={e => cambiar("password", e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                id="btn-crear-trabajador"
                disabled={guardando}
                style={{
                  width: "100%", padding: "10px",
                  backgroundColor: guardando ? "#6b7280" : "#f97316",
                  color: "#fff", border: "none", borderRadius: "8px",
                  fontSize: 14, fontWeight: 700,
                  cursor: guardando ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s",
                }}
              >
                {guardando ? "Creando cuenta..." : "✓ Crear cuenta"}
              </button>
            </form>
          </div>

          {/* Lista de trabajadores */}
          <div style={CARD}>
            <h2 className="text-base font-bold text-white mb-4">
              Trabajadores con acceso
              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#f9731622", color: "#f97316" }}>
                {trabajadores.length}
              </span>
            </h2>

            {cargando ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: "#f97316", borderTopColor: "transparent" }} />
              </div>
            ) : trabajadores.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-semibold text-white mb-1">Sin trabajadores aún</p>
                <p className="text-xs" style={{ color: "#4b5563" }}>Usá el formulario de arriba para crear el primero.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trabajadores.map(t => (
                  <div key={t.id_usuario}
                    className="flex items-center justify-between px-4 py-3 rounded-lg"
                    style={{ backgroundColor: "#111", border: "1px solid #1f1f1f" }}>
                    <div className="flex items-center gap-3">
                      {/* Mini avatar */}
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        backgroundColor: "#3b82f622", border: "2px solid #3b82f6",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <svg style={{ width: 16, height: 16, color: "#3b82f6" }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {t.nombre || ""} {t.apellido || ""}
                          {!t.nombre && !t.apellido && <span style={{ color: "#6b7280" }}>Sin nombre</span>}
                        </p>
                        <p className="text-xs font-mono" style={{ color: "#3b82f6" }}>@{t.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEliminar(t)}
                      style={{
                        padding: "5px 12px", borderRadius: "6px", fontSize: 12, fontWeight: 600,
                        backgroundColor: "#ef444422", color: "#ef4444",
                        border: "1px solid #ef444433", cursor: "pointer",
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
