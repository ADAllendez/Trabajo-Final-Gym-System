import React, { useContext, useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { crearUsuario, getUsuarios, eliminarUsuario, getMe, updateMe } from "../api/usuarios";

const navItems = [
  { to: "/", label: "Dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4.5 10.5V19a1.5 1.5 0 001.5 1.5h4.5V15h3v5.5H18A1.5 1.5 0 0019.5 19v-8.5" /></svg> },
  { to: "/miembros", label: "Miembros", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.197-3.794M9 20H4v-2a4 4 0 015.197-3.794M15 11a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { to: "/membresias", label: "Membresías", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg> },
  { to: "/disciplinas", label: "Disciplinas", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg> },
  { to: "/instructores", label: "Instructores", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> },
  { to: "/deudores", label: "Vencidos", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { to: "/finanzas", label: "Finanzas", rootOnly: true, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

const FORM_VACIO = { nombre: "", apellido: "", username: "", password: "" };
const INPUT_S = { width: "100%", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "7px", color: "#fff", padding: "8px 11px", fontSize: "13px", outline: "none", boxSizing: "border-box" };
const LABEL_S = { display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "4px", fontWeight: 600 };

function ModalGestion({ onClose }) {
  const [tab, setTab]           = useState("crear"); // "crear" | "lista"
  const [form, setForm]         = useState(FORM_VACIO);
  const [guardando, setGuard]   = useState(false);
  const [error, setError]       = useState("");
  const [exito, setExito]       = useState("");
  const [lista, setLista]       = useState([]);
  const [cargLista, setCargL]   = useState(false);
  const [confirmar, setConfirm] = useState(null);

  async function cargarLista() {
    setCargL(true);
    try { setLista(await getUsuarios()); } catch (e) { console.error(e); } finally { setCargL(false); }
  }

  function cambiarTab(t) { setTab(t); setError(""); setExito(""); if (t === "lista") cargarLista(); }

  function cambiar(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function crear(e) {
    e.preventDefault();
    setError(""); setExito("");
    if (!form.nombre.trim() || !form.apellido.trim()) return setError("Nombre y apellido son obligatorios.");
    if (!form.username.trim()) return setError("El usuario es obligatorio.");
    if (form.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    setGuard(true);
    try {
      await crearUsuario({ nombre: form.nombre.trim(), apellido: form.apellido.trim(), username: form.username.trim(), password: form.password, rol: "admin" });
      setExito(`✓ Cuenta "${form.username.trim()}" creada correctamente.`);
      setForm(FORM_VACIO);
      setTimeout(() => setExito(""), 4000);
    } catch (e) {
      setError(e?.response?.data?.detail || "Error al crear. Revisá los datos.");
    } finally { setGuard(false); }
  }

  async function eliminar(t) {
    try { await eliminarUsuario(t.id_usuario); setConfirm(null); cargarLista(); }
    catch (e) { console.error(e); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 320, marginLeft: 16, marginBottom: 80, backgroundColor: "#161616", border: "1px solid #2a2a2a", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>

        {/* Header modal */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg style={{ width: 16, height: 16, color: "#f97316" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Gestión de trabajadores</span>
          </div>
          <button onClick={onClose} style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a" }}>
          {[{ id: "crear", label: "Crear cuenta" }, { id: "lista", label: "Ver trabajadores" }].map(t => (
            <button key={t.id} onClick={() => cambiarTab(t.id)} style={{
              flex: 1, padding: "10px 0", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              backgroundColor: "transparent",
              color: tab === t.id ? "#f97316" : "#6b7280",
              borderBottom: tab === t.id ? "2px solid #f97316" : "2px solid transparent",
              transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab: Crear */}
        {tab === "crear" && (
          <form onSubmit={crear} style={{ padding: 18 }}>
            {exito && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 7, backgroundColor: "#16a34a22", color: "#22c55e", fontSize: 12, border: "1px solid #22c55e33" }}>{exito}</div>}
            {error && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 7, backgroundColor: "#ef444422", color: "#ef4444", fontSize: 12, border: "1px solid #ef444433" }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={LABEL_S}>Nombre</label>
                <input style={INPUT_S} value={form.nombre} onChange={e => cambiar("nombre", e.target.value)} placeholder="Juan" autoComplete="off" />
              </div>
              <div>
                <label style={LABEL_S}>Apellido</label>
                <input style={INPUT_S} value={form.apellido} onChange={e => cambiar("apellido", e.target.value)} placeholder="Pérez" autoComplete="off" />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={LABEL_S}>Usuario (para el login)</label>
              <input style={INPUT_S} value={form.username} onChange={e => cambiar("username", e.target.value)} placeholder="juan.perez" autoComplete="off" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_S}>Contraseña</label>
              <input style={INPUT_S} type="password" value={form.password} onChange={e => cambiar("password", e.target.value)} placeholder="Mín. 6 caracteres" autoComplete="new-password" />
            </div>

            <button type="submit" disabled={guardando} style={{
              width: "100%", padding: "9px", borderRadius: 8, border: "none", cursor: guardando ? "not-allowed" : "pointer",
              backgroundColor: guardando ? "#4b5563" : "#f97316", color: "#fff", fontSize: 13, fontWeight: 700,
            }}>
              {guardando ? "Creando..." : "Crear cuenta de trabajador"}
            </button>
          </form>
        )}

        {/* Tab: Lista */}
        {tab === "lista" && (
          <div style={{ padding: 18 }}>
            {cargLista ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #f97316", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              </div>
            ) : lista.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: "#6b7280", fontSize: 13 }}>No hay trabajadores creados aún.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lista.map(t => (
                  <div key={t.id_usuario} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, backgroundColor: "#111", border: "1px solid #1f1f1f" }}>
                    {confirmar?.id_usuario === t.id_usuario ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                        <span style={{ fontSize: 11, color: "#ef4444", flex: 1 }}>¿Eliminar {t.username}?</span>
                        <button onClick={() => eliminar(t)} style={{ padding: "3px 8px", borderRadius: 5, border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Sí</button>
                        <button onClick={() => setConfirm(null)} style={{ padding: "3px 8px", borderRadius: 5, border: "none", backgroundColor: "#2a2a2a", color: "#9ca3af", fontSize: 11, cursor: "pointer" }}>No</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{t.nombre || ""} {t.apellido || ""}</p>
                          <p style={{ fontSize: 11, color: "#3b82f6", margin: 0, fontFamily: "monospace" }}>@{t.username}</p>
                          {t.sueldo_mensual > 0 && (
                            <p style={{ fontSize: 11, color: "#22c55e", margin: "2px 0 0", fontWeight: 600 }}>
                              💰 ${Number(t.sueldo_mensual).toLocaleString("es-AR")}/mes
                            </p>
                          )}
                        </div>
                        <button onClick={() => setConfirm(t)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #ef444433", backgroundColor: "#ef444415", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Layout({ children }) {
  const { usuario, logout } = useContext(AuthContext);
  const [modalAbierto, setModal]   = useState(false);
  const [perfilAbierto, setPerfil] = useState(false);
  const [perfil, setPData]         = useState(null);
  const [formP, setFormP]          = useState({});
  const [guardandoP, setGuardP]    = useState(false);
  const [exitoP, setExitoP]        = useState("");
  const [errorP, setErrorP]        = useState("");
  const fotoRef = useRef(null);

  async function abrirPerfil() {
    setPerfil(true);
    setExitoP(""); setErrorP("");
    try {
      const data = await getMe();
      setPData(data);
      setFormP({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        dni: data.dni || "",
        fecha_contratacion: data.fecha_contratacion || "",
        sueldo_mensual: data.sueldo_mensual || "",
        foto: data.foto || "",
      });
    } catch (e) { console.error(e); }
  }

  function cambiarP(k, v) { setFormP(p => ({ ...p, [k]: v })); }

  function manejarFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => cambiarP("foto", reader.result);
    reader.readAsDataURL(file);
  }

  async function guardarPerfil(e) {
    e.preventDefault();
    setGuardP(true); setErrorP(""); setExitoP("");
    try {
      await updateMe({
        nombre: formP.nombre || null,
        apellido: formP.apellido || null,
        telefono: formP.telefono || null,
        dni: formP.dni || null,
        fecha_contratacion: formP.fecha_contratacion || null,
        // sueldo_mensual solo lo puede editar el root desde Trabajadores
        foto: formP.foto || null,
      });
      setExitoP("✓ Perfil actualizado correctamente.");
      setTimeout(() => setExitoP(""), 3500);
    } catch (e) {
      setErrorP(e?.response?.data?.detail || "Error al guardar el perfil.");
    } finally { setGuardP(false); }
  }

  const esRoot = usuario?.rol === "root";
  const IS = { width: "100%", backgroundColor: "#0f0f0f", border: "1px solid #333", borderRadius: "7px", color: "#fff", padding: "8px 11px", fontSize: "13px", outline: "none", boxSizing: "border-box" };
  const LS = { display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "4px", fontWeight: 600 };


  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#0f0f0f" }}>
      {/* Modal de gestión de trabajadores */}
      {modalAbierto && <ModalGestion onClose={() => setModal(false)} />}

      {/* Modal de perfil propio */}
      {perfilAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={() => setPerfil(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 420, backgroundColor: "#161616", border: "1px solid #2a2a2a", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", maxHeight: "90vh", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Mi perfil</span>
              <button onClick={() => setPerfil(false)} style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            <form onSubmit={guardarPerfil} style={{ padding: 20 }}>
              {exitoP && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 7, backgroundColor: "#16a34a22", color: "#22c55e", fontSize: 12, border: "1px solid #22c55e33" }}>{exitoP}</div>}
              {errorP && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 7, backgroundColor: "#ef444422", color: "#ef4444", fontSize: 12, border: "1px solid #ef444433" }}>{errorP}</div>}

              {/* Foto */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
                <div
                  onClick={() => fotoRef.current?.click()}
                  style={{ width: 80, height: 80, borderRadius: "50%", border: "2px dashed #f97316", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#111", position: "relative" }}
                  title="Click para cambiar foto"
                >
                  {formP.foto ? (
                    <img src={formP.foto} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg style={{ width: 32, height: 32, color: "#4b5563" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>Click en la foto para cambiarla</p>
                <input ref={fotoRef} type="file" accept="image/*" onChange={manejarFoto} style={{ display: "none" }} />
              </div>

              {/* Campos base */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div><label style={LS}>Nombre</label><input style={IS} value={formP.nombre || ""} onChange={e => cambiarP("nombre", e.target.value)} placeholder="Juan" /></div>
                <div><label style={LS}>Apellido</label><input style={IS} value={formP.apellido || ""} onChange={e => cambiarP("apellido", e.target.value)} placeholder="Pérez" /></div>
              </div>

              {/* Campos extra solo para trabajadores */}
              {!esRoot && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div><label style={LS}>Teléfono</label><input style={IS} value={formP.telefono || ""} onChange={e => cambiarP("telefono", e.target.value)} placeholder="+54 9 11..." /></div>
                    <div><label style={LS}>DNI</label><input style={IS} value={formP.dni || ""} onChange={e => cambiarP("dni", e.target.value)} placeholder="12345678" /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div><label style={LS}>Fecha de inicio</label><input style={IS} type="date" value={formP.fecha_contratacion || ""} onChange={e => cambiarP("fecha_contratacion", e.target.value)} /></div>
                    <div><label style={LS}>Mensualidad ($)</label><input type="number" value={formP.sueldo_mensual || ""} readOnly style={{ ...IS, color: "#9ca3af", cursor: "not-allowed" }} title="Solo el administrador puede modificar el sueldo" /></div>
                  </div>
                </>
              )}

              <button type="submit" disabled={guardandoP} style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", cursor: guardandoP ? "not-allowed" : "pointer", backgroundColor: guardandoP ? "#4b5563" : "#f97316", color: "#fff", fontSize: 13, fontWeight: 700, marginTop: 6 }}>
                {guardandoP ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 flex flex-col" style={{ backgroundColor: "#111111", borderRight: "1px solid #2a2a2a" }}>
        {/* Logo */}
        <div className="px-6 py-5" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f97316" }}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">GYM Manager</h1>
              <p className="text-xs" style={{ color: "#6b7280" }}>Panel de control</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#4b5563" }}>Menú principal</p>
          <ul className="space-y-1">
            {navItems
              .filter(item => !item.rootOnly || usuario?.rol === "root")
              .map(({ to, label, icon }) => (
                <li key={to}>
                  <NavLink
                    to={to} end={to === "/"}
                    className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? "text-white" : "hover:text-white"}`}
                    style={({ isActive }) => ({ backgroundColor: isActive ? "#f97316" : "transparent", color: isActive ? "#ffffff" : "#9ca3af" })}
                    onMouseEnter={e => { if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.backgroundColor = "#1f1f1f"; }}
                    onMouseLeave={e => { if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {icon}{label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>

        {/* Footer — Perfil */}
        <div style={{ borderTop: "1px solid #2a2a2a" }}>
          {usuario && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
              {/* Avatar — clickeable para editar perfil */}
              <div
                onClick={abrirPerfil}
                title="Editar mi perfil"
                style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: usuario.rol === "root" ? "#f9731622" : "#3b82f622", border: `2px solid ${usuario.rol === "root" ? "#f97316" : "#3b82f6"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", overflow: "hidden" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                {formP.foto ? (
                  <img src={formP.foto} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg style={{ width: 16, height: 16, color: usuario.rol === "root" ? "#f97316" : "#3b82f6" }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, textTransform: "capitalize" }}>{usuario.username}</p>
                <p style={{ fontSize: 11, color: usuario.rol === "root" ? "#f97316" : "#3b82f6", margin: 0 }}>
                  {usuario.rol === "root" ? "Administrador root" : "Trabajador"}
                </p>
              </div>

              {/* ⚙️ Botón engranaje — solo root */}
              {usuario.rol === "root" && (
                <button
                  id="btn-config-trabajadores"
                  title="Gestionar trabajadores"
                  onClick={() => setModal(true)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 7, color: "#6b7280", transition: "all 0.15s", flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#f9731622"; e.currentTarget.style.color = "#f97316"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#6b7280"; }}
                >
                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Cerrar sesión */}
          <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={logout} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
              onMouseLeave={e => e.currentTarget.style.color = "#ef4444"}>
              Cerrar Sesión
            </button>
            <p style={{ fontSize: 11, color: "#4b5563", margin: 0 }}>© 2026</p>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 overflow-auto px-6 py-6" style={{ backgroundColor: "#0f0f0f" }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;