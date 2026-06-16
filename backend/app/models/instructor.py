from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models import Base

class Instructor(Base):
    __tablename__ = "instructor"

    id_instructor = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    telefono = Column(String(30), nullable=True)
    id_disciplina = Column(
        Integer,
        ForeignKey("disciplina.id_disciplina", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True
    )

    disciplina = relationship("Disciplina", backref="instructores")
