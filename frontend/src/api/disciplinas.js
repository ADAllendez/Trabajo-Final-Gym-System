import api from "./client";

export const getDisciplinas = async () => (await api.get("/disciplinas")).data;
export const crearDisciplina = async (data) => (await api.post("/disciplinas", data)).data;
export const actualizarDisciplina = async (id, data) => (await api.put(`/disciplinas/${id}`, data)).data;
export const eliminarDisciplina = async (id) => (await api.delete(`/disciplinas/${id}`)).data;
