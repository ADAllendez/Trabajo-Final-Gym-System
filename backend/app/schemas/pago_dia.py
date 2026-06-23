from pydantic import BaseModel, field_validator
from datetime import date
from typing import Optional


class PagoDiaIn(BaseModel):
    nombre_visitante: str
    disciplina: Optional[str] = None
    monto: float
    fecha: date
    notas: Optional[str] = None

    @field_validator("nombre_visitante", mode="before")
    @classmethod
    def validar_nombre(cls, v):
        v = str(v).strip()
        if not v:
            raise ValueError("El nombre del visitante no puede estar vacío")
        if len(v) < 2:
            raise ValueError("El nombre del visitante debe tener al menos 2 caracteres")
        if len(v) > 150:
            raise ValueError("El nombre del visitante no puede superar los 150 caracteres")
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
        if v > date.today():
            raise ValueError("La fecha del pago no puede ser futura")
        return v

    @field_validator("disciplina", "notas", mode="before")
    @classmethod
    def limpiar_string(cls, v):
        if v is None or v == "":
            return None
        return str(v).strip()


class PagoDiaOut(PagoDiaIn):
    id_pago_dia: int

    class Config:
        from_attributes = True
