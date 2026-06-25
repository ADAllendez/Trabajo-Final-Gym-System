import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getMiembros } from "../api/miembros";
import { getMembresias } from "../api/membresias";
import { getDisciplinas } from "../api/disciplinas";
import { getInstructores } from "../api/instructores";

const CARD_STYLE = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  padding: "20px",
};

function StatCard({ label, value, sub, color = "#f97316", icon }) {
  return (
    <div style={CARD_STYLE}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm mb-1" style={{ color: "#9ca3af" }}>{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

function BadgeEstado({ estado }) {
  const map = {
    activo:  { bg: "#16a34a22", color: "#22c55e", label: "Activo"  },
    vencido: { bg: "#dc262622", color: "#ef4444", label: "Vencido" },
    nuevo:   { bg: "#2563eb22", color: "#60a5fa", label: "Nuevo"   },
  };
  const s = map[estado] ?? map["nuevo"];
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function formatFecha(str) {
  if (!str) return "-";
  return new Date(str + "T12:00:00").toLocaleDateString("es-AR");
}

export default function HomePage() {
  const [miembros, setMiembros] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      const [m, mem, d, i] = await Promise.all([
        getMiembros(), getMembresias(), getDisciplinas(), getInstructores(),
      ]);
      setMiembros(m);
      setMembresias(mem);
      setDisciplinas(d);
      setInstructores(i);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  const activos  = membresias.filter(m => m.estado === "activo").length;
  const vencidos = membresias.filter(m => m.estado === "vencido").length;
  const nuevos   = membresias.filter(m => m.estado === "nuevo").length;

  // Últimas 8 membresías
  const recientes = [...membresias].reverse().slice(0, 8);

  // Disciplinas con cantidad de membresías activas
  const discStats = disciplinas.map(d => ({
    nombre: d.nombre,
    precio: d.precio_mensual,
    activos: membresias.filter(m => m.id_disciplina === d.id_disciplina && m.estado === "activo").length,
  }));

  if (cargando) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#f97316", borderTopColor: "transparent" }} />
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
          Resumen general del gimnasio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard
          label="Total Miembros"
          value={miembros.length}
          sub="registrados"
          color="#f97316"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.197-3.794M9 20H4v-2a4 4 0 015.197-3.794M15 11a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <StatCard
          label="Membresías Activas"
          value={activos}
          sub="al corriente"
          color="#22c55e"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Membresías Vencidas"
          value={vencidos}
          sub="requieren renovación"
          color="#ef4444"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>}
        />
        <StatCard
          label="Nuevos Ingresos"
          value={nuevos}
          sub="sin activar"
          color="#60a5fa"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
        />
      </div>

      {/* Fila inferior */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* Membresías recientes */}
        <div style={CARD_STYLE}>
          <h2 className="text-base font-semibold text-white mb-4">Membresías recientes</h2>
          {recientes.length === 0 ? (
            <p className="text-sm" style={{ color: "#6b7280" }}>No hay membresías registradas.</p>
          ) : (
            <div className="space-y-2">
              {recientes.map(m => (
                <div key={m.id_membresia}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "#111111" }}>
                  <div>
                    <p className="text-sm font-medium text-white">{m.nombre_miembro}</p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>
                      {m.nombre_disciplina} · Vence: {formatFecha(m.fecha_vencimiento)}
                    </p>
                  </div>
                  <BadgeEstado estado={m.estado} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disciplinas */}
        <div style={CARD_STYLE}>
          <h2 className="text-base font-semibold text-white mb-4">Disciplinas activas</h2>
          {discStats.length === 0 ? (
            <p className="text-sm" style={{ color: "#6b7280" }}>No hay disciplinas cargadas.</p>
          ) : (
            <div className="space-y-3">
              {discStats.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: "#f9731620" }}>
                      <span style={{ color: "#f97316" }}>
                        {d.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{d.nombre}</p>
                      <p className="text-xs" style={{ color: "#6b7280" }}>
                        ${d.precio.toLocaleString("es-AR")} / mes
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                    {d.activos} activos
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3" style={{ borderTop: "1px solid #2a2a2a" }}>
            <p className="text-xs" style={{ color: "#6b7280" }}>
              Instructores: <span className="text-white font-medium">{instructores.length}</span>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
