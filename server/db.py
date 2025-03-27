"""Handles database connections for the server app."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

from dotenv import load_dotenv
import os

load_dotenv()


ENVIRONMENT = os.getenv("ENVIRONMENT", "development")


if ENVIRONMENT == "production":
    DATABASE_URL = os.getenv("INTERNAL_DATABASE_URL")  
else:
    DATABASE_URL = os.getenv("EXTERNAL_DATABASE_URL")  

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)