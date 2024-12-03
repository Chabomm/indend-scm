
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.schema import *

class SignInRequest(BaseModel):
    login_id: str
    login_pw: str
    seller_id: str
    auto_save:str

class LogListInput(PPage_param):
    table_name: Optional[str] = Field(None, title="테이블명", max_length=100)
    table_uid: Optional[int] = Field(0, title="uid")
    class Config:
        orm_mode = True

class MemoInput(BaseModel):
    table_uid: int = Field(0, comment='table_uid')
    table_name: str = Field("", comment='table_name')
    memo: str = Field("")
    file_url: Optional[str] = Field(None, comment='file_url')
    file_name: Optional[str] = Field(None, comment='file_name')
    class Config:
        orm_mode = True