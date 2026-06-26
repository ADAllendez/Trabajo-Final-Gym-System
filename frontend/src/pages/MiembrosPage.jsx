import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getMiembros, crearMiembro, actualizarMiembro, eliminarMiembro, toggleActivoMiembro } from "../api/miembros";
import { crearPagoDia } from "../api/pagosDia";
import { getDisciplinas } from "../api/disciplinas";
import { parsearError } from "../api/client";

const CARD  = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px" };
const INPUT = {
  backgroundColor: "#111111",
  border: "1px solid #2a2a2a",
  borderRadius: "8px",
  color: "#e5e7eb",
  padding: "8px 12px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
};
const LABEL = { color: "#9ca3af", fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" };

const EMPTY = { nombre: "", apellido: "", dni: "", correo: "", telefono: "", fecha_nacimiento: "", activo: true };

function BadgeActivo({ activo }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        backgroundColor: activo ? "#16a34a22" : "#4b556322",
        color: activo ? "#22c55e" : "#6b7280",
        border: activo ? "1px solid #16a34a44" : "1px solid #37415144",
      }}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

export default function MiembrosPage() {
  const [miembros, setMiembros]         = useState([]);
  const [disciplinas, setDisciplinas]   = useState([]);
  const [form, setForm]                 = useState(EMPTY);
  const [editId, setEditId]             = useState(null);
  const [busqueda, setBusqueda]         = useState("");
  const [filtroActivo, setFiltroActivo] = useState("todos"); // "todos" | "activos" | "inactivos"
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [panelPagoDia, setPanelPagoDia] = useState(false);
  const [formPagoDia, setFormPagoDia]   = useState({ nombre_visitante: "", disciplina: "", monto: "", fecha: new Date().toISOString().slice(0,10), notas: "" });
  const [cargando, setCargando]         = useState(false);
  const [error, setError]               = useState("");
  const [errorPago, setErrorPago]       = useState("");

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [m, d] = await Promise.all([getMiembros(), getDisciplinas()]);
      setMiembros(m); setDisciplinas(d);
    }
    catch { setError("Error al cargar miembros."); }
    finally { setCargando(false); }
  }

  async function handleSubmitPagoDia(e) {
    e.preventDefault(); setErrorPago("");
    try {
      await crearPagoDia({
        nombre_visitante: formPagoDia.nombre_visitante,
        disciplina: formPagoDia.disciplina || null,
        monto: parseFloat(formPagoDia.monto) || 0,
        fecha: formPagoDia.fecha,
        notas: formPagoDia.notas || null,
      });
      setPanelPagoDia(false);
      setFormPagoDia({ nombre_visitante: "", disciplina: "", monto: "", fecha: new Date().toISOString().slice(0,10), notas: "" });
    } catch (err) {
      setErrorPago(parsearError(err, "Error al registrar el pago."));
    }
  }

  function abrirNuevo() {
    setForm(EMPTY);
    setEditId(null);
    setError("");
    setPanelAbierto(true);
  }

  function abrirEdicion(m) {
    setForm({
      nombre: m.nombre ?? "",
      apellido: m.apellido ?? "",
      dni: m.dni ?? "",
      correo: m.correo ?? "",
      telefono: m.telefono ?? "",
      fecha_nacimiento: m.fecha_nacimiento ?? "",
      activo: m.activo ?? true,
    });
    setEditId(m.id_miembro);
    setError("");
    setPanelAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = { ...form, fecha_nacimiento: form.fecha_nacimiento || null };
    try {
      if (editId) await actualizarMiembro(editId, payload);
      else await crearMiembro(payload);
      await cargar();
      setPanelAbierto(false);
      setForm(EMPTY);
      setEditId(null);
    } catch (err) {
      setError(parsearError(err, "Error al guardar."));
    }
  }

  async function handleToggleActivo(m) {
    const accion = m.activo ? "desactivar" : "reactivar";
    if (!window.confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${m.nombre} ${m.apellido}? Sus datos se conservarán.`)) return;
    try { await toggleActivoMiembro(m.id_miembro); await cargar(); }
    catch { setError("Error al cambiar estado del miembro."); }
  }

  async function handleEliminar(id) {
    if (!window.confirm("¿Eliminar definitivamente este miembro? Esta acción no se puede deshacer.")) return;
    try { await eliminarMiembro(id); await cargar(); }
    catch { setError("Error al eliminar."); }
  }

  const filtrados = miembros.filter(m => {
    if (filtroActivo === "activos" && !m.activo) return false;
    if (filtroActivo === "inactivos" && m.activo) return false;
    const q = busqueda.toLowerCase();
    return (
      m.nombre?.toLowerCase().includes(q) ||
      m.apellido?.toLowerCase().includes(q) ||
      m.dni?.toLowerCase().includes(q) ||
      m.correo?.toLowerCase().includes(q)
    );
  });

  const totalActivos   = miembros.filter(m => m.activo).length;
  const totalInactivos = miembros.filter(m => !m.activo).length;

  return (
    <Layout>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Miembros</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            {miembros.length} miembro{miembros.length !== 1 ? "s" : ""} registrado{miembros.length !== 1 ? "s" : ""}
            {totalInactivos > 0 && (
              <span style={{ color: "#4b5563" }}>  ·  {totalInactivos} inactivo{totalInactivos !== 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setPanelPagoDia(true); setErrorPago(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
            style={{ backgroundColor: "#1a1a1a", color: "#22c55e", border: "1px solid #16a34a44" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a22"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#1a1a1a"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pago por día
          </button>
          <button onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
            style={{ backgroundColor: "#f97316" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ea6c0a"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f97316"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo miembro
          </button>
        </div>
      </div>

      {/* Filtros + Buscador */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {[
          { key: "todos",     label: `Todos (${miembros.length})`,       color: "#6b7280" },
          { key: "activos",   label: `Activos (${totalActivos})`,        color: "#22c55e" },
          { key: "inactivos", label: `Inactivos (${totalInactivos})`,    color: "#6b7280" },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setFiltroActivo(key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition"
            style={{
              backgroundColor: filtroActivo === key ? `${color}22` : "#1a1a1a",
              color: filtroActivo === key ? color : "#6b7280",
              border: filtroActivo === key ? `1px solid ${color}66` : "1px solid #2a2a2a",
            }}>
            {label}
          </button>
        ))}
        <input
          style={{ ...INPUT, maxWidth: "280px", marginLeft: "auto" }}
          placeholder="Buscar por nombre, DNI o correo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Error global */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#7f1d1d", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Tabla */}
      <div style={CARD}>
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "#f97316", borderTopColor: "transparent" }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "#4b5563" }}>
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p>No hay miembros que coincidan.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                {["Nombre completo", "DNI", "Correo", "Teléfono", "Estado", "Acciones"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#6b7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m, idx) => (
                <tr key={m.id_miembro}
                  style={{
                    borderBottom: idx < filtrados.length - 1 ? "1px solid #1f1f1f" : "none",
                    opacity: m.activo ? 1 : 0.55,
                  }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: m.activo ? "#f9731630" : "#37415130" }}>
                        <span style={{ color: m.activo ? "#f97316" : "#6b7280" }}>
                          {m.nombre.charAt(0)}{m.apellido.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {m.nombre} {m.apellido}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#9ca3af" }}>{m.dni || "—"}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#9ca3af" }}>{m.correo || "—"}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#9ca3af" }}>{m.telefono || "—"}</td>
                  <td className="px-4 py-3"><BadgeActivo activo={m.activo} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => abrirEdicion(m)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        style={{ backgroundColor: "#1f1f1f", color: "#9ca3af", border: "1px solid #2a2a2a" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                        onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
                        Editar
                      </button>
                      <button onClick={() => handleToggleActivo(m)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        title={m.activo ? "Desactivar miembro (conserva datos)" : "Reactivar miembro"}
                        style={{
                          backgroundColor: m.activo ? "#37415122" : "#16a34a22",
                          color: m.activo ? "#9ca3af" : "#22c55e",
                          border: m.activo ? "1px solid #37415144" : "1px solid #16a34a44",
                        }}>
                        {m.activo ? "Desactivar" : "Reactivar"}
                      </button>
                      <button onClick={() => handleEliminar(m.id_miembro)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                        style={{ backgroundColor: "#7f1d1d22", color: "#ef4444", border: "1px solid #7f1d1d44" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#7f1d1d44"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "#7f1d1d22"}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Panel lateral */}
      {panelAbierto && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-60" onClick={() => setPanelAbierto(false)} />
          <div className="w-96 flex flex-col h-full overflow-auto"
            style={{ backgroundColor: "#111111", borderLeft: "1px solid #2a2a2a" }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #2a2a2a" }}>
              <h2 className="text-base font-semibold text-white">
                {editId ? "Editar miembro" : "Nuevo miembro"}
              </h2>
              <button onClick={() => setPanelAbierto(false)} style={{ color: "#6b7280" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 px-6 py-5 gap-4">
              {error && (
                <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "#7f1d1d", color: "#fca5a5" }}>
                  {error}
                </div>
              )}
              {[
                { name: "nombre",   label: "Nombre *",          required: true },
                { name: "apellido", label: "Apellido *",         required: true },
                { name: "dni",      label: "DNI",                required: false },
                { name: "correo",   label: "Correo electrónico", required: false },
                { name: "telefono", label: "Teléfono",           required: false },
              ].map(({ name, label, required }) => (
                <div key={name}>
                  <label style={LABEL}>{label}</label>
                  <input
                    style={INPUT}
                    name={name}
                    required={required}
                    value={form[name]}
                    onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = "#f97316"}
                    onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                  />
                </div>
              ))}
              <div>
                <label style={LABEL}>Fecha de nacimiento</label>
                <input
                  type="date"
                  style={INPUT}
                  value={form.fecha_nacimiento}
                  onChange={e => setForm(p => ({ ...p, fecha_nacimiento: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                />
              </div>

              <div className="mt-auto pt-4 flex gap-3" style={{ borderTop: "1px solid #2a2a2a" }}>
                <button type="button" onClick={() => setPanelAbierto(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
                  style={{ backgroundColor: "#1f1f1f", color: "#9ca3af", border: "1px solid #2a2a2a" }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition"
                  style={{ backgroundColor: "#f97316" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ea6c0a"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f97316"}>
                  {editId ? "Guardar cambios" : "Crear miembro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Panel: Pago por día */}
      {panelPagoDia && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-60" onClick={() => setPanelPagoDia(false)} />
          <div className="w-[400px] flex flex-col h-full overflow-auto"
            style={{ backgroundColor: "#111111", borderLeft: "1px solid #2a2a2a" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #2a2a2a" }}>
              <div>
                <h2 className="text-base font-semibold text-white">Registrar pago por día</h2>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Clase suelta o visita de un día</p>
              </div>
              <button onClick={() => setPanelPagoDia(false)} style={{ color: "#6b7280" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitPagoDia} className="flex flex-col flex-1 px-6 py-5 gap-4">
              {errorPago && (
                <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "#7f1d1d", color: "#fca5a5" }}>
                  {errorPago}
                </div>
              )}
              <div>
                <label style={LABEL}>Nombre del visitante *</label>
                <input style={INPUT} required
                  placeholder="Ej: Juan Pérez"
                  value={formPagoDia.nombre_visitante}
                  onChange={e => setFormPagoDia(p => ({ ...p, nombre_visitante: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#22c55e"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
              </div>
              <div>
                <label style={LABEL}>Disciplina</label>
                <select style={{ ...INPUT, cursor: "pointer" }}
                  value={formPagoDia.disciplina}
                  onChange={e => setFormPagoDia(p => ({ ...p, disciplina: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#22c55e"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}>
                  <option value="">— Sin especificar —</option>
                  {disciplinas.map(d => (
                    <option key={d.id_disciplina} value={d.nombre}>{d.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LABEL}>Monto abonado ($) *</label>
                <input type="number" min="0" step="0.01" style={INPUT} required
                  placeholder="0.00"
                  value={formPagoDia.monto}
                  onChange={e => setFormPagoDia(p => ({ ...p, monto: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#22c55e"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
              </div>
              <div>
                <label style={LABEL}>Fecha *</label>
                <input type="date" style={INPUT} required
                  value={formPagoDia.fecha}
                  onChange={e => setFormPagoDia(p => ({ ...p, fecha: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#22c55e"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
              </div>
              <div>
                <label style={LABEL}>Notas (opcional)</label>
                <input style={INPUT}
                  placeholder="Ej: Vino con un amigo, preguntó por mensualidad..."
                  value={formPagoDia.notas}
                  onChange={e => setFormPagoDia(p => ({ ...p, notas: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#22c55e"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
              </div>
              <div className="mt-auto pt-4 flex gap-3" style={{ borderTop: "1px solid #2a2a2a" }}>
                <button type="button" onClick={() => setPanelPagoDia(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "#1f1f1f", color: "#9ca3af", border: "1px solid #2a2a2a" }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "#22c55e" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "#22c55e"}>
                  Registrar pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
