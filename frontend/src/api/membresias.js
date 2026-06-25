import api from "./client";

export const getMembresias = async () => (await api.get("/membresias")).data;
export const crearMembresia = async (data) => (await api.post("/membresias", data)).data;
export const actualizarMembresia = async (id, data) => (await api.put(`/membresias/${id}`, data)).data;
export const eliminarMembresia = async (id) => (await api.delete(`/membresias/${id}`)).data;
export const renovarMembresia = async (id) => (await api.post(`/membresias/${id}/renovar`)).data;
