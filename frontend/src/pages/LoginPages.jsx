import React, {useState, useContext} from "react";
import {AuthContext} from "../context/AuthContext";
import {useNavigate} from "react-router-dom";

export default function LoginPages() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const {login} = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await login(username, password);
            navigate("/");
        } catch (err) {
            setError("Usuario o contraseña incorrectos");
        }
    }

    return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="bg-[#111111] p-8 rounded-xl border border-[#2a2a2a] w-96">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">GYM Manager</h1>
        </div>

        {error && <p className="text-red-400 bg-red-500/20 p-3 rounded mb-4 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-1 block">Usuario</label>
            <input 
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white p-2.5 rounded outline-none focus:border-orange-500 transition"
              value={username} onChange={e => setUsername(e.target.value)} required 
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-semibold mb-1 block">Contraseña</label>
            <input 
              type="password"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white p-2.5 rounded outline-none focus:border-orange-500 transition"
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
          </div>
          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold p-3 rounded mt-2 transition">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}