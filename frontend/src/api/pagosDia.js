import api from "./client";

export const getPagosDia = async () => (await api.get("/pagos-dia")).data;
export const crearPagoDia = async (data) => (await api.post("/pagos-dia", data)).data;
export const eliminarPagoDia = async (id) => (await api.delete(`/pagos-dia/${id}`)).data;
