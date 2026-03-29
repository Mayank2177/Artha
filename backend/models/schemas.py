from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    city: Optional[str] = None
    age: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    city: Optional[str] = None
    age: Optional[int] = None

    class Config:
        orm_mode = True
