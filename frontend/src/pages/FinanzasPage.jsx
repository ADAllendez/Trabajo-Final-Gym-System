import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { crearGasto, eliminarGasto } from "../api/gastos";

const CARD = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "24px" };

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: color || "#fff", margin: 0 }}>
            ${Number(value || 0).toLocaleString("es-AR")}
          </p>
          {sub && <p style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>{sub}</p>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function SinRenovarTable({ sinRenovar, ingresoPerdido }) {
  if (!sinRenovar || sinRenovar.length === 0) {
    return (
      <div style={{ ...CARD, border: "1px solid #16a34a44", background: "linear-gradient(135deg, #1a1a1a 60%, #16a34a08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#16a34a22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            ✅
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "#22c55e", margin: 0, fontSize: 15 }}>Sin pendientes este mes</p>
            <p style={{ color: "#4b5563", fontSize: 13, margin: "4px 0 0" }}>Todos los clientes activos renovaron su membresía a tiempo.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...CARD, border: "1px solid #ef444444", background: "linear-gradient(135deg, #1a1a1a 60%, #ef444408)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Membresías sin renovar
          </p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#ef4444", margin: 0 }}>
            {sinRenovar.length} cliente{sinRenovar.length !== 1 ? "s" : ""} pendiente{sinRenovar.length !== 1 ? "s" : ""} de renovación
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase" }}>
            Ingreso potencial perdido
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#ef4444", margin: 0 }}>
            -${Number(ingresoPerdido || 0).toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
              {["Cliente", "Disciplina", "Venció", "Días vencido", "Cuota mensual", "Teléfono"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sinRenovar.map((m, idx) => (
              <tr key={m.id_miembro} style={{ borderBottom: idx < sinRenovar.length - 1 ? "1px solid #1f1f1f" : "none" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#ef444420", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#ef4444" }}>
                      {m.nombre.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{m.nombre}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, backgroundColor: "#f9731620", color: "#f97316", fontWeight: 600 }}>
                    {m.disciplina}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "#ef4444", fontSize: 13, fontWeight: 600 }}>
                  {m.fecha_vencimiento
                    ? new Date(m.fecha_vencimiento + "T12:00:00").toLocaleDateString("es-AR")
                    : "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    fontSize: 12, padding: "2px 10px", borderRadius: 999, fontWeight: 700,
                    backgroundColor: m.dias_vencido > 14 ? "#ef444422" : "#f9731622",
                    color: m.dias_vencido > 14 ? "#ef4444" : "#f97316",
                    border: `1px solid ${m.dias_vencido > 14 ? "#ef444444" : "#f9731644"}`,
                  }}>
                    {m.dias_vencido} día{m.dias_vencido !== 1 ? "s" : ""}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "#fff", fontSize: 14, fontWeight: 700 }}>
                  ${Number(m.precio_mensual || 0).toLocaleString("es-AR")}
                </td>
                <td style={{ padding: "10px 12px", color: "#9ca3af", fontSize: 13 }}>
                  {m.telefono || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #2a2a2a", display: "flex", alignItems: "center", gap: 8 }}>
        <svg style={{ width: 14, height: 14, color: "#6b7280", flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p style={{ fontSize: 12, color: "#4b5563", margin: 0 }}>
          Estos clientes tenían membresía activa el mes anterior pero no renovaron. Sus datos se conservan en el sistema.
        </p>
      </div>
    </div>
  );
}

const CATEGORIAS = [
  { value: "insumos", label: "🛒 Insumos / Compras" },
  { value: "servicios", label: "⚡ Servicios (luz, agua, etc.)" },
  { value: "equipamiento", label: "🏋️ Equipamiento" },
  { value: "sueldos", label: "💸 Pago de sueldo" },
  { value: "otro", label: "📌 Otro" },
];

function ModalGasto({ onClose, onGuardado, trabajadores }) {
  const hoyStr = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ concepto: "", categoria: "insumos", monto: "", fecha: hoyStr, notas: "", empleado_id: "" });
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.concepto || !form.monto || !form.fecha) { setErr("Completá concepto, monto y fecha."); return; }
    setGuardando(true); setErr("");
    try {
      let concepto = form.concepto;
      if (form.categoria === "sueldos" && form.empleado_id) {
        const t = trabajadores.find(t => String(t.id_usuario) === String(form.empleado_id));
        if (t) concepto = `Sueldo - ${t.nombre}`;
      }
      await crearGasto({ concepto, categoria: form.categoria, monto: parseFloat(form.monto), fecha: form.fecha, notas: form.notas || null });
      onGuardado();
    } catch { setErr("Error al guardar."); }
    finally { setGuardando(false); }
  }

  const inp = { backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box" };
  const lbl = { fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5, display: "block" };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "#000000bb", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>📝 Registrar Gasto</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Categoría</label>
            <select value={form.categoria} onChange={e => set("categoria", e.target.value)} style={inp}>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          {form.categoria === "sueldos" && trabajadores.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Empleado (opcional)</label>
              <select value={form.empleado_id} onChange={e => set("empleado_id", e.target.value)} style={inp}>
                <option value="">— Seleccionar —</option>
                {trabajadores.map(t => <option key={t.id_usuario} value={t.id_usuario}>{t.nombre}</option>)}
              </select>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Concepto</label>
            <input value={form.concepto} onChange={e => set("concepto", e.target.value)} placeholder="Ej: Mancuernas nuevas" style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Monto ($)</label>
              <input type="number" min="0" step="0.01" value={form.monto} onChange={e => set("monto", e.target.value)} placeholder="0.00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Nota (opcional)</label>
            <textarea value={form.notas} onChange={e => set("notas", e.target.value)} placeholder="Ej: Compré 2 pares de mancuernas para el área de peso libre..." rows={3} style={{ ...inp, resize: "vertical" }} />
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #2a2a2a", backgroundColor: "#111", color: "#9ca3af", fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={guardando} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", backgroundColor: "#f97316", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{guardando ? "Guardando..." : "Guardar gasto"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FinanzasPage() {
  const hoy = new Date();
  const [anio, setAnio]       = useState(hoy.getFullYear());
  const [mes, setMes]         = useState(hoy.getMonth() + 1); // 1-12
  const [datos, setDatos]     = useState(null);
  const [cargando, setCarg]   = useState(true);
  const [error, setError]     = useState("");
  const [modalGasto, setModalGasto] = useState(false);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => { cargar(anio, mes); }, [anio, mes]); // eslint-disable-line

  async function cargar(a, m) {
    setCarg(true); setError("");
    try {
      const res = await api.get(`/api/finanzas/dashboard?anio=${a}&mes=${m}`);
      setDatos(res.data);
    } catch (e) {
      setError("Error al cargar los datos financieros.");
      console.error(e);
    } finally { setCarg(false); }
  }

  function irAnterior() {
    if (mes === 1) { setMes(12); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  }
  function irSiguiente() {
    const ahora = new Date();
    if (anio === ahora.getFullYear() && mes === ahora.getMonth() + 1) return;
    if (mes === 12) { setMes(1); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  }

  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;
  const enPositivo  = datos && datos.ganancia_neta >= 0;

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Finanzas</h1>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Resumen financiero — solo visible para root</p>
        </div>
        <button onClick={() => cargar(anio, mes)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#9ca3af", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#f97316"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}>
          <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Actualizar
        </button>
        <button onClick={() => setModalGasto(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, backgroundColor: "#f97316", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginLeft: 8 }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ea6c0a"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f97316"}>
          + Registrar gasto
        </button>
      </div>

      {/* Navegador de meses */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={irAnterior} style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#f97316"; e.currentTarget.style.color="#f97316"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.color="#9ca3af"; }}>
          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <span style={{ padding: "5px 16px", borderRadius: 999, backgroundColor: "#f9731622", color: "#f97316", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", minWidth: 140, textAlign: "center" }}>
          📅 {MESES_ES[mes - 1]} {anio}
          {esMesActual && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>· actual</span>}
        </span>

        <button onClick={irSiguiente} disabled={esMesActual}
          style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", color: esMesActual ? "#2a2a2a" : "#9ca3af", cursor: esMesActual ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          onMouseEnter={e => { if (!esMesActual) { e.currentTarget.style.borderColor="#f97316"; e.currentTarget.style.color="#f97316"; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.color= esMesActual ? "#2a2a2a" : "#9ca3af"; }}>
          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {cargando ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #f97316", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : error ? (
        <div style={{ padding: 20, borderRadius: 10, backgroundColor: "#ef444415", border: "1px solid #ef444433", color: "#ef4444", fontSize: 14 }}>{error}</div>
      ) : datos && (
        <>
          {/* Cards principales */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            <StatCard label="Ingresos del mes" value={datos.ingresos_totales} color="#22c55e"
              sub={`Membresías: $${Number(datos.ingresos_membresias||0).toLocaleString("es-AR")} · Clases del día: $${Number(datos.ingresos_pagos_dia||0).toLocaleString("es-AR")}`}
              icon={<svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>} />
            <StatCard label="Gastos en insumos" value={datos.gastos_insumos} color="#f97316" sub="Equipamiento, servicios, etc."
              icon={<svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>} />
            <StatCard label="Sueldos pagados" value={datos.pago_instructores} color="#a78bfa" sub="Trabajadores e instructores"
              icon={<svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>} />
          </div>

          {/* Card ganancia neta */}
          <div style={{ ...CARD, border: `1px solid ${enPositivo ? "#22c55e44" : "#ef444444"}`, background: enPositivo ? "linear-gradient(135deg, #1a1a1a 60%, #16a34a10)" : "linear-gradient(135deg, #1a1a1a 60%, #ef444410)", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Ganancia neta del mes</p>
                <p style={{ fontSize: 40, fontWeight: 800, color: enPositivo ? "#22c55e" : "#ef4444", margin: 0 }}>
                  {enPositivo ? "+" : ""}${Number(datos.ganancia_neta).toLocaleString("es-AR")}
                </p>
                <p style={{ fontSize: 13, marginTop: 6, color: enPositivo ? "#16a34a" : "#dc2626" }}>
                  {enPositivo ? "✓ El gym está en positivo este mes" : "⚠ El gym está en negativo este mes — revisá los gastos"}
                </p>
                {datos.ingreso_perdido > 0 && (
                  <p style={{ fontSize: 12, marginTop: 4, color: "#ef4444" }}>
                    ⚠ Ingreso potencial no cobrado: ${Number(datos.ingreso_perdido).toLocaleString("es-AR")}
                  </p>
                )}
              </div>
              <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: enPositivo ? "#22c55e15" : "#ef444415", border: `2px solid ${enPositivo ? "#22c55e33" : "#ef444433"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg style={{ width: 30, height: 30, color: enPositivo ? "#22c55e" : "#ef4444" }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  {enPositivo
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  }
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #2a2a2a", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Total ingresos", val: datos.ingresos_totales, color: "#22c55e" },
                { label: "Total egresos", val: datos.gastos_insumos + datos.pago_instructores, color: "#ef4444" },
                { label: "Balance", val: datos.ganancia_neta, color: enPositivo ? "#22c55e" : "#ef4444" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign: "center", padding: "10px 0" }}>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase" }}>{label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color, margin: 0 }}>${Number(val).toLocaleString("es-AR")}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sección sin renovar */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              📋 Detalle de clientes sin renovar — {MESES_ES[mes - 1]} {anio}
            </p>
            <SinRenovarTable sinRenovar={datos.sin_renovar} ingresoPerdido={datos.ingreso_perdido} />
          </div>

          {/* Pagos por día del mes */}
          {datos.pagos_dia && datos.pagos_dia.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                🎫 Clases / Pagos por día — {MESES_ES[mes - 1]} {anio}
              </p>
              <div style={{ ...CARD }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>{datos.pagos_dia.length} registro{datos.pagos_dia.length !== 1 ? "s" : ""}</p>
                  <p style={{ color: "#22c55e", fontWeight: 700, fontSize: 15, margin: 0 }}>+${Number(datos.ingresos_pagos_dia||0).toLocaleString("es-AR")}</p>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                        {["Fecha", "Visitante", "Disciplina", "Monto", "Notas"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datos.pagos_dia.map((p, idx) => (
                        <tr key={p.id_pago_dia} style={{ borderBottom: idx < datos.pagos_dia.length - 1 ? "1px solid #1f1f1f" : "none" }}>
                          <td style={{ padding: "9px 12px", color: "#9ca3af", fontSize: 13 }}>
                            {new Date(p.fecha + "T12:00:00").toLocaleDateString("es-AR")}
                          </td>
                          <td style={{ padding: "9px 12px", color: "#fff", fontWeight: 600, fontSize: 14 }}>{p.nombre_visitante}</td>
                          <td style={{ padding: "9px 12px" }}>
                            {p.disciplina
                              ? <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, backgroundColor: "#f9731620", color: "#f97316", fontWeight: 600 }}>{p.disciplina}</span>
                              : <span style={{ color: "#4b5563", fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ padding: "9px 12px", color: "#22c55e", fontWeight: 700, fontSize: 14 }}>${Number(p.monto).toLocaleString("es-AR")}</td>
                          <td style={{ padding: "9px 12px", color: "#6b7280", fontSize: 12 }}>{p.notas || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Gastos del mes */}
          {datos.gastos_del_mes && datos.gastos_del_mes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                🧾 Gastos registrados — {MESES_ES[mes - 1]} {anio}
              </p>
              <div style={{ ...CARD }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>{datos.gastos_del_mes.length} registro{datos.gastos_del_mes.length !== 1 ? "s" : ""}</p>
                  <p style={{ color: "#f97316", fontWeight: 700, fontSize: 15, margin: 0 }}>-${Number(datos.gastos_del_mes.reduce((a, g) => a + g.monto, 0)).toLocaleString("es-AR")}</p>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                        {["Fecha", "Concepto", "Categoría", "Monto", "Nota", ""].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datos.gastos_del_mes.map((g, idx) => {
                        const catColors = { sueldos: "#a78bfa", insumos: "#f97316", equipamiento: "#3b82f6", servicios: "#06b6d4", otro: "#6b7280" };
                        const c = catColors[g.categoria] || "#6b7280";
                        return (
                          <tr key={g.id_gasto} style={{ borderBottom: idx < datos.gastos_del_mes.length - 1 ? "1px solid #1f1f1f" : "none" }}>
                            <td style={{ padding: "9px 12px", color: "#9ca3af", fontSize: 13 }}>{new Date(g.fecha + "T12:00:00").toLocaleDateString("es-AR")}</td>
                            <td style={{ padding: "9px 12px", color: "#fff", fontWeight: 600, fontSize: 14 }}>{g.concepto}</td>
                            <td style={{ padding: "9px 12px" }}><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, backgroundColor: `${c}22`, color: c, fontWeight: 700 }}>{g.categoria}</span></td>
                            <td style={{ padding: "9px 12px", color: "#ef4444", fontWeight: 700, fontSize: 14 }}>-${Number(g.monto).toLocaleString("es-AR")}</td>
                            <td style={{ padding: "9px 12px", color: "#6b7280", fontSize: 12, maxWidth: 200 }}>{g.notas || "—"}</td>
                            <td style={{ padding: "9px 12px" }}>
                              <button
                                disabled={eliminando === g.id_gasto}
                                onClick={async () => { setEliminando(g.id_gasto); try { await eliminarGasto(g.id_gasto); cargar(anio, mes); } catch {} finally { setEliminando(null); } }}
                                style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ef444444", backgroundColor: "#ef444415", color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                              >{eliminando === g.id_gasto ? "..." : "Eliminar"}</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* Agenda de sueldos */}
          {datos.agenda_sueldos && datos.agenda_sueldos.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                💸 Agenda de sueldos del personal
              </p>
              <div style={{ ...CARD }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                        {["Trabajador", "Rol", "Sueldo mensual", "Día de cobro"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#6b7280" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datos.agenda_sueldos.map((t, idx) => (
                        <tr key={t.id_usuario} style={{ borderBottom: idx < datos.agenda_sueldos.length - 1 ? "1px solid #1f1f1f" : "none" }}>
                          <td style={{ padding: "10px 12px", color: "#fff", fontWeight: 600, fontSize: 14 }}>{t.nombre}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, backgroundColor: t.rol === "root" ? "#f9731622" : "#3b82f622", color: t.rol === "root" ? "#f97316" : "#3b82f6", fontWeight: 700 }}>{t.rol}</span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#a78bfa", fontWeight: 700, fontSize: 15 }}>${Number(t.sueldo_mensual).toLocaleString("es-AR")}</td>
                          <td style={{ padding: "10px 12px" }}>
                            {t.dia_de_pago
                              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#22c55e", fontWeight: 600 }}>📅 Día {t.dia_de_pago} de cada mes</span>
                              : <span style={{ color: "#4b5563", fontSize: 13 }}>Sin definir</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>Podés editar el sueldo y día de cobro desde la sección Trabajadores.</p>
                  <p style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14, margin: 0 }}>
                    Total: ${Number(datos.agenda_sueldos.reduce((a, t) => a + (t.sueldo_mensual || 0), 0)).toLocaleString("es-AR")}/mes
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {modalGasto && (
        <ModalGasto
          trabajadores={datos?.agenda_sueldos || []}
          onClose={() => setModalGasto(false)}
          onGuardado={() => { setModalGasto(false); cargar(anio, mes); }}
        />
      )}
    </Layout>
  );
}
