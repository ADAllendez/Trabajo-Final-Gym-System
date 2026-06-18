from pydantic import BaseModel, field_validator
from typing import Optional
import re


class InstructorIn(BaseModel):
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    id_disciplina: Optional[int] = None

    @field_validator("nombre", "apellido", mode="before")
    @classmethod
    def validar_nombre(cls, v, info):
        v = str(v).strip()
        if not v:
            raise ValueError(f"El campo '{info.field_name}' no puede estar vacío")
        if len(v) < 2:
            raise ValueError(f"El campo '{info.field_name}' debe tener al menos 2 caracteres")
        if len(v) > 100:
            raise ValueError(f"El campo '{info.field_name}' no puede superar los 100 caracteres")
        return v

    @field_validator("telefono", mode="before")
    @classmethod
    def validar_telefono(cls, v):
        if v is None or v == "":
            return None
        v = str(v).strip()
        if not re.fullmatch(r"[\d\+\s\-\(\)]{6,20}", v):
            raise ValueError("El teléfono debe tener entre 6 y 20 caracteres (dígitos, +, -, espacios)")
        return v

    @field_validator("id_disciplina", mode="before")
    @classmethod
    def id_positivo(cls, v):
        if v is None:
            return None
        if int(v) <= 0:
            raise ValueError("El ID de disciplina debe ser un número positivo")
        return v


class InstructorOut(InstructorIn):
    id_instructor: int

    class Config:
        from_attributes = True
