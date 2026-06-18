from pydantic import BaseModel, field_validator, model_validator
from datetime import date
from typing import Optional, Literal


class MembresiaIn(BaseModel):
    id_miembro: int
    id_disciplina: int
    fecha_inicio: date
    fecha_vencimiento: date
    estado: str = "nuevo"
    precio_abonado: float = 0.0
    es_nuevo: bool = True

    @field_validator("id_miembro", "id_disciplina", mode="before")
    @classmethod
    def ids_positivos(cls, v, info):
        if not isinstance(v, int) or v <= 0:
            raise ValueError(f"'{info.field_name}' debe ser un número entero positivo")
        return v

    @field_validator("precio_abonado", mode="before")
    @classmethod
    def precio_no_negativo(cls, v):
        if v is None:
            return 0.0
        if float(v) < 0:
            raise ValueError("El precio abonado no puede ser negativo")
        return v

    @field_validator("estado", mode="before")
    @classmethod
    def estado_valido(cls, v):
        opciones = {"activo", "vencido", "nuevo"}
        if v not in opciones:
            raise ValueError(f"El estado debe ser uno de: {', '.join(opciones)}")
        return v

    @model_validator(mode="after")
    def fechas_coherentes(self):
        if self.fecha_vencimiento <= self.fecha_inicio:
            raise ValueError("La fecha de vencimiento debe ser posterior a la fecha de inicio")
        return self


class MembresiaOut(BaseModel):
    id_membresia: int
    id_miembro: int
    id_disciplina: int
    fecha_inicio: date
    fecha_vencimiento: date
    estado: str
    precio_abonado: float
    es_nuevo: bool = True

    # Datos enriquecidos (opcionales, vendrán del JOIN)
    nombre_miembro: Optional[str] = None
    nombre_disciplina: Optional[str] = None

    class Config:
        from_attributes = True
