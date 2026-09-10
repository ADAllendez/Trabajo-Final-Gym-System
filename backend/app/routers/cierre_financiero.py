from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date, datetime
from pydantic import BaseModel
from typing import List, Optional

from app.config.database import get_db
from app.models.cierre_financiero import CierreFinanciero
from app.models.membresia import Membresia
from app.models.gasto import Gasto
from app.models.pago_dia import PagoDia

router = APIRouter(prefix="/api/cierres", tags=["Cierres Financieros"])


class CierreOut(BaseModel):
    id_cierre: int
    periodo: str
    tipo: str
    total_ingresos: float
    total_egresos: float
    balance_neto: float
    fecha_ejecucion: datetime

    class Config:
        from_attributes = True


# ─── LISTAR historial de cierres ─────────────────────────────────────────────
@router.get("/", response_model=List[CierreOut])
async def listar_cierres(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(CierreFinanciero).order_by(CierreFinanciero.fecha_ejecucion.desc())
    )
    return res.scalars().all()


# ─── EJECUTAR cierre mensual ──────────────────────────────────────────────────
@router.post("/mensual", response_model=CierreOut)
async def cerrar_mes(anio: int, mes: int, db: AsyncSession = Depends(get_db)):
    """
    Genera el cierre de caja mensual para el período indicado.
    Validaciones:
      - El mes no debe haber sido cerrado previamente.
      - Calcula ingresos (membresías + pagos por día) y egresos (gastos) del período.
    """
    if not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12")
    if not (2000 <= anio <= 2100):
        raise HTTPException(status_code=400, detail="El año debe estar entre 2000 y 2100")

    periodo = f"{anio}-{mes:02d}"

    # Validación: el mes ya fue cerrado
    res_existente = await db.execute(
        select(CierreFinanciero).where(
            CierreFinanciero.periodo == periodo,
            CierreFinanciero.tipo == "mensual",
        )
    )
    if res_existente.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El mes ya fue cerrado")

    # Rango del período
    primer_dia = date(anio, mes, 1)
    ultimo_dia = date(anio + 1, 1, 1) if mes == 12 else date(anio, mes + 1, 1)

    # Ingresos membresías
    res_mem = await db.execute(
        select(func.sum(Membresia.precio_abonado)).where(
            Membresia.fecha_inicio >= primer_dia,
            Membresia.fecha_inicio < ultimo_dia,
        )
    )
    ingresos_mem = res_mem.scalar() or 0.0

    # Ingresos pagos por día
    res_pdia = await db.execute(
        select(func.sum(PagoDia.monto)).where(
            PagoDia.fecha >= primer_dia,
            PagoDia.fecha < ultimo_dia,
        )
    )
    ingresos_pdia = res_pdia.scalar() or 0.0

    total_ingresos = ingresos_mem + ingresos_pdia

    # Egresos (todos los gastos del período)
    res_gastos = await db.execute(
        select(func.sum(Gasto.monto)).where(
            Gasto.fecha >= primer_dia,
            Gasto.fecha < ultimo_dia,
        )
    )
    total_egresos = res_gastos.scalar() or 0.0

    balance_neto = total_ingresos - total_egresos

    cierre = CierreFinanciero(
        periodo=periodo,
        tipo="mensual",
        total_ingresos=total_ingresos,
        total_egresos=total_egresos,
        balance_neto=balance_neto,
        fecha_ejecucion=datetime.now(),
    )
    db.add(cierre)
    await db.commit()
    await db.refresh(cierre)
    return cierre


# ─── DESBLOQUEAR (eliminar) un cierre ────────────────────────────────────────
@router.delete("/{id_cierre}")
async def desbloquear_cierre(id_cierre: int, db: AsyncSession = Depends(get_db)):
    """
    Elimina el registro de cierre para permitir correcciones.
    Validación: debe existir un cierre con ese ID.
    No borra datos de membresías, gastos ni pagos.
    """
    res = await db.execute(
        select(CierreFinanciero).where(CierreFinanciero.id_cierre == id_cierre)
    )
    cierre = res.scalar_one_or_none()
    if not cierre:
        raise HTTPException(status_code=404, detail="No existe cierre para ese período")

    await db.delete(cierre)
    await db.commit()
    return {"message": "Cierre eliminado. El período puede cerrarse nuevamente."}


# ─── VERIFICAR si un período ya fue cerrado ───────────────────────────────────
@router.get("/verificar")
async def verificar_cierre(anio: int, mes: int, db: AsyncSession = Depends(get_db)):
    periodo = f"{anio}-{mes:02d}"
    res = await db.execute(
        select(CierreFinanciero).where(
            CierreFinanciero.periodo == periodo,
            CierreFinanciero.tipo == "mensual",
        )
    )
    cierre = res.scalar_one_or_none()
    return {"cerrado": cierre is not None, "periodo": periodo}
