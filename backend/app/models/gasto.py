from sqlalchemy import Column, Integer, String, Float, Date, Text
from app.models import Base

class Gasto(Base):
    __tablename__ = "gasto"

    id_gasto = Column(Integer, primary_key=True, index=True)
    concepto = Column(String(255), nullable=False) # Ej: "Pago a instructor", "Mancuernas nuevas"
    categoria = Column(String(50), nullable=False) # Ej: "sueldos", "insumos", "servicios"
    monto = Column(Float, nullable=False)
    fecha = Column(Date, nullable=False)
    notas = Column(Text, nullable=True)  # Descripción detallada del gasto