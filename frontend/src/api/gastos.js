import api from "./client";

export const getGastos = async (anio, mes) => {
  const params = anio && mes ? `?anio=${anio}&mes=${mes}` : "";
  return (await api.get(`/api/gastos/${params}`)).data;
};
export const crearGasto = async (data) => (await api.post("/api/gastos/", data)).data;
export const eliminarGasto = async (id) => (await api.delete(`/api/gastos/${id}`)).data;
