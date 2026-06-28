import api from "./client";

export const getUsuarios        = async ()         => (await api.get("/api/usuarios/")).data;
export const crearUsuario       = async (data)     => (await api.post("/api/usuarios/", data)).data;
export const actualizarUsuario  = async (id, data) => (await api.put(`/api/usuarios/${id}`, data)).data;
export const eliminarUsuario    = async (id)       => (await api.delete(`/api/usuarios/${id}`)).data;
export const getMe              = async ()         => (await api.get("/api/usuarios/me")).data;
export const updateMe           = async (data)     => (await api.put("/api/usuarios/me", data)).data;
