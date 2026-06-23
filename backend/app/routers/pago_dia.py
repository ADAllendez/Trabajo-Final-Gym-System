from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.config.database import get_db
from app.models.pago_dia import PagoDia
from app.schemas.pago_dia import PagoDiaIn, PagoDiaOut

router = APIRouter(prefix="/pagos-dia", tags=["PagosDia"])

@router.get("/", response_model=List[PagoDiaOut])
async def listar_pagos_dia(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PagoDia).order_by(PagoDia.fecha.desc()))
    return result.scalars().all()

@router.post("/", response_model=PagoDiaOut)
async def crear_pago_dia(datos: PagoDiaIn, db: AsyncSession = Depends(get_db)):
    nuevo = PagoDia(**datos.model_dump())
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)
    return nuevo

@router.delete("/{id_pago_dia}")
async def eliminar_pago_dia(id_pago_dia: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PagoDia).where(PagoDia.id_pago_dia == id_pago_dia))
    pago = result.scalar_one_or_none()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    await db.delete(pago)
    await db.commit()
    return {"message": "Eliminado"}
