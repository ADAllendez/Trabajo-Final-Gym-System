from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from datetime import date
from app.config.database import get_db
from app.models.membresia import Membresia
from app.models.miembro import Miembro
from app.models.disciplina import Disciplina
from app.models.gasto import Gasto
from app.models.pago_dia import PagoDia
from app.models.usuario import Usuario
from app.schemas.finanzas import DashboardMensualResponse, SinRenovarDetail

router = APIRouter(prefix="/api/finanzas", tags=["Finanzas"])

@router.get("/dashboard", response_model=DashboardMensualResponse)
async def obtener_dashboard_mensual(
    anio: int = Query(default=None),
    mes: int  = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    hoy = date.today()
    if anio is None:
        anio = hoy.year
    if mes is None:
        mes = hoy.month

    # Validar rango de mes y año
    if not (1 <= mes <= 12):
        raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12")
    if not (2000 <= anio <= 2100):
        raise HTTPException(status_code=400, detail="El año debe estar entre 2000 y 2100")

    primer_dia = date(anio, mes, 1)
    if mes == 12:
        ultimo_dia = date(anio + 1, 1, 1)
    else:
        ultimo_dia = date(anio, mes + 1, 1)

    # Ingresos por membresías
    res_ingresos = await db.execute(
        select(func.sum(Membresia.precio_abonado)).where(
            Membresia.fecha_inicio >= primer_dia,
            Membresia.fecha_inicio < ultimo_dia,
        )
    )
    ingresos_membresias = res_ingresos.scalar() or 0.0

    # Ingresos por pagos de día
    res_pagos_dia = await db.execute(
        select(func.sum(PagoDia.monto)).where(
            PagoDia.fecha >= primer_dia,
            PagoDia.fecha < ultimo_dia,
        )
    )
    ingresos_pagos_dia = res_pagos_dia.scalar() or 0.0

    ingresos = ingresos_membresias + ingresos_pagos_dia

    # Detalle de pagos por día del mes
    res_detalle_pagos_dia = await db.execute(
        select(PagoDia).where(
            PagoDia.fecha >= primer_dia,
            PagoDia.fecha < ultimo_dia,
        ).order_by(PagoDia.fecha)
    )
    pagos_dia_lista = res_detalle_pagos_dia.scalars().all()
    pagos_dia = [
        {
            "id_pago_dia": p.id_pago_dia,
            "nombre_visitante": p.nombre_visitante,
            "disciplina": p.disciplina,
            "monto": p.monto,
            "fecha": p.fecha,
            "notas": p.notas,
        }
        for p in pagos_dia_lista
    ]

    res_insumos = await db.execute(
        select(func.sum(Gasto.monto)).where(
            Gasto.fecha >= primer_dia,
            Gasto.fecha < ultimo_dia,
            Gasto.categoria != "sueldos"
        )
    )
    gastos_insumos = res_insumos.scalar() or 0.0

    res_sueldos = await db.execute(
        select(func.sum(Gasto.monto)).where(
            Gasto.fecha >= primer_dia,
            Gasto.fecha < ultimo_dia,
            Gasto.categoria == "sueldos"
        )
    )
    gastos_sueldos = res_sueldos.scalar() or 0.0

    total_egresos = gastos_insumos + gastos_sueldos
    ganancia_neta = ingresos - total_egresos

    # --- Agenda de sueldos: todos los trabajadores con sueldo y día de pago ---
    res_trabajadores = await db.execute(
        select(
            Usuario.id_usuario,
            Usuario.nombre,
            Usuario.apellido,
            Usuario.sueldo_mensual,
            Usuario.dia_de_pago,
            Usuario.rol,
        ).where(
            Usuario.sueldo_mensual != None,
            Usuario.sueldo_mensual > 0,
        )
    )
    agenda_sueldos = [
        {
            "id_usuario": row.id_usuario,
            "nombre": f"{row.nombre or ''} {row.apellido or ''}".strip() or row[0],
            "sueldo_mensual": row.sueldo_mensual,
            "dia_de_pago": row.dia_de_pago,
            "rol": row.rol,
        }
        for row in res_trabajadores.all()
    ]

    # --- Sin renovar: clientes con membresía vencida que no renovaron ---
    res_vencidos = await db.execute(
        select(
            Miembro.id_miembro,
            Miembro.nombre,
            Miembro.apellido,
            Miembro.telefono,
            Membresia.fecha_vencimiento,
            Membresia.precio_abonado,
            Disciplina.nombre.label("disciplina"),
            Disciplina.precio_mensual,
        )
        .join(Membresia, Membresia.id_miembro == Miembro.id_miembro)
        .join(Disciplina, Membresia.id_disciplina == Disciplina.id_disciplina)
        .where(
            Miembro.activo == True,
            Membresia.fecha_vencimiento >= primer_dia,
            Membresia.fecha_vencimiento < ultimo_dia,
            Membresia.estado == "vencido",
        )
    )
    filas_vencidos = res_vencidos.all()

    sin_renovar = []
    for row in filas_vencidos:
        res_activa = await db.execute(
            select(Membresia).where(
                Membresia.id_miembro == row.id_miembro,
                Membresia.fecha_inicio >= primer_dia,
                Membresia.fecha_inicio < ultimo_dia,
                Membresia.estado == "activo",
            )
        )
        if not res_activa.scalar_one_or_none():
            dias_vencido = (hoy - row.fecha_vencimiento).days if row.fecha_vencimiento < hoy else 0
            sin_renovar.append({
                "id_miembro": row.id_miembro,
                "nombre": f"{row.nombre} {row.apellido}",
                "telefono": row.telefono,
                "disciplina": row.disciplina,
                "precio_mensual": row.precio_mensual,
                "fecha_vencimiento": row.fecha_vencimiento,
                "dias_vencido": dias_vencido,
            })

    ingreso_perdido = sum(m["precio_mensual"] for m in sin_renovar)

    # --- Detalle de todos los gastos del mes ---
    res_gastos_detalle = await db.execute(
        select(Gasto).where(
            Gasto.fecha >= primer_dia,
            Gasto.fecha < ultimo_dia,
        ).order_by(Gasto.fecha.desc())
    )
    gastos_lista = res_gastos_detalle.scalars().all()
    gastos_del_mes = [
        {
            "id_gasto": g.id_gasto,
            "concepto": g.concepto,
            "categoria": g.categoria,
            "monto": g.monto,
            "fecha": g.fecha,
            "notas": g.notas,
        }
        for g in gastos_lista
    ]

    import locale
    try:
        locale.setlocale(locale.LC_TIME, "es_ES.UTF-8")
    except Exception:
        pass
    nombre_mes = primer_dia.strftime("%B %Y").capitalize()

    return {
        "mes": nombre_mes,
        "ingresos_totales": ingresos,
        "ingresos_membresias": ingresos_membresias,
        "ingresos_pagos_dia": ingresos_pagos_dia,
        "gastos_insumos": gastos_insumos,
        "pago_instructores": gastos_sueldos,
        "ganancia_neta": ganancia_neta,
        "sin_renovar": sin_renovar,
        "ingreso_perdido": ingreso_perdido,
        "pagos_dia": pagos_dia,
        "agenda_sueldos": agenda_sueldos,
        "gastos_del_mes": gastos_del_mes,
    }