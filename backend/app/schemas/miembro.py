from pydantic import BaseModel, field_validator, model_validator, EmailStr
from typing import Optional
from datetime import date

class MiembroBase(BaseModel):
    nombre: str
    apellido: str
    dni: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    activo: bool = True

    @field_validator("nombre", "apellido", mode="before")
    @classmethod
    def strip_y_no_vacio(cls, v, info):
        if v is None:
            return v
        v = str(v).strip()
        if not v:
            raise ValueError(f"El campo '{info.field_name}' no puede estar vacío")
        if len(v) < 2:
            raise ValueError(f"El campo '{info.field_name}' debe tener al menos 2 caracteres")
        if len(v) > 100:
            raise ValueError(f"El campo '{info.field_name}' no puede superar los 100 caracteres")
        return v

    @field_validator("dni", mode="before")
    @classmethod
    def validar_dni(cls, v):
        if v is None or v == "":
            return None
        v = str(v).strip()
        if not v.isdigit():
            raise ValueError("El DNI debe contener solo dígitos")
        if not (6 <= len(v) <= 11):
            raise ValueError("El DNI debe tener entre 6 y 11 dígitos")
        return v

    @field_validator("correo", mode="before")
    @classmethod
    def validar_correo(cls, v):
        if v is None or v == "":
            return None
        v = str(v).strip()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("El correo electrónico no tiene un formato válido")
        if len(v) > 100:
            raise ValueError("El correo no puede superar los 100 caracteres")
        return v

    @field_validator("telefono", mode="before")
    @classmethod
    def validar_telefono(cls, v):
        if v is None or v == "":
            return None
        v = str(v).strip()
        # Permite dígitos, +, espacios, guiones y paréntesis
        import re
        if not re.fullmatch(r"[\d\+\s\-\(\)]{6,20}", v):
            raise ValueError("El teléfono debe tener entre 6 y 20 caracteres (dígitos, +, -, espacios)")
        return v

    @field_validator("fecha_nacimiento", mode="before")
    @classmethod
    def validar_fecha_nacimiento(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            from datetime import date as d
            v = d.fromisoformat(v)
        hoy = date.today()
        if v > hoy:
            raise ValueError("La fecha de nacimiento no puede ser futura")
        edad = (hoy - v).days // 365
        if edad < 5:
            raise ValueError("La edad mínima permitida es de 5 años")
        if edad > 120:
            raise ValueError("La fecha de nacimiento no parece válida")
        return v


class MiembroIn(MiembroBase):
    pass


class MiembroOut(MiembroBase):
    id_miembro: int
    activo: bool

    class Config:
        from_attributes = True
