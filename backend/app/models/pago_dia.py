from sqlalchemy import Column, Integer, String, Float, Date
from app.models import Base

class PagoDia(Base):
    __tablename__ = "pago_dia"

    id_pago_dia = Column(Integer, primary_key=True, index=True)
    nombre_visitante = Column(String(150), nullable=False)   # Puede no ser miembro registrado
    disciplina = Column(String(100), nullable=True)
    monto = Column(Float, nullable=False)
    fecha = Column(Date, nullable=False)
    notas = Column(String(255), nullable=True)
