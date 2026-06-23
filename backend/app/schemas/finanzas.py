from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class SinRenovarDetail(BaseModel):
    id_miembro: int
    nombre: str
    telefono: Optional[str] = None
    disciplina: str
    precio_mensual: float
    fecha_vencimiento: date
    dias_vencido: int

class PagoDiaDetail(BaseModel):
    id_pago_dia: int
    nombre_visitante: str
    disciplina: Optional[str] = None
    monto: float
    fecha: date
    notas: Optional[str] = None

class AgendaSueldoItem(BaseModel):
    id_usuario: int
    nombre: str
    sueldo_mensual: float
    dia_de_pago: Optional[int] = None
    rol: str

class GastoDetail(BaseModel):
    id_gasto: int
    concepto: str
    categoria: str
    monto: float
    fecha: date
    notas: Optional[str] = None

class DashboardMensualResponse(BaseModel):
    mes: str
    ingresos_totales: float
    ingresos_membresias: float = 0.0
    ingresos_pagos_dia: float = 0.0
    gastos_insumos: float
    pago_instructores: float
    ganancia_neta: float
    sin_renovar: List[SinRenovarDetail] = []
    ingreso_perdido: float = 0.0
    pagos_dia: List[PagoDiaDetail] = []
    agenda_sueldos: List[AgendaSueldoItem] = []
    gastos_del_mes: List[GastoDetail] = []