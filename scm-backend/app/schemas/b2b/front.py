from typing import List, Dict, Any, Union, Optional
from datetime import date, datetime, time, timedelta

from app.schemas.schema import *

class GoodsListType(PPage_param):
    svc_type: Optional[str] = Field(None, title="서비스타입")
    class Config:
        orm_mode = True


class OrderInput(BaseModel):
    guid: Optional[int] = Field(0, title="T_B2B_GOODS.uid")
    class Config:
        orm_mode = True


class managerInput(BaseModel):
    uid:Optional[str] = Field("",title='uid')
    partner_uid:Optional[str] = Field("",title='T_PARTNER.uid')
    partner_id:Optional[str] = Field("",title='partner_id')
    prefix:Optional[str] = Field("",title='prefix')
    login_id:Optional[str] = Field("",title='login_id')
    login_pw:Optional[str] = Field("",title='login_pw')
    user_id:Optional[str] = Field("",title='user_id')
    name:Optional[str] = Field("",title='name')
    tel:Optional[str] = Field("",title='tel')
    mobile:Optional[str] = Field("",title='mobile')
    email:Optional[str] = Field("",title='email')
    role:Optional[str] = Field("",title='role')
    position1:Optional[str] = Field("",title='position1')
    position2:Optional[str] = Field("",title='position2')
    depart:Optional[str] = Field("",title='depart')
    roles:Optional[str] = Field("",title='roles')
    state:Optional[str] = Field("",title='state')
    class Config:
        orm_mode = True

class partnerInput(BaseModel):
    uid:Optional[str] = Field("",title='uid')
    partner_type:Optional[str] = Field("",title='partner_uid')
    partner_id:Optional[str] = Field("",title='partner_id')
    mall_name:Optional[str] = Field("",title='prefix')
    company_name:Optional[str] = Field("",title='login_id')
    sponsor:Optional[str] = Field("",title='login_pw')
    partner_code:Optional[str] = Field("",title='user_id')
    prefix:Optional[str] = Field("",title='name')
    logo:Optional[str] = Field("",title='tel')
    is_welfare:Optional[str] = Field("",title='mobile')
    is_dream:Optional[str] = Field("",title='email')
    state:Optional[str] = Field("",title='role')
    mem_type:Optional[str] = Field("",title='position1')
    create_at:Optional[str] = Field("",title='position2')
    delete_at:Optional[str] = Field("",title='depart')
    update_at:Optional[str] = Field("",title='roles')
    class Config:
        orm_mode = True
        
class B2BOrderInfo(BaseModel):
    ouid: Optional[int] = Field(0, title="T_B2B_ORDER.uid")
    guid: Optional[int] = Field(0, title="T_B2B_GOODS.uid")
    option_num: Optional[int] = Field(0, title="항목번호")
    option_type: Optional[str] = Field("", title="추가항목타입 A:한글입력폼, B:문장입력폼, C:드롭박스, D:라디오버튼, E:날짜, F:파일업로드, G:고객안내형 설정사항")
    option_title: Optional[str] = Field("", title="항목명")
    option_yn: Optional[str] = Field("", title="필수유무")
    placeholder: Optional[str] = Field("", title="[E] single, range / [F] images, allfile")
    apply_value: Optional[Any] = Field("", title="신청값")
    file_name: Optional[str] = Field("", title="파일첨부인경우 파일명")
    class Config:
            orm_mode = True

class B2BOrderInput(BaseModel):
    guid: Optional[int] = Field(0, title="T_B2B_GOODS.uid")
    seller_id: Optional[str] = Field(None, title="판매자아이디")
    seller_name: Optional[str] = Field(None, title="판매자명")
    service_type: Optional[str] = Field(None, title="서비스 구분 C:고객사혜택, D:드림클럽")
    category: Optional[str] = Field(None, title="카테고리")
    title: Optional[str] = Field(None, title="상품명")
    state: Optional[str] = Field(None, title="상태")
    commission_type: Optional[str] = Field(None, title="복지드림 수수료 타입")
    commission: Optional[int] = Field(0, title="복지드림 수수료")
    token_name: Optional[str] = Field(None, title="신청타입(DREAM-MANAGER, SCM-SELLER)")
    sosok_uid: Optional[int] = Field(0, title="신청자 소속의 uid")
    sosok_id: Optional[str] = Field(None, title="신청자 소속의 아이디")
    apply_user_uid: Optional[int] = Field(0, title="신청자uid")
    apply_user_id: Optional[str] = Field(None, title="신청자아이디")
    apply_company: Optional[str] = Field(None, title="신청자회사명")
    apply_name: Optional[str] = Field(None, title="신청자명")
    apply_depart: Optional[str] = Field(None, title="신청자부서")
    apply_position: Optional[str] = Field(None, title="신청자직급")
    apply_phone: Optional[str] = Field(None, title="신청자연락처")
    apply_email: Optional[str] = Field(None, title="신청자이메일")
    create_at: Optional[str] = Field(None, title="등록일")
    delete_at: Optional[str] = Field(None, title="삭제일")
    update_at: Optional[str] = Field(None, title="수정일")
    option_list: Optional[List[B2BOrderInfo]] = Field([], title="신정정보")
    class Config:
            orm_mode = True

class GoodsReadInput(BaseModel):
    guid: int
    method: str
    company_name : Optional[str]
    depart : Optional[str]
    position1 : Optional[str]
    mobile: Optional[str]
    email : Optional[str]
    