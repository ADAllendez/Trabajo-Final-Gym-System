from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from typing import List

from app.config.database import get_db
from app.models.miembro import Miembro
from app.models.membresia import Membresia
from app.schemas.miembro import MiembroIn, MiembroOut

router = APIRouter(prefix="/miembros", tags=["Miembros"])


# LISTAR TODOS (acepta ?solo_activos=true para filtrar)
@router.get("/", response_model=List[MiembroOut])
async def listar_miembros(solo_activos: bool = False, db: AsyncSession = Depends(get_db)):
    q = select(Miembro)
    if solo_activos:
        q = q.where(Miembro.activo == True)
    result = await db.execute(q)
    return result.scalars().all()


# OBTENER POR ID
@router.get("/{id_miembro}", response_model=MiembroOut)
async def obtener_miembro(id_miembro: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Miembro).where(Miembro.id_miembro == id_miembro))
    miembro = result.scalar_one_or_none()
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return miembro


# CREAR
@router.post("/", response_model=MiembroOut)
async def crear_miembro(datos: MiembroIn, db: AsyncSession = Depends(get_db)):
    # Verificar DNI duplicado
    if datos.dni:
        res = await db.execute(select(Miembro).where(Miembro.dni == datos.dni))
        if res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Ya existe un miembro con el DNI '{datos.dni}'")

    # Verificar correo duplicado
    if datos.correo:
        res = await db.execute(select(Miembro).where(Miembro.correo == datos.correo))
        if res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Ya existe un miembro con el correo '{datos.correo}'")

    try:
        nuevo = Miembro(**datos.model_dump())
        db.add(nuevo)
        await db.commit()
        await db.refresh(nuevo)
        return nuevo
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad: datos duplicados o inválidos")


# ACTUALIZAR
@router.put("/{id_miembro}", response_model=MiembroOut)
async def actualizar_miembro(id_miembro: int, datos: MiembroIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Miembro).where(Miembro.id_miembro == id_miembro))
    miembro = result.scalar_one_or_none()
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")

    # Verificar DNI duplicado (excluyendo el propio registro)
    if datos.dni:
        res = await db.execute(
            select(Miembro).where(Miembro.dni == datos.dni, Miembro.id_miembro != id_miembro)
        )
        if res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"El DNI '{datos.dni}' ya está registrado en otro miembro")

    # Verificar correo duplicado (excluyendo el propio registro)
    if datos.correo:
        res = await db.execute(
            select(Miembro).where(Miembro.correo == datos.correo, Miembro.id_miembro != id_miembro)
        )
        if res.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"El correo '{datos.correo}' ya está registrado en otro miembro")

    try:
        for key, value in datos.model_dump().items():
            setattr(miembro, key, value)
        await db.commit()
        await db.refresh(miembro)
        return miembro
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad: datos duplicados o inválidos")


# ACTIVAR / DESACTIVAR (soft-delete)
@router.patch("/{id_miembro}/toggle-activo", response_model=MiembroOut)
async def toggle_activo(id_miembro: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Miembro).where(Miembro.id_miembro == id_miembro))
    miembro = result.scalar_one_or_none()
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    miembro.activo = not miembro.activo
    await db.commit()
    await db.refresh(miembro)
    return miembro


# ELIMINAR (permanente — usar con cuidado)
@router.delete("/{id_miembro}")
async def eliminar_miembro(id_miembro: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Miembro).where(Miembro.id_miembro == id_miembro))
    miembro = result.scalar_one_or_none()
    if not miembro:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")

    # Verificar si tiene membresías activas o futuras
    from datetime import date
    res_mem = await db.execute(
        select(Membresia).where(
            Membresia.id_miembro == id_miembro,
            Membresia.fecha_vencimiento >= date.today(),
        )
    )
    if res_mem.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el miembro porque tiene membresías activas o futuras. Desactivalo en su lugar."
        )

    try:
        await db.delete(miembro)
        await db.commit()
        return {"message": "Miembro eliminado correctamente"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar el miembro porque tiene registros asociados")
