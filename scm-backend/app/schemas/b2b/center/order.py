from typing import List, Dict, Any, Union, Optional
from datetime import date, datetime, time, timedelta

from app.schemas.schema import *

class OrderConsultInput(BaseModel):
    uid : int = Field("T_B2B_ORDER.uid")
    guid: Optional[int] = Field(0, title="T_B2B_GOODS.uid")
    seller_id: Optional[str] = Field(None, title="판매자아이디")
    state: Optional[str] = Field(None, title="상태")
    class Config:
        orm_mode = True

class OrderConsultMemo(BaseModel):
    table_uid: int = Field("", comment='T_B2B_ORDER.uid')
    memo: str = Field("")
    file_url: Optional[str] = Field("")
    file_name: Optional[str] = Field("")
    class Config:
        orm_mode = True

class OrderContractInput(BaseModel):
    ouid : int = Field(0,title="T_B2B_ORDER.uid")
    guid: Optional[int] = Field(0, title="T_B2B_GOODS.uid")
    seller_id: Optional[str] = Field(None, title="판매자아이디")
    cont_state: Optional[str] = Field(None, title="계약상태")
    apply_company: Optional[str] = Field(None, title="신청자회사명")
    apply_depart: Optional[str] = Field(None, title="신청자부서")
    apply_email: Optional[str] = Field(None, title="신청자이메일")
    apply_name: Optional[str] = Field(None, title="신청자명")
    apply_phone: Optional[str] = Field(None, title="신청자연락처")
    apply_position: Optional[str] = Field(None, title="신청자직급")
    category: Optional[str] = Field(None, title="카테고리")
    commission_type: Optional[str] = Field(None, title="복지드림 수수료 타입")
    commission: Optional[int] = Field(0, title="복지드림 수수료")
    cont_staff_depart: Optional[str] = Field(None, title="계약담당자부서")
    cont_staff_email: str = Field(None, title="계약담당자이메일")
    cont_staff_name: str = Field(None, title="계약담당자명")
    cont_staff_phone: str = Field(None, title="계약담당자연락처")
    cont_staff_position: Optional[str] = Field(None, title="계약담당자직급")
    title: Optional[str] = Field(None, title="상품명")
    start_date: Optional[str] = Field(None, title="시작일")
    end_date: Optional[str] = Field(None, title="종료일")
    service_at: Optional[object] = Field(None, title="서비스filter")
    contract_at: Optional[object] = Field(None, title="계약일filter")
    create_user: Optional[str] = Field(None, title="등록자")
    contract_price: Optional[int] = Field(0, title="계약금액")
    contract_date: Optional[str] = Field(None, title="계약일")
    contract_code: Optional[str] = Field(None, title="계약코드")
    class Config:
        orm_mode = True

class CancleInput(BaseModel):
    ouid : int = Field(0, title="T_B2B_ORDER.uid")
    guid: Optional[int] = Field(0, title="T_B2B_GOODS.uid")
    total_commission:Optional[int] = Field(0, title="총금액")
    account_date:Optional[str] = Field(None, title="정산일")
    cancel_price: Optional[int] = Field(0, title="취소금액")
    cancel_reason: Optional[str] = Field(None, title="취소이유")
    cancel_state: Optional[str] = Field(None, title="취소상태")
    cancel_file_name: Optional[str] = Field(None, title="파일명")
    cancel_file_url: Optional[str] = Field(None, title="파일주소")
    cancel_tax: Optional[str] = Field(None, title="면세/과세")
    class Config:
        orm_mode = True

