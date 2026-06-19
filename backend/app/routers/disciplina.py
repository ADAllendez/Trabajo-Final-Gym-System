from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.config.database import get_db
from app.models.disciplina import Disciplina
from app.models.membresia import Membresia
from app.models.instructor import Instructor
from app.schemas.disciplina import DisciplinaIn, DisciplinaOut

router = APIRouter(prefix="/disciplinas", tags=["Disciplinas"])


@router.get("/", response_model=list[DisciplinaOut])
async def listar_disciplinas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Disciplina))
    return result.scalars().all()


@router.get("/{id_disciplina}", response_model=DisciplinaOut)
async def obtener_disciplina(id_disciplina: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Disciplina).where(Disciplina.id_disciplina == id_disciplina))
    disciplina = result.scalar_one_or_none()
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina no encontrada")
    return disciplina


@router.post("/", response_model=DisciplinaOut)
async def crear_disciplina(datos: DisciplinaIn, db: AsyncSession = Depends(get_db)):
    # Verificar nombre duplicado (case-insensitive)
    res = await db.execute(
        select(Disciplina).where(func.lower(Disciplina.nombre) == datos.nombre.lower())
    )
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Ya existe una disciplina con el nombre '{datos.nombre}'")

    try:
        nueva = Disciplina(**datos.model_dump())
        db.add(nueva)
        await db.commit()
        await db.refresh(nueva)
        return nueva
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad al crear la disciplina")


@router.put("/{id_disciplina}", response_model=DisciplinaOut)
async def actualizar_disciplina(id_disciplina: int, datos: DisciplinaIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Disciplina).where(Disciplina.id_disciplina == id_disciplina))
    disciplina = result.scalar_one_or_none()
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina no encontrada")

    # Verificar nombre duplicado (excluir la propia)
    res = await db.execute(
        select(Disciplina).where(
            func.lower(Disciplina.nombre) == datos.nombre.lower(),
            Disciplina.id_disciplina != id_disciplina,
        )
    )
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Ya existe otra disciplina con el nombre '{datos.nombre}'")

    try:
        for key, value in datos.model_dump().items():
            setattr(disciplina, key, value)
        await db.commit()
        await db.refresh(disciplina)
        return disciplina
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad al actualizar la disciplina")


@router.delete("/{id_disciplina}")
async def eliminar_disciplina(id_disciplina: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Disciplina).where(Disciplina.id_disciplina == id_disciplina))
    disciplina = result.scalar_one_or_none()
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina no encontrada")

    # Verificar si hay membresías asociadas
    res_mem = await db.execute(
        select(Membresia).where(Membresia.id_disciplina == id_disciplina)
    )
    if res_mem.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar la disciplina porque tiene membresías asociadas"
        )

    # Verificar si hay instructores asociados
    res_inst = await db.execute(
        select(Instructor).where(Instructor.id_disciplina == id_disciplina)
    )
    if res_inst.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar la disciplina porque tiene instructores asociados. Reasignálos primero."
        )

    try:
        await db.delete(disciplina)
        await db.commit()
        return {"message": "Disciplina eliminada correctamente"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar la disciplina por registros asociados")
