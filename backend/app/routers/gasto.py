from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import date
from app.config.database import get_db
from app.models.gasto import Gasto
from app.schemas.gasto import GastoCreate, Gasto as GastoSchema

router = APIRouter(prefix="/api/gastos", tags=["Gastos"])


@router.post("/", response_model=GastoSchema)
async def crear_gasto(gasto: GastoCreate, db: AsyncSession = Depends(get_db)):
    # Protección contra gastos duplicados (mismo concepto + monto + fecha)
    res = await db.execute(
        select(Gasto).where(
            Gasto.concepto == gasto.concepto,
            Gasto.monto == gasto.monto,
            Gasto.fecha == gasto.fecha,
        )
    )
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Ya existe un gasto con el mismo concepto, monto y fecha. Verificá si es un duplicado."
        )

    try:
        nuevo_gasto = Gasto(**gasto.model_dump())
        db.add(nuevo_gasto)
        await db.commit()
        await db.refresh(nuevo_gasto)
        return nuevo_gasto
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad al crear el gasto")


@router.get("/", response_model=List[GastoSchema])
async def obtener_gastos(
    anio: Optional[int] = Query(default=None),
    mes: Optional[int] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    # Validar mes y año si se proveen
    if mes is not None and not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12")
    if anio is not None and not (2000 <= anio <= 2100):
        raise HTTPException(status_code=400, detail="El año debe estar entre 2000 y 2100")

    query = select(Gasto).order_by(Gasto.fecha.desc())
    if anio and mes:
        primer_dia = date(anio, mes, 1)
        if mes == 12:
            ultimo_dia = date(anio + 1, 1, 1)
        else:
            ultimo_dia = date(anio, mes + 1, 1)
        query = query.where(Gasto.fecha >= primer_dia, Gasto.fecha < ultimo_dia)
    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/{id_gasto}", response_model=GastoSchema)
async def eliminar_gasto(id_gasto: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Gasto).where(Gasto.id_gasto == id_gasto))
    gasto = result.scalar_one_or_none()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    try:
        await db.delete(gasto)
        await db.commit()
        return gasto
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar el gasto por registros asociados")