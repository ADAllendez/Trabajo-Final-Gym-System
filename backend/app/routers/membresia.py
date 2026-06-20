from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from datetime import date

from app.config.database import get_db
from app.models.membresia import Membresia
from app.models.miembro import Miembro
from app.models.disciplina import Disciplina
from app.schemas.membresia import MembresiaIn, MembresiaOut

router = APIRouter(prefix="/membresias", tags=["Membresias"])


# LISTAR todas con datos enriquecidos
@router.get("/", response_model=list[MembresiaOut])
async def listar_membresias(db: AsyncSession = Depends(get_db)):
    hoy = date.today()

    # Auto-actualizar estados vencidos
    res_venc = await db.execute(
        select(Membresia).where(
            Membresia.fecha_vencimiento < hoy,
            Membresia.estado != "vencido",
        )
    )
    para_vencer = res_venc.scalars().all()
    if para_vencer:
        ids_miembros_afectados = set()
        for m in para_vencer:
            m.estado = "vencido"
            ids_miembros_afectados.add(m.id_miembro)

        # Desactivar miembros que no tienen ninguna membresía vigente
        for id_m in ids_miembros_afectados:
            res_vigente = await db.execute(
                select(Membresia).where(
                    Membresia.id_miembro == id_m,
                    Membresia.fecha_vencimiento >= hoy,
                )
            )
            if not res_vigente.scalar_one_or_none():
                res_miembro = await db.execute(
                    select(Miembro).where(Miembro.id_miembro == id_m)
                )
                miembro = res_miembro.scalar_one_or_none()
                if miembro and miembro.activo:
                    miembro.activo = False

        await db.commit()

    result = await db.execute(
        select(
            Membresia,
            Miembro.nombre.label("m_nombre"),
            Miembro.apellido.label("m_apellido"),
            Disciplina.nombre.label("d_nombre"),
        )
        .join(Miembro, Membresia.id_miembro == Miembro.id_miembro)
        .join(Disciplina, Membresia.id_disciplina == Disciplina.id_disciplina)
    )
    rows = result.all()

    membresias = []
    for mem, m_nombre, m_apellido, d_nombre in rows:
        membresias.append({
            "id_membresia": mem.id_membresia,
            "id_miembro": mem.id_miembro,
            "id_disciplina": mem.id_disciplina,
            "fecha_inicio": mem.fecha_inicio,
            "fecha_vencimiento": mem.fecha_vencimiento,
            "estado": mem.estado,
            "precio_abonado": mem.precio_abonado,
            "nombre_miembro": f"{m_nombre} {m_apellido}",
            "nombre_disciplina": d_nombre,
        })
    return membresias


# OBTENER por ID
@router.get("/{id_membresia}", response_model=MembresiaOut)
async def obtener_membresia(id_membresia: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Membresia).where(Membresia.id_membresia == id_membresia))
    mem = result.scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")
    return mem


# CREAR — determina automáticamente si es cliente nuevo o retorno
@router.post("/", response_model=MembresiaOut)
async def crear_membresia(datos: MembresiaIn, db: AsyncSession = Depends(get_db)):
    # Validar que el miembro existe
    res = await db.execute(select(Miembro).where(Miembro.id_miembro == datos.id_miembro))
    miembro = res.scalar_one_or_none()
    if not miembro:
        raise HTTPException(status_code=400, detail="El miembro especificado no existe")

    # Validar que la disciplina existe
    res = await db.execute(select(Disciplina).where(Disciplina.id_disciplina == datos.id_disciplina))
    disciplina = res.scalar_one_or_none()
    if not disciplina:
        raise HTTPException(status_code=400, detail="La disciplina especificada no existe")

    # Verificar que el miembro no tenga ya una membresía activa/futura en la misma disciplina
    hoy = date.today()
    res_activa = await db.execute(
        select(Membresia).where(
            Membresia.id_miembro == datos.id_miembro,
            Membresia.id_disciplina == datos.id_disciplina,
            Membresia.fecha_vencimiento >= hoy,
        )
    )
    if res_activa.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"El miembro ya tiene una membresía activa en '{disciplina.nombre}'. Renovar en su lugar."
        )

    # Verificar si el miembro ya tuvo membresías previas (cliente retorno vs nuevo)
    res_prev = await db.execute(
        select(Membresia).where(Membresia.id_miembro == datos.id_miembro)
    )
    membresias_previas = res_prev.scalars().all()
    es_nuevo = len(membresias_previas) == 0

    # Auto-asignar estado según fechas
    if datos.fecha_inicio <= hoy:
        if datos.fecha_vencimiento < hoy:
            datos.estado = "vencido"
        else:
            datos.estado = "activo"
    else:
        datos.estado = "nuevo"

    # Si el miembro estaba desactivado y vuelve, reactivarlo
    if not miembro.activo:
        miembro.activo = True

    try:
        nueva = Membresia(
            id_miembro=datos.id_miembro,
            id_disciplina=datos.id_disciplina,
            fecha_inicio=datos.fecha_inicio,
            fecha_vencimiento=datos.fecha_vencimiento,
            estado=datos.estado,
            precio_abonado=datos.precio_abonado,
            es_nuevo=es_nuevo,
        )
        db.add(nueva)
        await db.commit()
        await db.refresh(nueva)
        return nueva
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad al crear la membresía")


# ACTUALIZAR
@router.put("/{id_membresia}", response_model=MembresiaOut)
async def actualizar_membresia(id_membresia: int, datos: MembresiaIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Membresia).where(Membresia.id_membresia == id_membresia))
    mem = result.scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")

    # Validar miembro y disciplina
    res_m = await db.execute(select(Miembro).where(Miembro.id_miembro == datos.id_miembro))
    if not res_m.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El miembro especificado no existe")

    res_d = await db.execute(select(Disciplina).where(Disciplina.id_disciplina == datos.id_disciplina))
    disciplina = res_d.scalar_one_or_none()
    if not disciplina:
        raise HTTPException(status_code=400, detail="La disciplina especificada no existe")

    # Verificar solapamiento (excluir la propia membresía)
    hoy = date.today()
    res_activa = await db.execute(
        select(Membresia).where(
            Membresia.id_miembro == datos.id_miembro,
            Membresia.id_disciplina == datos.id_disciplina,
            Membresia.fecha_vencimiento >= hoy,
            Membresia.id_membresia != id_membresia,
        )
    )
    if res_activa.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=f"El miembro ya tiene otra membresía activa en '{disciplina.nombre}'"
        )

    try:
        for key, value in datos.model_dump(exclude={"id_instructor"}).items():
            setattr(mem, key, value)
        await db.commit()
        await db.refresh(mem)
        return mem
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad al actualizar la membresía")


# RENOVAR membresía (crea una nueva a partir de la actual)
@router.post("/{id_membresia}/renovar", response_model=MembresiaOut)
async def renovar_membresia(id_membresia: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Membresia).where(Membresia.id_membresia == id_membresia))
    mem = result.scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")

    # Obtener precio de la disciplina
    res_disc = await db.execute(select(Disciplina).where(Disciplina.id_disciplina == mem.id_disciplina))
    disciplina = res_disc.scalar_one_or_none()

    # Reactivar miembro si estaba desactivado
    res_miembro = await db.execute(select(Miembro).where(Miembro.id_miembro == mem.id_miembro))
    miembro = res_miembro.scalar_one_or_none()
    if miembro and not miembro.activo:
        miembro.activo = True

    from datetime import timedelta
    hoy = date.today()

    try:
        nueva = Membresia(
            id_miembro=mem.id_miembro,
            id_disciplina=mem.id_disciplina,
            fecha_inicio=hoy,
            fecha_vencimiento=hoy + timedelta(days=30),
            estado="activo",
            precio_abonado=disciplina.precio_mensual if disciplina else mem.precio_abonado,
            es_nuevo=False,  # renovación = cliente de retorno
        )
        db.add(nueva)
        await db.commit()
        await db.refresh(nueva)
        return nueva
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error al renovar la membresía")


# DESACTIVAR miembros cuya última membresía venció
@router.post("/check-vencidos")
async def desactivar_vencidos(db: AsyncSession = Depends(get_db)):
    """
    Recorre todos los miembros activos y desactiva a los que no tienen
    ninguna membresía activa o futura (su última membresía venció).
    """
    hoy = date.today()
    res = await db.execute(select(Miembro).where(Miembro.activo == True))
    miembros_activos = res.scalars().all()

    desactivados = []
    for m in miembros_activos:
        res_mem = await db.execute(
            select(Membresia)
            .where(
                Membresia.id_miembro == m.id_miembro,
                Membresia.fecha_vencimiento >= hoy,
            )
        )
        vigente = res_mem.scalar_one_or_none()
        if vigente is None:
            m.activo = False
            desactivados.append(m.id_miembro)

    await db.commit()
    return {"desactivados": desactivados, "total": len(desactivados)}


# ELIMINAR
@router.delete("/{id_membresia}")
async def eliminar_membresia(id_membresia: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Membresia).where(Membresia.id_membresia == id_membresia))
    mem = result.scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")

    try:
        await db.delete(mem)
        await db.commit()
        return {"message": "Membresía eliminada correctamente"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="No se puede eliminar la membresía por registros asociados")
