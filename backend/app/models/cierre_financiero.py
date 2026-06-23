from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.models import Base

class CierreFinanciero(Base):
    __tablename__ = "cierre_financiero"

    id_cierre = Column(Integer, primary_key=True, index=True)
    periodo = Column(String(20), nullable=False)  # Ej: "2024-03" o "Semana 12-2024"
    tipo = Column(String(10), nullable=False)     # "mensual" o "semanal"
    total_ingresos = Column(Float, nullable=False)
    total_egresos = Column(Float, nullable=False)
    balance_neto = Column(Float, nullable=False)
    fecha_ejecucion = Column(DateTime, default=datetime.now) # Cuándo se hizo el cierre