"""Creates tabkles based on defined models."""
from db import engine
from models import Base

Base.metadata.create_all(engine)