from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# ── Configuración de base de datos (MySQL) ──────────────────────────────────
# Lee DATABASE_URL desde .env o variable de entorno.

# Soporte básico para .env sin dependencias extras
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ[key.strip()] = val.strip()

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    # Fallback por defecto — ajustá usuario/contraseña/nombre de DB
    DATABASE_URL = "mysql+aiomysql://root:@localhost/gym_manager"
    print("[DB] Usando MySQL local por defecto:", DATABASE_URL)
else:
    print("[DB] Usando base de datos configurada en .env")

engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
