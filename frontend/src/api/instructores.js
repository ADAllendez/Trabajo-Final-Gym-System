import api from "./client";

export const getInstructores = async () => (await api.get("/instructores")).data;
export const crearInstructor = async (data) => (await api.post("/instructores", data)).data;
export const actualizarInstructor = async (id, data) => (await api.put(`/instructores/${id}`, data)).data;
export const eliminarInstructor = async (id) => (await api.delete(`/instructores/${id}`)).data;
