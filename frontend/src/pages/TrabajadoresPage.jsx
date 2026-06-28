import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { parsearError } from "../api/client";
import { getUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from "../api/usuarios";

// ── Estilos compartidos ──────────────────────────────────
const CARD  = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px" };
const INPUT = {
  width: "100%", backgroundColor: "#111", border: "1px solid #2a2a2a",
  borderRadius: "8px", color: "#fff", padding: "9px 12px", fontSize: "14px", outline: "none",
};
const LABEL = { display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px", fontWeight: 500 };

// ── Formulario vacío ─────────────────────────────────────
const FORM_VACIO = {
  username: "", password: "", rol: "admin",
  nombre: "", apellido: "", edad: "",
  telefono: "", correo: "", dni: "",
  sueldo_mensual: "", dia_de_pago: "",
};

// ── Componente Badge de rol ───────────────────────────────
function BadgeRol({ rol }) {
  const esRoot = rol === "root";
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{
      backgroundColor: esRoot ? "#f9731622" : "#3b82f622",
      color: esRoot ? "#f97316" : "#3b82f6",
    }}>
      {rol}
    </span>
  );
}

// ── Modal de confirmación de eliminación ──────────────────
function ModalEliminar({ trabajador, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
      <div style={{ ...CARD, maxWidth: 400, width: "90%" }}>
        <h2 className="text-lg font-bold text-white mb-2">¿Eliminar trabajador?</h2>
        <p className="text-sm mb-6" style={{ color: "#9ca3af" }}>
          Vas a eliminar a <strong className="text-white">{trabajador.nombre} {trabajador.apellido}</strong>{" "}
          (<span style={{ color: "#f97316" }}>{trabajador.username}</span>). Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} style={{
            flex: 1, padding: "9px", borderRadius: "8px", backgroundColor: "#2a2a2a",
            color: "#9ca3af", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "9px", borderRadius: "8px", backgroundColor: "#ef4444",
            color: "#fff", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer",
          }}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de creación / edición ───────────────────────────
function ModalFormulario({ modo, datos, onChange, onGuardar, onCerrar, guardando, error }) {
  const esEdicion = modo === "editar";
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", overflowY: "auto" }}>
      <div style={{ ...CARD, width: "100%", maxWidth: 620, margin: "24px auto" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {esEdicion ? "✏️ Editar trabajador" : "➕ Nuevo trabajador"}
          </h2>
          <button onClick={onCerrar} style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" }}>
            {error}
          </div>
        )}

        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Nombre */}
          <div>
            <label style={LABEL}>Nombre</label>
            <input style={INPUT} value={datos.nombre} onChange={e => onChange("nombre", e.target.value)} placeholder="Juan" />
          </div>
          {/* Apellido */}
          <div>
            <label style={LABEL}>Apellido</label>
            <input style={INPUT} value={datos.apellido} onChange={e => onChange("apellido", e.target.value)} placeholder="Pérez" />
          </div>
          {/* Edad */}
          <div>
            <label style={LABEL}>Edad</label>
            <input style={INPUT} type="number" value={datos.edad} onChange={e => onChange("edad", e.target.value)} placeholder="28" />
          </div>
          {/* DNI */}
          <div>
            <label style={LABEL}>DNI</label>
            <input style={INPUT} value={datos.dni} onChange={e => onChange("dni", e.target.value)} placeholder="12345678" />
          </div>
          {/* Teléfono */}
          <div>
            <label style={LABEL}>Teléfono</label>
            <input style={INPUT} value={datos.telefono} onChange={e => onChange("telefono", e.target.value)} placeholder="+54 9 11..." />
          </div>
          {/* Correo */}
          <div>
            <label style={LABEL}>Correo</label>
            <input style={INPUT} type="email" value={datos.correo} onChange={e => onChange("correo", e.target.value)} placeholder="trabajador@email.com" />
          </div>
          {/* Sueldo */}
          <div>
            <label style={LABEL}>Sueldo mensual ($)</label>
            <input style={INPUT} type="number" value={datos.sueldo_mensual} onChange={e => onChange("sueldo_mensual", e.target.value)} placeholder="150000" />
          </div>
          {/* Día de cobro */}
          <div>
            <label style={LABEL}>Día de cobro (1–31)</label>
            <input style={INPUT} type="number" min="1" max="31"
              value={datos.dia_de_pago || ""}
              onChange={e => onChange("dia_de_pago", e.target.value)}
              placeholder="Ej: 5 = cobra el día 5 de cada mes" />
          </div>
          {/* Rol */}
          <div>
            <label style={LABEL}>Rol</label>
            <select style={{ ...INPUT, cursor: "pointer" }} value={datos.rol} onChange={e => onChange("rol", e.target.value)}>
              <option value="admin">admin</option>
            </select>
          </div>

          {/* Separador de acceso */}
          <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #2a2a2a", paddingTop: 16, marginTop: 4 }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#6b7280" }}>Credenciales de acceso</p>
          </div>

          {/* Username */}
          <div>
            <label style={LABEL}>Usuario (login)</label>
            <input style={INPUT} value={datos.username} onChange={e => onChange("username", e.target.value)} placeholder="juan.perez" />
          </div>
          {/* Password */}
          <div>
            <label style={LABEL}>Contraseña {esEdicion && <span style={{ color: "#6b7280", fontWeight: 400 }}>(dejar vacío = no cambiar)</span>}</label>
            <input style={INPUT} type="password" value={datos.password} onChange={e => onChange("password", e.target.value)} placeholder={esEdicion ? "••••••••" : "Mínimo 6 caracteres"} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCerrar} disabled={guardando} style={{
            flex: 1, padding: "10px", borderRadius: "8px", backgroundColor: "#2a2a2a",
            color: "#9ca3af", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={onGuardar} disabled={guardando} style={{
            flex: 2, padding: "10px", borderRadius: "8px",
            backgroundColor: guardando ? "#6b7280" : "#f97316",
            color: "#fff", fontSize: "14px", fontWeight: 700, border: "none", cursor: guardando ? "not-allowed" : "pointer",
          }}>
            {guardando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear trabajador"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────
export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores]   = useState([]);
  const [cargando, setCargando]           = useState(true);
  const [modal, setModal]                 = useState(null);   // null | "crear" | "editar"
  const [seleccionado, setSeleccionado]   = useState(null);   // para editar
  const [confirmarEliminar, setConfirmar] = useState(null);   // trabajador a eliminar
  const [form, setForm]                   = useState(FORM_VACIO);
  const [guardando, setGuardando]         = useState(false);
  const [error, setError]                 = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try { setTrabajadores(await getUsuarios()); }
    catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  function abrirCrear() {
    setForm(FORM_VACIO);
    setError("");
    setModal("crear");
  }

  function abrirEditar(t) {
    setSeleccionado(t);
    setForm({
      username: t.username || "", password: "",
      rol: t.rol || "admin",
      nombre: t.nombre || "", apellido: t.apellido || "",
      edad: t.edad || "", dni: t.dni || "",
      telefono: t.telefono || "", correo: t.correo || "",
      sueldo_mensual: t.sueldo_mensual || "",
      dia_de_pago: t.dia_de_pago || "",
    });
    setError("");
    setModal("editar");
  }

  function cerrarModal() { setModal(null); setSeleccionado(null); }

  function cambiarCampo(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function guardar() {
    setError("");
    // Validaciones básicas
    if (!form.nombre.trim() || !form.apellido.trim())
      return setError("Nombre y apellido son obligatorios.");
    if (!form.username.trim())
      return setError("El nombre de usuario es obligatorio.");
    if (modal === "crear" && form.password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.");

    const payload = {
      username: form.username.trim(),
      rol: form.rol,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      edad: form.edad ? Number(form.edad) : null,
      dni: form.dni.trim() || null,
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim() || null,
      sueldo_mensual: form.sueldo_mensual ? Number(form.sueldo_mensual) : null,
      dia_de_pago: form.dia_de_pago ? Number(form.dia_de_pago) : null,
    };

    if (modal === "crear") payload.password = form.password;
    if (modal === "editar" && form.password) payload.password = form.password;

    setGuardando(true);
    try {
      if (modal === "crear") {
        await crearUsuario(payload);
      } else {
        await actualizarUsuario(seleccionado.id_usuario, payload);
      }
      cerrarModal();
      cargar();
    } catch (e) {
      setError(parsearError(e, "Error al guardar. Revisá los datos."));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(t) {
    try {
      await eliminarUsuario(t.id_usuario);
      setConfirmar(null);
      cargar();
    } catch (e) {
      console.error(e);
    }
  }

  // ── Total de sueldos ─────────────────────────────────────
  const totalSueldos = trabajadores.reduce((acc, t) => acc + (t.sueldo_mensual || 0), 0);

  return (
    <Layout>
      {/* Modales */}
      {(modal === "crear" || modal === "editar") && (
        <ModalFormulario
          modo={modal} datos={form} onChange={cambiarCampo}
          onGuardar={guardar} onCerrar={cerrarModal}
          guardando={guardando} error={error}
        />
      )}
      {confirmarEliminar && (
        <ModalEliminar
          trabajador={confirmarEliminar}
          onConfirm={() => eliminar(confirmarEliminar)}
          onCancel={() => setConfirmar(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trabajadores</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Gestión de perfiles, accesos y sueldos del personal
          </p>
        </div>
        <button id="btn-nuevo-trabajador" onClick={abrirCrear} style={{
          display: "flex", alignItems: "center", gap: 8,
          backgroundColor: "#f97316", color: "#fff",
          padding: "9px 18px", borderRadius: "8px",
          fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer",
        }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo trabajador
        </button>
      </div>

      {/* Stat: total sueldos */}
      <div className="mb-6" style={{ ...CARD, display: "inline-flex", flexDirection: "column", minWidth: 220 }}>
        <p className="text-xs mb-1 uppercase font-semibold tracking-wider" style={{ color: "#6b7280" }}>
          Egreso mensual en sueldos
        </p>
        <p className="text-2xl font-bold" style={{ color: "#f97316" }}>
          ${totalSueldos.toLocaleString("es-AR")}
        </p>
        <p className="text-xs mt-1" style={{ color: "#4b5563" }}>{trabajadores.length} trabajador(es) registrado(s)</p>
      </div>

      {/* Tabla */}
      <div style={CARD}>
        {cargando ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: "#f97316", borderTopColor: "transparent" }} />
          </div>
        ) : trabajadores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-semibold text-white mb-1">Sin trabajadores aún</p>
            <p className="text-sm" style={{ color: "#6b7280" }}>Creá el primer perfil usando el botón de arriba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                  {["Nombre", "DNI", "Teléfono", "Correo", "Usuario", "Rol", "Sueldo/mes", ""].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trabajadores.map(t => (
                  <tr key={t.id_usuario} style={{ borderBottom: "1px solid #1f1f1f" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#111"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td style={{ padding: "12px" }}>
                      <p className="text-sm font-semibold text-white">{t.nombre} {t.apellido}</p>
                      {t.edad && <p className="text-xs" style={{ color: "#6b7280" }}>{t.edad} años</p>}
                    </td>
                    <td style={{ padding: "12px", fontSize: 13, color: "#9ca3af" }}>{t.dni || "—"}</td>
                    <td style={{ padding: "12px", fontSize: 13, color: "#9ca3af" }}>{t.telefono || "—"}</td>
                    <td style={{ padding: "12px", fontSize: 13, color: "#9ca3af" }}>{t.correo || "—"}</td>
                    <td style={{ padding: "12px" }}>
                      <span className="font-mono text-sm" style={{ color: "#f97316" }}>{t.username}</span>
                    </td>
                    <td style={{ padding: "12px" }}><BadgeRol rol={t.rol} /></td>
                    <td style={{ padding: "12px", fontSize: 13, fontWeight: 600, color: "#22c55e" }}>
                      {t.sueldo_mensual ? `$${Number(t.sueldo_mensual).toLocaleString("es-AR")}` : "—"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => abrirEditar(t)} style={{
                          padding: "5px 12px", borderRadius: "6px", fontSize: 12, fontWeight: 600,
                          backgroundColor: "#3b82f622", color: "#3b82f6", border: "none", cursor: "pointer",
                        }}>Editar</button>
                        <button onClick={() => setConfirmar(t)} style={{
                          padding: "5px 12px", borderRadius: "6px", fontSize: 12, fontWeight: 600,
                          backgroundColor: "#ef444422", color: "#ef4444", border: "none", cursor: "pointer",
                        }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
