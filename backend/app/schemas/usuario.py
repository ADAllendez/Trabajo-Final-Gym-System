from pydantic import BaseModel, field_validator
from typing import Optional
import re

ROLES_VALIDOS = {"root", "admin", "empleado"}


class UsuarioBase(BaseModel):
    username: str
    rol: str = "admin"

    # Datos del perfil — opcionales para no romper el usuario root
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    edad: Optional[int] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    dni: Optional[str] = None
    sueldo_mensual: Optional[float] = None
    dia_de_pago: Optional[int] = None      # Número del día del mes: 1-31
    fecha_contratacion: Optional[str] = None
    foto: Optional[str] = None

    @field_validator("username", mode="before")
    @classmethod
    def validar_username(cls, v):
        v = str(v).strip()
        if not v:
            raise ValueError("El nombre de usuario no puede estar vacío")
        if len(v) < 3:
            raise ValueError("El nombre de usuario debe tener al menos 3 caracteres")
        if len(v) > 50:
            raise ValueError("El nombre de usuario no puede superar los 50 caracteres")
        if not re.fullmatch(r"[a-zA-Z0-9_.\-]+", v):
            raise ValueError("El nombre de usuario solo puede contener letras, números, puntos (.), guiones (-) y guiones bajos (_)")
        return v

    @field_validator("rol", mode="before")
    @classmethod
    def validar_rol(cls, v):
        v = str(v).strip().lower()
        if v not in ROLES_VALIDOS:
            raise ValueError(f"El rol debe ser uno de: {', '.join(sorted(ROLES_VALIDOS))}")
        return v

    @field_validator("nombre", "apellido", mode="before")
    @classmethod
    def validar_nombre(cls, v):
        if v is None or v == "":
            return None
        v = str(v).strip()
        if len(v) > 100:
            raise ValueError("El nombre/apellido no puede superar los 100 caracteres")
        return v

    @field_validator("edad", mode="before")
    @classmethod
    def validar_edad(cls, v):
        if v is None:
            return None
        v = int(v)
        if v < 18:
            raise ValueError("La edad mínima permitida es 18 años")
        if v > 80:
            raise ValueError("La edad no puede superar los 80 años")
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

    @field_validator("sueldo_mensual", mode="before")
    @classmethod
    def validar_sueldo(cls, v):
        if v is None:
            return None
        v = float(v)
        if v < 0:
            raise ValueError("El sueldo mensual no puede ser negativo")
        return v

    @field_validator("dia_de_pago", mode="before")
    @classmethod
    def validar_dia_de_pago(cls, v):
        if v is None:
            return None
        v = int(v)
        if not (1 <= v <= 31):
            raise ValueError("El día de pago debe ser entre 1 y 31")
        return v


class UsuarioCreate(UsuarioBase):
    password: str

    @field_validator("password", mode="before")
    @classmethod
    def validar_password(cls, v):
        if not v or len(str(v).strip()) < 4:
            raise ValueError("La contraseña debe tener al menos 4 caracteres")
        return v


class UsuarioUpdate(BaseModel):
    """Para editar: la password es opcional (si no la mandan, no se cambia)"""
    username: Optional[str] = None
    rol: Optional[str] = None
    password: Optional[str] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    edad: Optional[int] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    dni: Optional[str] = None
    sueldo_mensual: Optional[float] = None
    dia_de_pago: Optional[int] = None
    fecha_contratacion: Optional[str] = None
    foto: Optional[str] = None

    @field_validator("username", mode="before")
    @classmethod
    def validar_username(cls, v):
        if v is None or v == "":
            return None
        v = str(v).strip()
        if len(v) < 3:
            raise ValueError("El nombre de usuario debe tener al menos 3 caracteres")
        if len(v) > 50:
            raise ValueError("El nombre de usuario no puede superar los 50 caracteres")
        if not re.fullmatch(r"[a-zA-Z0-9_.\-]+", v):
            raise ValueError("El nombre de usuario solo puede contener letras, números, puntos (.), guiones (-) y guiones bajos (_)")
        return v

    @field_validator("password", mode="before")
    @classmethod
    def validar_password(cls, v):
        if v is None or v == "":
            return None
        if len(str(v).strip()) < 4:
            raise ValueError("La contraseña debe tener al menos 4 caracteres")
        return v

    @field_validator("rol", mode="before")
    @classmethod
    def validar_rol(cls, v):
        if v is None:
            return None
        v = str(v).strip().lower()
        if v not in ROLES_VALIDOS:
            raise ValueError(f"El rol debe ser uno de: {', '.join(sorted(ROLES_VALIDOS))}")
        return v

    @field_validator("edad", mode="before")
    @classmethod
    def validar_edad(cls, v):
        if v is None:
            return None
        v = int(v)
        if v < 18 or v > 80:
            raise ValueError("La edad debe estar entre 18 y 80 años")
        return v

    @field_validator("dia_de_pago", mode="before")
    @classmethod
    def validar_dia_de_pago(cls, v):
        if v is None:
            return None
        v = int(v)
        if not (1 <= v <= 31):
            raise ValueError("El día de pago debe ser entre 1 y 31")
        return v

    @field_validator("sueldo_mensual", mode="before")
    @classmethod
    def validar_sueldo(cls, v):
        if v is None:
            return None
        if float(v) < 0:
            raise ValueError("El sueldo mensual no puede ser negativo")
        return v

    @field_validator("correo", mode="before")
    @classmethod
    def validar_correo(cls, v):
        if v is None or v == "":
            return None
        v = str(v).strip()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("El correo electrónico no tiene un formato válido")
        return v


class UsuarioResponse(UsuarioBase):
    id_usuario: int

    class Config:
        from_attributes = True