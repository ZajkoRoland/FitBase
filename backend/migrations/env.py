from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.config import get_settings
from app.db import Base

# Modellek beimportálása, hogy a táblák rákerüljenek a Base.metadata-ra
import app.models  # noqa: F401
import app.models_catalog  # noqa: F401

config = context.config

# Az adatbázis URL-t a backend/.env fájlból olvassuk be, nem az alembic.ini-ből
# A % jeleket megduplázzuk a ConfigParser interpoláció miatt
config.set_main_option("sqlalchemy.url", get_settings().database_url.replace("%", "%%"))

# Naplózás inicializálása a konfigurációból
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    # Offline futtatás (csak SQL szkript generálása élő kapcsolat nélkül)
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Online futtatás (közvetlen kapcsolat a PostgreSQL adatbázissal)
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
