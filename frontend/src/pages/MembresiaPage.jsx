import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getMembresias, crearMembresia, actualizarMembresia, eliminarMembresia, renovarMembresia } from "../api/membresias";
import { getMiembros } from "../api/miembros";
import { getDisciplinas } from "../api/disciplinas";
import api, { parsearError } from "../api/client";

const CARD  = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px" };
const INPUT = {
  backgroundColor: "#111111", border: "1px solid #2a2a2a", borderRadius: "8px",
  color: "#e5e7eb", padding: "8px 12px", width: "100%", fontSize: "14px", outline: "none",
};
const LABEL = { color: "#9ca3af", fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" };

const ESTADOS = {
  activo:  { bg: "#16a34a22", color: "#22c55e",  label: "Activo"  },
  vencido: { bg: "#dc262622", color: "#ef4444",  label: "Vencido" },
  nuevo:   { bg: "#2563eb22", color: "#60a5fa",  label: "Nuevo"   },
};

function BadgeEstado({ estado }) {
  const s = ESTADOS[estado] ?? ESTADOS.nuevo;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function BadgeTipo({ esNuevo }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        backgroundColor: esNuevo ? "#7c3aed22" : "#0369a122",
        color: esNuevo ? "#a78bfa" : "#38bdf8",
        border: esNuevo ? "1px solid #7c3aed44" : "1px solid #0369a144",
        marginLeft: 6,
      }}
    >
      {esNuevo ? "Nuevo" : "Retorno"}
    </span>
  );
}

function formatFecha(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-AR");
}

const hoy = () => new Date().toISOString().slice(0, 10);
const en30 = () => {
  const d = new Date(); d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  id_miembro: "", id_disciplina: "",
  fecha_inicio: hoy(), fecha_vencimiento: en30(),
  estado: "nuevo", precio_abonado: "",
};

export default function MembresiaPage() {
  const [membresias, setMembresias]   = useState([]);
  const [miembros, setMiembros]       = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);

  const [form, setForm]               = useState(EMPTY_FORM);
  const [editId, setEditId]           = useState(null);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda, setBusqueda]       = useState("");
  const [error, setError]             = useState("");
  const [cargando, setCargando]       = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [mem, mi, di] = await Promise.all([
        getMembresias(), getMiembros(), getDisciplinas(),
      ]);
      setMembresias(mem); setMiembros(mi); setDisciplinas(di);
    } catch { setError("Error al cargar datos."); }
    finally { setCargando(false); }
  }

  // Verificar vencidos y desactivar miembros automáticamente al cargar la página
  useEffect(() => {
    api.post("/membresias/check-vencidos").catch(() => {});
  }, []);

  function abrirNuevo() {
    setForm(EMPTY_FORM); setEditId(null); setError(""); setPanelAbierto(true);
  }

  function abrirEdicion(m) {
    setForm({
      id_miembro: m.id_miembro, id_disciplina: m.id_disciplina,
      fecha_inicio: m.fecha_inicio, fecha_vencimiento: m.fecha_vencimiento,
      estado: m.estado, precio_abonado: String(m.precio_abonado),
    });
    setEditId(m.id_membresia); setError(""); setPanelAbierto(true);
  }

  // Al cambiar disciplina, auto-rellenar precio
  function handleDisciplinaChange(e) {
    const id = e.target.value;
    const disc = disciplinas.find(d => d.id_disciplina === Number(id));
    setForm(p => ({ ...p, id_disciplina: id, precio_abonado: disc ? String(disc.precio_mensual) : p.precio_abonado }));
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError("");
    const payload = {
      id_miembro: Number(form.id_miembro),
      id_disciplina: Number(form.id_disciplina),
      fecha_inicio: form.fecha_inicio,
      fecha_vencimiento: form.fecha_vencimiento,
      estado: form.estado,
      precio_abonado: parseFloat(form.precio_abonado) || 0,
    };
    try {
      if (editId) await actualizarMembresia(editId, payload);
      else await crearMembresia(payload);
      await cargar(); setPanelAbierto(false);
    } catch (err) {
      setError(parsearError(err, "Error al guardar."));
    }
  }

  async function handleRenovar(id) {
    if (!window.confirm("¿Renovar esta membresía por 30 días más desde hoy?")) return;
    try { await renovarMembresia(id); await cargar(); }
    catch (err) { setError(parsearError(err, "Error al renovar.")); }
  }

  async function handleEliminar(id) {
    if (!window.confirm("¿Eliminar esta membresía?")) return;
    try { await eliminarMembresia(id); await cargar(); }
    catch { setError("Error al eliminar."); }
  }

  const filtradas = membresias.filter(m => {
    if (filtroEstado !== "todos" && m.estado !== filtroEstado) return false;
    const q = busqueda.toLowerCase();
    if (!q) return true;
    return (
      m.nombre_miembro?.toLowerCase().includes(q) ||
      m.nombre_disciplina?.toLowerCase().includes(q)
    );
  });

  const totalActivos  = membresias.filter(m => m.estado === "activo").length;
  const totalVencidos = membresias.filter(m => m.estado === "vencido").length;
  const totalNuevos   = membresias.filter(m => m.estado === "nuevo").length;

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Membresías</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            {membresias.length} membresía{membresias.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: "#f97316" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ea6c0a"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f97316"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva membresía
        </button>
      </div>

      {/* Chips de estado */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {[
          { key: "todos",   label: `Todas (${membresias.length})`,  color: "#6b7280" },
          { key: "activo",  label: `Activas (${totalActivos})`,     color: "#22c55e" },
          { key: "vencido", label: `Vencidas (${totalVencidos})`,   color: "#ef4444" },
          { key: "nuevo",   label: `Nuevas (${totalNuevos})`,       color: "#60a5fa" },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setFiltroEstado(key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition"
            style={{
              backgroundColor: filtroEstado === key ? `${color}22` : "#1a1a1a",
              color: filtroEstado === key ? color : "#6b7280",
              border: filtroEstado === key ? `1px solid ${color}66` : "1px solid #2a2a2a",
            }}>
            {label}
          </button>
        ))}
        <input
          style={{ ...INPUT, maxWidth: "240px", marginLeft: "auto" }}
          placeholder="Buscar miembro o disciplina…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

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
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "#4b5563" }}>
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <p>No hay membresías con este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                  {["Miembro","Disciplina","Inicio","Vencimiento","Precio","Estado","Acciones"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#6b7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((m, idx) => (
                  <tr key={m.id_membresia}
                    style={{ borderBottom: idx < filtradas.length - 1 ? "1px solid #1f1f1f" : "none" }}>
                    <td className="px-4 py-3 text-sm font-medium text-white whitespace-nowrap">
                      {m.nombre_miembro}
                      <BadgeTipo esNuevo={m.es_nuevo} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#f9731620", color: "#f97316" }}>
                        {m.nombre_disciplina}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#9ca3af" }}>
                      {formatFecha(m.fecha_inicio)}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#9ca3af" }}>
                      {formatFecha(m.fecha_vencimiento)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap">
                      ${m.precio_abonado?.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3"><BadgeEstado estado={m.estado} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-nowrap">
                        {(m.estado === "vencido" || m.estado === "activo") && (
                          <button onClick={() => handleRenovar(m.id_membresia)}
                            title="Renovar membresía"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                            style={{ backgroundColor: "#16a34a22", color: "#22c55e", border: "1px solid #16a34a44" }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#16a34a44"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#16a34a22"}>
                            Renovar
                          </button>
                        )}
                        <button onClick={() => abrirEdicion(m)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: "#1f1f1f", color: "#9ca3af", border: "1px solid #2a2a2a" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                          onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
                          Editar
                        </button>
                        <button onClick={() => handleEliminar(m.id_membresia)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: "#7f1d1d22", color: "#ef4444", border: "1px solid #7f1d1d44" }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel lateral */}
      {panelAbierto && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-60" onClick={() => setPanelAbierto(false)} />
          <div className="w-[420px] flex flex-col h-full overflow-auto"
            style={{ backgroundColor: "#111111", borderLeft: "1px solid #2a2a2a" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #2a2a2a" }}>
              <h2 className="text-base font-semibold text-white">
                {editId ? "Editar membresía" : "Nueva membresía"}
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

              {/* Info: cliente nuevo/retorno se detecta automáticamente */}
              {!editId && (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "#1e3a5f22", color: "#60a5fa", border: "1px solid #1e40af33" }}>
                  💡 El sistema detectará automáticamente si es un cliente nuevo o de retorno.
                </div>
              )}

              {/* Miembro */}
              <div>
                <label style={LABEL}>Miembro *</label>
                <select style={{ ...INPUT, cursor: "pointer" }} required
                  value={form.id_miembro}
                  onChange={e => setForm(p => ({ ...p, id_miembro: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}>
                  <option value="">— Seleccionar —</option>
                  {miembros.map(m => (
                    <option key={m.id_miembro} value={m.id_miembro}>
                      {m.nombre} {m.apellido} {m.dni ? `(${m.dni})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Disciplina */}
              <div>
                <label style={LABEL}>Disciplina *</label>
                <select style={{ ...INPUT, cursor: "pointer" }} required
                  value={form.id_disciplina}
                  onChange={handleDisciplinaChange}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}>
                  <option value="">— Seleccionar —</option>
                  {disciplinas.map(d => (
                    <option key={d.id_disciplina} value={d.id_disciplina}>
                      {d.nombre} — ${d.precio_mensual.toLocaleString("es-AR")}/mes
                    </option>
                  ))}
                </select>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={LABEL}>Fecha inicio *</label>
                  <input type="date" style={INPUT} required
                    value={form.fecha_inicio}
                    onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = "#f97316"}
                    onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
                </div>
                <div>
                  <label style={LABEL}>Fecha vencimiento *</label>
                  <input type="date" style={INPUT} required
                    value={form.fecha_vencimiento}
                    onChange={e => setForm(p => ({ ...p, fecha_vencimiento: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = "#f97316"}
                    onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
                </div>
              </div>

              {/* Precio */}
              <div>
                <label style={LABEL}>Precio abonado *</label>
                <input type="number" min="0" step="0.01" style={INPUT} required
                  value={form.precio_abonado}
                  onChange={e => setForm(p => ({ ...p, precio_abonado: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                  placeholder="0.00" />
              </div>

              <div className="mt-auto pt-4 flex gap-3" style={{ borderTop: "1px solid #2a2a2a" }}>
                <button type="button" onClick={() => setPanelAbierto(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "#1f1f1f", color: "#9ca3af", border: "1px solid #2a2a2a" }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "#f97316" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ea6c0a"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f97316"}>
                  {editId ? "Guardar cambios" : "Crear membresía"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
