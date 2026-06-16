from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, Boolean
from sqlalchemy.orm import relationship
from app.models import Base

class Membresia(Base):
    __tablename__ = "membresia"

    id_membresia = Column(Integer, primary_key=True, index=True)
    id_miembro = Column(Integer, ForeignKey("miembro.id_miembro"), nullable=False)
    id_disciplina = Column(Integer, ForeignKey("disciplina.id_disciplina"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    estado = Column(String(20), nullable=False, default="nuevo")  # activo | vencido | nuevo
    precio_abonado = Column(Float, nullable=True)
    es_nuevo = Column(Boolean, default=True, nullable=False, server_default="1")  # True = cliente nuevo, False = retorno

    miembro = relationship("Miembro", back_populates="membresias")
    disciplina = relationship("Disciplina")