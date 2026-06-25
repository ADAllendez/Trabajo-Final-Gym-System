import api from "./client";

export const getMiembros = async (soloActivos = false) =>
  (await api.get(`/miembros${soloActivos ? "?solo_activos=true" : ""}`)).data;
export const getMiembro = async (id) => (await api.get(`/miembros/${id}`)).data;
export const crearMiembro = async (data) => (await api.post("/miembros", data)).data;
export const actualizarMiembro = async (id, data) => (await api.put(`/miembros/${id}`, data)).data;
export const eliminarMiembro = async (id) => (await api.delete(`/miembros/${id}`)).data;
export const toggleActivoMiembro = async (id) =>
  (await api.patch(`/miembros/${id}/toggle-activo`)).data;
