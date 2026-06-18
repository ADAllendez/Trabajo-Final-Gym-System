from pydantic import BaseModel, field_validator
from typing import Optional


class DisciplinaIn(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_mensual: float = 0.0
    imagen_url: Optional[str] = None

    @field_validator("nombre", mode="before")
    @classmethod
    def validar_nombre(cls, v):
        v = str(v).strip()
        if not v:
            raise ValueError("El nombre de la disciplina no puede estar vacío")
        if len(v) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        if len(v) > 100:
            raise ValueError("El nombre no puede superar los 100 caracteres")
        return v

    @field_validator("descripcion", mode="before")
    @classmethod
    def validar_descripcion(cls, v):
        if v is None or v == "":
            return None
        return str(v).strip()

    @field_validator("precio_mensual", mode="before")
    @classmethod
    def precio_no_negativo(cls, v):
        if v is None:
            return 0.0
        if float(v) < 0:
            raise ValueError("El precio mensual no puede ser negativo")
        return v


class DisciplinaOut(DisciplinaIn):
    id_disciplina: int

    class Config:
        from_attributes = True
