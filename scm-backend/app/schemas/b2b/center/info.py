
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.schema import *

class MyInfo(BaseModel):
    name: Optional[str] = Field(None, title="")
    login_id: Optional[str] = Field(None, title="")
    login_pw: Optional[str] = Field(None, title="")
    depart: Optional[str] = Field(None, title="")
    position: Optional[str] = Field(None, title="")
    tel: Optional[str] = Field(None, title="")
    mobile: Optional[str] = Field(None, title="")
    alarm_kakao: Optional[str] = Field(None, title="")
    email: Optional[str] = Field(None, title="")
    alarm_email: Optional[str] = Field(None, title="")
    class Config:
        orm_mode = True


class StaffInfoInput(BaseModel):
    uid : int = Field(0, title="T_B2B_SELLER_STAFF.uid")
    name: Optional[str] = Field(None, title="")
    login_pw: Optional[str] = Field(None, title="")
    depart: Optional[str] = Field(None, title="")
    position: Optional[str] = Field(None, title="")
    tel: Optional[str] = Field(None, title="")
    mobile: Optional[str] = Field(None, title="")
    alarm_kakao: Optional[str] = Field(None, title="")
    email: Optional[str] = Field(None, title="")
    alarm_email: Optional[str] = Field(None, title="")
    class Config:
        orm_mode = True

