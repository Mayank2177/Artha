from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    city = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    money_health_results = relationship("MoneyHealthResult", back_populates="user")
    fire_plans = relationship("FirePlan", back_populates="user")
    tax_plans = relationship("TaxPlan", back_populates="user")
    portfolios = relationship("Portfolio", back_populates="user")


class MoneyHealthResult(Base):
    __tablename__ = "money_health_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="money_health_results")


class FirePlan(Base):
    __tablename__ = "fire_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    target_age = Column(Integer)
    monthly_sip_needed = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="fire_plans")


class TaxPlan(Base):
    __tablename__ = "tax_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    old_tax = Column(Float)
    new_tax = Column(Float)
    tax_saved = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tax_plans")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_value = Column(Float)
    xirr = Column(Float)
    fund_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="portfolios")
