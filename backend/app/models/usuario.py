from sqlalchemy import Column, Integer, String, Text
from app.models import Base

class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False, default="admin") 

    # Datos del perfil del trabajador
    nombre = Column(String(100), nullable=True)
    apellido = Column(String(100), nullable=True)
    edad = Column(Integer, nullable=True)
    telefono = Column(String(30), nullable=True)
    correo = Column(String(100), nullable=True)
    dni = Column(String(20), unique=True, nullable=True)
    foto = Column(Text, nullable=True)  # base64 o URL