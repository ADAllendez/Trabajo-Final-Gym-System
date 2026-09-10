import React, {useState, useContext} from "react";
import {AuthContext} from "../context/AuthContext";
import {useNavigate} from "react-router-dom";
import {recuperarPassword} from "../api/usuarios";

export default function LoginPages() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError]       = useState("");
    const {login} = useContext(AuthContext);
    const navigate = useNavigate();

    // ── Estado recuperación ──
    const [modo, setModo]                 = useState("login"); // "login" | "codigo" | "nueva-password"
    const [usernameRecup, setUsernameRecup] = useState("");
    const [codigo, setCodigo]             = useState("");  // PIN (root) o DNI (trabajador)
    const [nuevaPass, setNuevaPass]       = useState("");
    const [confirmarPass, setConfirmarPass] = useState("");
    const [errorRecup, setErrorRecup]     = useState("");
    const [exitoRecup, setExitoRecup]     = useState("");
    const [guardando, setGuardando]       = useState(false);

    // ── Login ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await login(username, password);
            navigate("/");
        } catch {
            setError("Usuario o contraseña incorrectos");
        }
    };

    // ── Resetear estado de recuperación ──
    function volverALogin() {
        setModo("login");
        setUsernameRecup("");
        setCodigo("");
        setNuevaPass("");
        setConfirmarPass("");
        setErrorRecup("");
        setExitoRecup("");
    }

    // ── Paso 1: solo validar campos y avanzar (verificación real ocurre en paso 2) ──
    function verificarCodigo(e) {
        e.preventDefault();
        setErrorRecup("");
        if (!usernameRecup.trim()) return setErrorRecup("Ingresá tu nombre de usuario.");
        if (!codigo.trim())        return setErrorRecup("Ingresá tu código de recuperación.");
        // Avanzar directamente al paso 2
        // (el backend valida usuario + código cuando se guarda la nueva contraseña)
        setModo("nueva-password");
    }

    // ── Paso 2: guardar nueva contraseña ──
    async function enviarNuevaPassword(e) {
        e.preventDefault();
        setErrorRecup(""); setExitoRecup("");
        if (!nuevaPass || nuevaPass.length < 4)
            return setErrorRecup("La contraseña debe tener al menos 4 caracteres.");
        if (nuevaPass !== confirmarPass)
            return setErrorRecup("Las contraseñas no coinciden.");

        setGuardando(true);
        try {
            await recuperarPassword({ username: usernameRecup.trim(), codigo: codigo.trim(), nueva_password: nuevaPass });
            setExitoRecup("✓ Contraseña restablecida. Ya podés iniciar sesión.");
            setCodigo(""); setNuevaPass(""); setConfirmarPass("");
            setTimeout(volverALogin, 3500);
        } catch (err) {
            const detail = err?.response?.data?.detail;
            if (typeof detail === "string") setErrorRecup(detail);
            else setErrorRecup("Error al restablecer la contraseña.");
        } finally {
            setGuardando(false);
        }
    }

    // ── Estilos ──
    const inputClass = "w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white p-2.5 rounded outline-none focus:border-orange-500 transition";
    const labelClass = "text-gray-400 text-xs font-semibold mb-1 block";
    const backBtn    = { color: "#6b7280", background: "none", border: "none", cursor: "pointer" };

    return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="bg-[#111111] p-8 rounded-xl border border-[#2a2a2a] w-96">

        {/* ── Logo ── */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">GYM Manager</h1>
        </div>

        {/* ════════════ LOGIN ════════════ */}
        {modo === "login" && (
          <>
            {error && <p className="text-red-400 bg-red-500/20 p-3 rounded mb-4 text-sm text-center">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Usuario</label>
                <input className={inputClass} value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Contraseña</label>
                <input type="password" className={inputClass} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold p-3 rounded mt-2 transition">
                Iniciar Sesión
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => { setModo("codigo"); setError(""); }}
                style={backBtn}
                className="text-xs font-medium transition"
                onMouseEnter={e => e.currentTarget.style.color = "#f97316"}
                onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </>
        )}

        {/* ════════════ PASO 1: CÓDIGO ════════════ */}
        {modo === "codigo" && (
          <>
            {/* Encabezado */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "#f9731622" }}>
                <svg style={{ width: 24, height: 24, color: "#f97316" }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
                </svg>
              </div>
              <h2 className="text-base font-bold text-white mb-1">Recuperar contraseña</h2>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                Ingresá tu usuario y tu código de recuperación.
              </p>
            </div>

            {/* Cuadro informativo: quién usa qué */}
            <div className="mb-4 rounded-lg p-3 text-xs" style={{ backgroundColor: "#f9731610", border: "1px solid #f9731630" }}>
              <p style={{ color: "#fb923c", fontWeight: 700, marginBottom: 4 }}>¿Cuál es mi código?</p>
              <p style={{ color: "#9ca3af", lineHeight: 1.5 }}>
                🔑 <strong style={{ color: "#e5e7eb" }}>Administrador root:</strong> tu PIN secreto de seguridad.<br/>
                🪪 <strong style={{ color: "#e5e7eb" }}>Trabajador:</strong> tu número de DNI registrado.
              </p>
            </div>

            {errorRecup && (
              <div className="mb-4 px-3 py-2 rounded text-sm text-center" style={{ backgroundColor: "#ef444422", color: "#ef4444", border: "1px solid #ef444433" }}>
                {errorRecup}
              </div>
            )}

            <form onSubmit={verificarCodigo} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Nombre de usuario</label>
                <input
                  className={inputClass}
                  type="text"
                  value={usernameRecup}
                  onChange={e => setUsernameRecup(e.target.value)}
                  placeholder="Tu usuario de acceso"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Código de recuperación</label>
                <input
                  className={inputClass}
                  type="password"
                  value={codigo}
                  onChange={e => setCodigo(e.target.value)}
                  placeholder="PIN (root) o DNI (trabajador)"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={guardando}
                className="w-full text-white font-bold p-3 rounded transition"
                style={{ backgroundColor: guardando ? "#4b5563" : "#f97316", cursor: guardando ? "not-allowed" : "pointer" }}
              >
                {guardando ? "Verificando..." : "Verificar código"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button onClick={volverALogin} style={backBtn} className="text-xs font-medium"
                onMouseEnter={e => e.currentTarget.style.color = "#f97316"}
                onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

        {/* ════════════ PASO 2: NUEVA CONTRASEÑA ════════════ */}
        {modo === "nueva-password" && (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "#f9731622" }}>
                <svg style={{ width: 24, height: 24, color: "#f97316" }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                </svg>
              </div>
              <h2 className="text-base font-bold text-white mb-1">Nueva contraseña</h2>
              <p className="text-xs" style={{ color: "#6b7280" }}>
                Código verificado para <strong style={{ color: "#fb923c" }}>@{usernameRecup}</strong>. Ingresá tu nueva contraseña.
              </p>
            </div>

            {exitoRecup && (
              <div className="mb-4 px-3 py-2 rounded text-sm text-center" style={{ backgroundColor: "#16a34a22", color: "#22c55e", border: "1px solid #22c55e33" }}>
                {exitoRecup}
              </div>
            )}
            {errorRecup && (
              <div className="mb-4 px-3 py-2 rounded text-sm text-center" style={{ backgroundColor: "#ef444422", color: "#ef4444", border: "1px solid #ef444433" }}>
                {errorRecup}
              </div>
            )}

            <form onSubmit={enviarNuevaPassword} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Nueva contraseña</label>
                <input
                  type="password"
                  className={inputClass}
                  value={nuevaPass}
                  onChange={e => setNuevaPass(e.target.value)}
                  placeholder="Mín. 4 caracteres"
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Confirmar contraseña</label>
                <input
                  type="password"
                  className={inputClass}
                  value={confirmarPass}
                  onChange={e => setConfirmarPass(e.target.value)}
                  placeholder="Repetir contraseña"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={guardando}
                className="w-full text-white font-bold p-3 rounded transition"
                style={{ backgroundColor: guardando ? "#4b5563" : "#f97316", cursor: guardando ? "not-allowed" : "pointer" }}
              >
                {guardando ? "Restableciendo..." : "Restablecer contraseña"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button onClick={volverALogin} style={backBtn} className="text-xs font-medium"
                onMouseEnter={e => e.currentTarget.style.color = "#f97316"}
                onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}