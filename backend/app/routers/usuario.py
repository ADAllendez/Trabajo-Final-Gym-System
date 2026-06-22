from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import List, Optional

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])

# Configuración de Seguridad y JWT
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "gym_manager_clave_super_secreta"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

# ── Helpers ──────────────────────────────────────────────
def hash_password(password: str):
    return pwd_context.hash(password)

def verificar_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def crear_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ── Endpoints ─────────────────────────────────────────────

@router.post("/login")
async def login(datos: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.username == datos.username))
    user = result.scalar_one_or_none()
    if not user or not verificar_password(datos.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    token_data = {"sub": user.username, "rol": user.rol, "id": user.id_usuario}
    token = crear_access_token(token_data)
    return {"access_token": token, "token_type": "bearer"}


async def _get_user_from_token(authorization: str, db: AsyncSession) -> Usuario:
    """Helper: extrae el usuario del header Authorization: Bearer <token>."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    result = await db.execute(select(Usuario).where(Usuario.id_usuario == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.get("/me", response_model=UsuarioResponse)
async def obtener_mi_perfil(
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Retorna el perfil del usuario autenticado."""
    return await _get_user_from_token(authorization, db)


@router.put("/me", response_model=UsuarioResponse)
async def actualizar_mi_perfil(
    datos: UsuarioUpdate,
    authorization: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Actualiza el perfil del usuario autenticado (foto, nombre, apellido, etc.)."""
    user = await _get_user_from_token(authorization, db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        if campo == "password" and valor:
            setattr(user, "password_hash", hash_password(valor))
        elif campo != "password":
            setattr(user, campo, valor)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/", response_model=List[UsuarioResponse])
async def listar_usuarios(db: AsyncSession = Depends(get_db)):
    """Retorna todos los usuarios que NO son root (trabajadores)."""
    result = await db.execute(select(Usuario).where(Usuario.username != "root"))
    users = result.scalars().all()
    return users


@router.post("/", response_model=UsuarioResponse)
async def crear_usuario(usuario: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    # Verificar que el username no exista
    result = await db.execute(select(Usuario).where(Usuario.username == usuario.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    # Verificar que el DNI no esté duplicado (si se provee)
    if usuario.dni:
        result_dni = await db.execute(select(Usuario).where(Usuario.dni == usuario.dni))
        if result_dni.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="El DNI ya está registrado")

    nuevo_usuario = Usuario(
        username=usuario.username,
        password_hash=hash_password(usuario.password),
        rol=usuario.rol,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        edad=usuario.edad,
        telefono=usuario.telefono,
        correo=usuario.correo,
        dni=usuario.dni,
        sueldo_mensual=usuario.sueldo_mensual,
        dia_de_pago=usuario.dia_de_pago,
        fecha_contratacion=usuario.fecha_contratacion,
    )
    db.add(nuevo_usuario)
    await db.commit()
    await db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.get("/{id}", response_model=UsuarioResponse)
async def obtener_usuario_por_id(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.id_usuario == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.put("/{id}", response_model=UsuarioResponse)
async def actualizar_usuario(id: int, datos: UsuarioUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.id_usuario == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar solo los campos que llegaron
    if datos.username is not None:
        user.username = datos.username
    if datos.password is not None:
        user.password_hash = hash_password(datos.password)
    if datos.rol is not None:
        user.rol = datos.rol
    if datos.nombre is not None:
        user.nombre = datos.nombre
    if datos.apellido is not None:
        user.apellido = datos.apellido
    if datos.edad is not None:
        user.edad = datos.edad
    if datos.telefono is not None:
        user.telefono = datos.telefono
    if datos.correo is not None:
        user.correo = datos.correo
    if datos.dni is not None:
        user.dni = datos.dni
    if datos.sueldo_mensual is not None:
        user.sueldo_mensual = datos.sueldo_mensual
    if datos.dia_de_pago is not None:
        user.dia_de_pago = datos.dia_de_pago
    if datos.fecha_contratacion is not None:
        user.fecha_contratacion = datos.fecha_contratacion

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{id}", response_model=UsuarioResponse)
async def eliminar_usuario(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.id_usuario == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    await db.delete(user)
    await db.commit()
    return user