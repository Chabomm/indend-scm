
from typing import Optional, List
from pydantic import BaseModel, Field

# Outbound 유저 정보 ()
class TokenDataOutbound(BaseModel):
    token_name: Optional[str] = Field("")
    user_uid: Optional[int] = Field(0)
    user_id: Optional[str] = Field("")
    user_name: Optional[str] = Field("")
    sosok_uid: Optional[int] = Field(0)
    sosok_id: Optional[str] = Field("")
    access_token: Optional[str] = Field("")

def getTokenDataOutbound(user) :
    return TokenDataOutbound (
         token_name = user.token_name
        ,user_uid = user.user_uid
        ,user_id = user.user_id
        ,user_name = user.user_name
        ,sosok_uid = user.sosok_uid
        ,sosok_id = user.sosok_id
        ,access_token = user.access_token
    )


# B2B/Seller Center 유저 정보
class TokenDataCenter(BaseModel):
    token_name: Optional[str] = Field("")
    seller_uid: Optional[int] = Field(0)
    seller_id: Optional[str] = Field("")
    seller_name: Optional[str] = Field("")
    staff_uid: Optional[int] = Field(0)
    staff_id: Optional[str] = Field("")
    staff_name: Optional[str] = Field("")
    staff_depart: Optional[str] = Field("")
    roles: Optional[List[int]] = Field([], title="담당업무 (상품,발주,CS,정산)")
    access_token: Optional[str] = Field("")

def getTokenDataCenter(user) :
    return TokenDataCenter (
         token_name = user["token_name"]
        ,seller_uid = user["seller_uid"]
        ,seller_id = user["seller_id"]
        ,seller_name = user["seller_name"]
        ,staff_uid = user["staff_uid"]
        ,staff_id = user["staff_id"]
        ,staff_name = user["staff_name"]
        ,staff_depart = user["staff_depart"]
        ,roles = user["roles"]
        ,access_token = user["access_token"]
    )