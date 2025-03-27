"""ORM data models."""
from sqlalchemy import (
    Column, Integer, String, Numeric, Date, ForeignKey, Float
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Pool(Base):
    __tablename__ = "pools"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pool_name = Column(String, unique=True, nullable=False)

    loans = relationship("Loan", back_populates="pool")

    def __repr__(self):
        return f"<Pool(id={self.id}, pool_name='{self.pool_name}')>"


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True)  
    pool_id = Column(Integer, ForeignKey("pools.id"), nullable=False)
    loan_date = Column(Date, nullable=False)
    original_principal = Column(Numeric(12, 2), nullable=False)
    interest_rate = Column(Float, nullable=False)  # e.g., 0.0450 = 4.50%
    payment = Column(Numeric(12, 2), nullable=False)
    current_principal = Column(Numeric(12, 2), nullable=False)
    borrower_first_name = Column(String, nullable=False)
    borrower_last_name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip = Column(String, nullable=False)
    property_value = Column(Numeric(12, 2), nullable=False)

    pool = relationship("Pool", back_populates="loans")

    def __repr__(self):
        return f"<Loan(id={self.id}, pool_id={self.pool_id})>"
