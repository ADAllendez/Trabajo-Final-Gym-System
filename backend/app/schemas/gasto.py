from pydantic import BaseModel, field_validator
from datetime import date
from typing import Optional

CATEGORIAS_VALIDAS = {"sueldos", "insumos", "servicios", "equipamiento", "otro", "otros"}


class GastoBase(BaseModel):
    concepto: str
    categoria: str
    monto: float
    fecha: date
    notas: Optional[str] = None

    @field_validator("concepto", mode="before")
    @classmethod
    def validar_concepto(cls, v):
        v = str(v).strip()
        if not v:
            raise ValueError("El concepto no puede estar vacío")
        if len(v) < 3:
            raise ValueError("El concepto debe tener al menos 3 caracteres")
        if len(v) > 255:
            raise ValueError("El concepto no puede superar los 255 caracteres")
        return v

    @field_validator("categoria", mode="before")
    @classmethod
    def validar_categoria(cls, v):
        v = str(v).strip().lower()
        if v not in CATEGORIAS_VALIDAS:
            raise ValueError(f"La categoría debe ser una de: {', '.join(sorted(CATEGORIAS_VALIDAS))}")
        return v

    @field_validator("monto", mode="before")
    @classmethod
    def validar_monto(cls, v):
        v = float(v)
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0")
        return v

    @field_validator("fecha", mode="before")
    @classmethod
    def validar_fecha(cls, v):
        if isinstance(v, str):
            v = date.fromisoformat(v)
        hoy = date.today()
        from datetime import timedelta
        if v > hoy:
            raise ValueError("La fecha del gasto no puede ser futura")
        if v < hoy - timedelta(days=365):
            raise ValueError("La fecha del gasto no puede ser anterior a 1 año")
        return v

    @field_validator("notas", mode="before")
    @classmethod
    def validar_notas(cls, v):
        if v is None or v == "":
            return None
        return str(v).strip()


class GastoCreate(GastoBase):
    pass


class Gasto(GastoBase):
    id_gasto: int

    class Config:
        from_attributes = True