import React, { useEffect, useState } from "react";
import { parsearError } from "../api/client";
import Layout from "../components/Layout";
import { getDisciplinas, crearDisciplina, actualizarDisciplina, eliminarDisciplina } from "../api/disciplinas";

const CARD  = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px" };
const INPUT = {
  backgroundColor: "#111111", border: "1px solid #2a2a2a", borderRadius: "8px",
  color: "#e5e7eb", padding: "8px 12px", width: "100%", fontSize: "14px", outline: "none",
};
const LABEL = { color: "#9ca3af", fontSize: "12px", fontWeight: "600", marginBottom: "4px", display: "block" };
const EMPTY = { nombre: "", descripcion: "", precio_mensual: "", imagen_url: "" };

const COLORS = ["#f97316","#22c55e","#60a5fa","#a78bfa","#f43f5e","#fbbf24","#2dd4bf","#fb923c"];

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [form, setForm]               = useState(EMPTY);
  const [editId, setEditId]           = useState(null);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [error, setError]             = useState("");
  const [cargando, setCargando]       = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try { setDisciplinas(await getDisciplinas()); }
    catch { setError("Error al cargar disciplinas."); }
    finally { setCargando(false); }
  }

  function abrirNuevo() {
    setForm(EMPTY); setEditId(null); setError(""); setImagenPreview(null); setPanelAbierto(true);
  }

  function abrirEdicion(d) {
    setForm({
      nombre: d.nombre,
      descripcion: d.descripcion ?? "",
      precio_mensual: String(d.precio_mensual),
      imagen_url: d.imagen_url ?? "",
    });
    setImagenPreview(d.imagen_url || null);
    setEditId(d.id_disciplina); setError(""); setPanelAbierto(true);
  }

  function handleImagenChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setImagenPreview(base64);
      setForm(p => ({ ...p, imagen_url: base64 }));
    };
    reader.readAsDataURL(file);
  }

  function quitarImagen() {
    setImagenPreview(null);
    setForm(p => ({ ...p, imagen_url: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError("");
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio_mensual: parseFloat(form.precio_mensual) || 0,
      imagen_url: form.imagen_url || null,
    };
    try {
      if (editId) await actualizarDisciplina(editId, payload);
      else await crearDisciplina(payload);
      await cargar(); setPanelAbierto(false);
    } catch (err) {
      setError(parsearError(err, "Error al guardar."));
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm("¿Eliminar esta disciplina?")) return;
    try { await eliminarDisciplina(id); await cargar(); }
    catch { setError("Error al eliminar."); }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Disciplinas</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            {disciplinas.length} disciplina{disciplinas.length !== 1 ? "s" : ""} registrada{disciplinas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
          style={{ backgroundColor: "#f97316" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ea6c0a"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f97316"}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva disciplina
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: "#7f1d1d", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* Cards de disciplinas */}
      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "#f97316", borderTopColor: "transparent" }} />
        </div>
      ) : disciplinas.length === 0 ? (
        <div style={{ ...CARD, color: "#4b5563" }} className="flex flex-col items-center justify-center py-16">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <p>No hay disciplinas cargadas todavía.</p>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {disciplinas.map((d, idx) => {
            const color = COLORS[idx % COLORS.length];
            return (
              <div key={d.id_disciplina}
                className="flex flex-col overflow-hidden"
                onMouseEnter={e => e.currentTarget.style.borderColor = `${color}66`}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}
                style={{ ...CARD, transition: "border-color 0.2s ease" }}>

                {/* Imagen o banner con letra */}
                <div className="relative" style={{ height: "140px", overflow: "hidden" }}>
                  {d.imagen_url ? (
                    <img
                      src={d.imagen_url}
                      alt={d.nombre}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)`,
                        fontSize: "56px",
                        fontWeight: "800",
                        color: color,
                        letterSpacing: "-2px",
                        userSelect: "none",
                      }}>
                      {d.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Overlay gradiente */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "50px",
                    background: "linear-gradient(to top, #1a1a1a, transparent)",
                  }} />
                </div>

                {/* Contenido */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <p className="text-lg font-bold text-white">{d.nombre}</p>
                    {d.descripcion && (
                      <p className="text-sm mt-1 leading-relaxed"
                        style={{ color: "#9ca3af", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {d.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-auto"
                    style={{ borderTop: "1px solid #2a2a2a" }}>
                    <div>
                      <p className="text-xs" style={{ color: "#6b7280" }}>Precio mensual</p>
                      <p className="text-xl font-bold" style={{ color }}>
                        ${d.precio_mensual.toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => abrirEdicion(d)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: "#1f1f1f", color: "#9ca3af", border: "1px solid #2a2a2a" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                        onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(d.id_disciplina)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: "#7f1d1d22", color: "#ef4444", border: "1px solid #7f1d1d44" }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Panel lateral */}
      {panelAbierto && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-60" onClick={() => setPanelAbierto(false)} />
          <div className="w-[420px] flex flex-col h-full overflow-auto"
            style={{ backgroundColor: "#111111", borderLeft: "1px solid #2a2a2a" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #2a2a2a" }}>
              <h2 className="text-base font-semibold text-white">
                {editId ? "Editar disciplina" : "Nueva disciplina"}
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
              <div>
                <label style={LABEL}>Nombre *</label>
                <input style={INPUT} required value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                  placeholder="Ej: Pilates, Funcional, Pesas…" />
              </div>
              <div>
                <label style={LABEL}>Descripción</label>
                <textarea style={{ ...INPUT, resize: "none", height: "90px" }}
                  value={form.descripcion}
                  onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                  placeholder="Descripción opcional…" />
              </div>
              <div>
                <label style={LABEL}>Precio mensual *</label>
                <input style={INPUT} required type="number" min="0" step="0.01"
                  value={form.precio_mensual}
                  onChange={e => setForm(p => ({ ...p, precio_mensual: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "#f97316"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                  placeholder="0.00" />
              </div>

              {/* Imagen */}
              <div>
                <label style={LABEL}>Imagen (opcional)</label>
                {imagenPreview ? (
                  <div className="relative" style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #2a2a2a" }}>
                    <img src={imagenPreview} alt="preview"
                      style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }} />
                    <button type="button" onClick={quitarImagen}
                      style={{
                        position: "absolute", top: "8px", right: "8px",
                        backgroundColor: "#000000bb", color: "#ef4444",
                        border: "1px solid #ef444466", borderRadius: "6px",
                        padding: "4px 8px", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                      }}>
                      Quitar imagen
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      height: "100px", border: "2px dashed #2a2a2a", borderRadius: "10px",
                      cursor: "pointer", color: "#4b5563", gap: "6px", transition: "border-color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#f97316"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <span style={{ fontSize: "13px" }}>Click para subir imagen</span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>PNG, JPG, WEBP</span>
                    <input type="file" accept="image/*" onChange={handleImagenChange} style={{ display: "none" }} />
                  </label>
                )}
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
                  {editId ? "Guardar cambios" : "Crear disciplina"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
