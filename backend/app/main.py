from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config.database import engine, Base
from app.models.usuario import Usuario

# Importar modelos para que SQLAlchemy los registre antes del create_all
from app.models import miembro, disciplina, instructor, membresia, usuario

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(
    title="GYM Manager",
    description="Sistema de gestión de miembros y membresías para gimnasio",
    version="1.0.0"
)

# Configuración CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handler global para que los errores 500 también lleven headers CORS
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        },
    )

# Seed del usuario root al iniciar (las tablas las crea el usuario en MySQL)
@app.on_event("startup")
async def startup_event():
    # Crear usuario root por defecto si no existe
    async with AsyncSession(engine) as session:
        result = await session.execute(
            select(Usuario).where(Usuario.username == "root")
        )
        root_user = result.scalar_one_or_none()

        if not root_user:
            nuevo_root = Usuario(
                username="root",
                password_hash=pwd_context.hash("root"),
                rol="root"
            )
            session.add(nuevo_root)
            await session.commit()
            print("[OK] Usuario root creado por defecto (user: root / pass: root)")
        else:
            print("[INFO] Usuario root ya existe, no se modifica.")

# Incluir routers
from app.routers import miembro as r_miembro
from app.routers import disciplina as r_disciplina
from app.routers import instructor as r_instructor
from app.routers import membresia as r_membresia

app.include_router(r_miembro.router)
app.include_router(r_disciplina.router)
app.include_router(r_instructor.router)
app.include_router(r_membresia.router)

@app.get("/")
async def root():
    return {"message": "Bienvenido a GYM Manager API"}
