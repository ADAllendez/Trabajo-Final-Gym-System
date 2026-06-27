import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { parsearError } from "../api/client";
import { getInstructores, crearInstructor, actualizarInstructor, eliminarInstructor } from "../api/instructores";
import { getDisciplinas } from "../api/disciplinas";

const CARD  = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px" };
const INPUT = {
  backgroundColor: "#111111", border: "1px solid #2a2a2a", borderRadius: "8px",
  color: "#e5e7eb", padding: "8px 12px", width: "100%", fontSize: "14px", outline: "none",
};
const LABEL = { color: "#9ca3af", fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" };
const EMPTY = { nombre: "", apellido: "", telefono: "", id_disciplina: "" };

export default function InstructoresPage() {
  const [instructores, setInstructores] = useState([]);
  const [disciplinas, setDisciplinas]   = useState([]);
  const [form, setForm]                 = useState(EMPTY);
  const [editId, setEditId]             = useState(null);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [error, setError]               = useState("");
  const [cargando, setCargando]         = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const [inst, disc] = await Promise.all([getInstructores(), getDisciplinas()]);
      setInstructores(inst);
      setDisciplinas(disc);
    } catch { setError("Error al cargar."); }
    finally { setCargando(false); }
  }

  function nombreDisciplina(id) {
    const d = disciplinas.find(d => d.id_disciplina === id);
    return d ? d.nombre : "—";
  }

  function abrirNuevo() {
    setForm(EMPTY); setEditId(null); setError(""); setPanelAbierto(true);
  }

  function abrirEdicion(i) {
    setForm({ nombre: i.nombre, apellido: i.apellido, telefono: i.telefono ?? "", id_disciplina: i.id_disciplina ?? "" });
    setEditId(i.id_instructor); setError(""); setPanelAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError("");
    const payload = {
      nombre: form.nombre, apellido: form.apellido,
      telefono: form.telefono || null,
      id_disciplina: form.id_disciplina ? Number(form.id_disciplina) : null,
    };
    try {
      if (editId) await actualizarInstructor(editId, payload);
      else await crearInstructor(payload);
      await cargar(); setPanelAbierto(false);
    } catch (err) {
      setError(parsearError(err, "Error al guardar."));
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm("¿Eliminar este instructor?")) return;
    try { await eliminarInstructor(id); await cargar(); }
    catch { setError("Error al eliminar."); }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Instructores</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            {instructores.length} instructor{instructores.length !== 1 ? "es" : ""} registrado{instructores.length !== 1 ? "s" : ""}
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
          Nuevo instructor
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#7f1d1d", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      <div style={CARD}>
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "#f97316", borderTopColor: "transparent" }} />
          </div>
        ) : instructores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "#4b5563" }}>
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <p>No hay instructores registrados.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                {["Instructor", "Disciplina", "Teléfono", "Acciones"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#6b7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {instructores.map((inst, idx) => (
                <tr key={inst.id_instructor}
                  style={{ borderBottom: idx < instructores.length - 1 ? "1px solid #1f1f1f" : "none" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: "#a78bfa22", color: "#a78bfa" }}>
                        {inst.nombre.charAt(0)}{inst.apellido.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-white">
                        {inst.nombre} {inst.apellido}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: "#f9731620", color: "#f97316" }}>
                      {nombreDisciplina(inst.id_disciplina)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#9ca3af" }}>{inst.telefono || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEdicion(inst)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: "#1f1f1f", color: "#9ca3af", border: "1px solid #2a2a2a" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                        onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(inst.id_instructor)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: "#7f1d1d22", color: "#ef4444", border: "1px solid #7f1d1d44" }}>
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
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #2a2a2a" }}>
              <h2 className="text-base font-semibold text-white">
                {editId ? "Editar instructor" : "Nuevo instructor"}
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
                { name: "nombre",   label: "Nombre *",   required: true  },
                { name: "apellido", label: "Apellido *",  required: true  },
                { name: "telefono", label: "Teléfono",    required: false },
              ].map(({ name, label, required }) => (
                <div key={name}>
                  <label style={LABEL}>{label}</label>
                  <input style={INPUT} required={required} value={form[name]}
                    onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = "#f97316"}
                    onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
                </div>
              ))}
              <div>
                <label style={LABEL}>Disciplina</label>
                <select style={{ ...INPUT, cursor: "pointer" }}
                  value={form.id_disciplina}
                  onChange={e => setForm(p => ({ ...p, id_disciplina: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}>
                  <option value="">— Sin asignar —</option>
                  {disciplinas.map(d => (
                    <option key={d.id_disciplina} value={d.id_disciplina}>{d.nombre}</option>
                  ))}
                </select>
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
                  {editId ? "Guardar cambios" : "Crear instructor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
