from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

db_url="postgresql://susmithachowdary@localhost/fastapi_db"
engine=create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

