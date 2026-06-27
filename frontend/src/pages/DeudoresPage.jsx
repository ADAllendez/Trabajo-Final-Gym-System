import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { parsearError } from "../api/client";
import { getMembresias, renovarMembresia } from "../api/membresias";

const CARD = { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px" };

function diasVencida(fechaVencimiento) {
  if (!fechaVencimiento) return 0;
  const venc = new Date(fechaVencimiento + "T12:00:00");
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  const diff = Math.floor((hoy - venc) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function formatFecha(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-AR");
}

function BadgeDias({ dias }) {
  const color = dias > 30 ? "#ef4444" : dias > 15 ? "#f97316" : "#eab308";
  const bg = dias > 30 ? "#ef444422" : dias > 15 ? "#f9731622" : "#eab30822";
  return (
    <span
      style={{
        backgroundColor: bg,
        color,
        border: `1px solid ${color}44`,
        padding: "2px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {dias === 0 ? "Hoy" : `${dias}d vencida`}
    </span>
  );
}

export default function VencidosPage() {
  const [vencidos, setVencidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [renovando, setRenovando] = useState(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [ordenDias, setOrdenDias] = useState("desc");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError("");
    try {
      const mem = await getMembresias();
      // Solo vencidas (el backend ya las actualiza automáticamente)
      const venc = mem
        .filter((m) => m.estado === "vencido")
        .map((m) => ({ ...m, diasVencida: diasVencida(m.fecha_vencimiento) }));
      setVencidos(venc);
    } catch {
      setError("Error al cargar membresías vencidas.");
    } finally {
      setCargando(false);
    }
  }

  async function handleRenovar(id) {
    if (!window.confirm("¿Renovar esta membresía por 30 días más desde hoy? El miembro quedará activo nuevamente.")) return;
    setRenovando(id);
    try {
      await renovarMembresia(id);
      await cargar();
    } catch (err) {
      setError(parsearError(err, "Error al renovar."));
    } finally {
      setRenovando(null);
    }
  }

  const filtrados = vencidos
    .filter((m) => {
      const q = busqueda.toLowerCase();
      if (!q) return true;
      return (
        m.nombre_miembro?.toLowerCase().includes(q) ||
        m.nombre_disciplina?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) =>
      ordenDias === "desc" ? b.diasVencida - a.diasVencida : a.diasVencida - b.diasVencida
    );

  const masde30   = vencidos.filter((m) => m.diasVencida > 30).length;
  const entre15y30 = vencidos.filter((m) => m.diasVencida > 15 && m.diasVencida <= 30).length;
  const menos15   = vencidos.filter((m) => m.diasVencida <= 15).length;

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vencidos</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
            Membresías vencidas que requieren renovación — {vencidos.length} total
          </p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#1f1f1f", color: "#9ca3af", border: "1px solid #2a2a2a" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Críticos (+30 días)", count: masde30,   color: "#ef4444", bg: "#ef444422" },
          { label: "Moderados (15–30 días)", count: entre15y30, color: "#f97316", bg: "#f9731622" },
          { label: "Recientes (–15 días)", count: menos15,  color: "#eab308", bg: "#eab30822" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} style={{ ...CARD, padding: "20px 24px" }}>
            <p className="text-sm font-medium mb-1" style={{ color: "#6b7280" }}>{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{count}</p>
            <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: bg }}>
              <div
                className="h-1 rounded-full"
                style={{
                  backgroundColor: color,
                  width: vencidos.length ? `${(count / vencidos.length) * 100}%` : "0%",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Barra de búsqueda y orden */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          style={{
            backgroundColor: "#111111",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            color: "#e5e7eb",
            padding: "8px 12px",
            fontSize: "14px",
            outline: "none",
            maxWidth: "280px",
            flex: 1,
          }}
          placeholder="Buscar miembro o disciplina…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          onClick={() => setOrdenDias((o) => (o === "desc" ? "asc" : "desc"))}
          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: "#1a1a1a", color: "#9ca3af", border: "1px solid #2a2a2a" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {ordenDias === "desc" ? "Más atrasados primero" : "Más recientes primero"}
        </button>
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
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "#ef4444", borderTopColor: "transparent" }}
            />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: "#4b5563" }}>
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold">¡Sin vencidos!</p>
            <p className="text-sm mt-1">Todas las membresías están al día.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                  {["Miembro", "Disciplina", "Instructor", "Vencida el", "Días vencida", "Precio", "Acción"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "#6b7280" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((m, idx) => (
                  <tr
                    key={m.id_membresia}
                    style={{
                      borderBottom: idx < filtrados.length - 1 ? "1px solid #1f1f1f" : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: "#ef444422", color: "#ef4444" }}
                        >
                          {m.nombre_miembro?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white whitespace-nowrap">
                          {m.nombre_miembro}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#f9731620", color: "#f97316" }}
                      >
                        {m.nombre_disciplina}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#9ca3af" }}>
                      {m.nombre_instructor || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "#9ca3af" }}>
                      {formatFecha(m.fecha_vencimiento)}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeDias dias={m.diasVencida} />
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white whitespace-nowrap">
                      ${m.precio_abonado?.toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRenovar(m.id_membresia)}
                        disabled={renovando === m.id_membresia}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"
                        style={{
                          backgroundColor: "#16a34a22",
                          color: renovando === m.id_membresia ? "#6b7280" : "#22c55e",
                          border: "1px solid #16a34a44",
                          cursor: renovando === m.id_membresia ? "not-allowed" : "pointer",
                        }}
                        onMouseEnter={(e) => { if (renovando !== m.id_membresia) e.currentTarget.style.backgroundColor = "#16a34a44"; }}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#16a34a22"}
                      >
                        {renovando === m.id_membresia ? (
                          <>
                            <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin" style={{ borderColor: "#22c55e", borderTopColor: "transparent" }} />
                            Renovando…
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Renovar
                          </>
                        )}
                      </button>
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
