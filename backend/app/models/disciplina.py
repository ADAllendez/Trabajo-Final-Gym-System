from sqlalchemy import Column, Integer, String, Float, Text
from app.models import Base

class Disciplina(Base):
    __tablename__ = "disciplina"

    id_disciplina = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(500), nullable=True)
    precio_mensual = Column(Float, nullable=False, default=0.0)
    imagen_url = Column(Text, nullable=True)  # base64 o URL externa
