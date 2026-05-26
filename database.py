import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:root@127.0.0.1:3310/ioct_cultural_db"
)

for i in range(10):
    try:
        engine = create_engine(DATABASE_URL)
        engine.connect()
        print("Database connesso!")
        break
    except Exception as e:
        print(f"Tentativo {i+1}/10 - DB non pronto: {e}")
        time.sleep(3)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()