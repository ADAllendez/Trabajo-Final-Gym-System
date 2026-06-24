import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Normaliza el error de FastAPI/Pydantic a un string legible.
 * - Error 400: detail es string  → lo devuelve directo
 * - Error 422: detail es array de objetos Pydantic → extrae los mensajes
 * - Otro: devuelve un mensaje genérico
 */
export function parsearError(err, fallback = "Ocurrió un error inesperado.") {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => e?.msg ?? JSON.stringify(e))
      .join(" | ");
  }
  return fallback;
}

export default api;
