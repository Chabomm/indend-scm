from typing import List, Dict, Any, Union, Optional
from datetime import date, datetime, time, timedelta

from app.schemas.schema import *

class DreamCounsel(BaseModel):
    mode: Optional[str] = Field("", title="REG/MOD/DEL")
    uid: Optional[int] = Field(0, title="uid")
    company_name: Optional[str] = Field(None, title="기업명", max_length=100)
    homepage_url: Optional[str] = Field(None, title="홈페이지url", max_length=255)
    staff_count: Optional[int] = Field(None, title="직원수")
    wish_build_at: Optional[date] = Field(None, title="구축희망일")
    staff_name: Optional[str] = Field(None, title="담당자명", max_length=30)
    staff_dept: Optional[str] = Field(None, title="담당자 부서", max_length=30)
    staff_position: Optional[str] = Field(None, title="담당자 직급", max_length=30)
    staff_position2: Optional[str] = Field(None, title="담당자 직책", max_length=30)
    staff_mobile: Optional[str] = Field(None, title="담당자 핸드폰 번호", max_length=30)
    staff_email: Optional[str] = Field(None, title="담당자 이메일", max_length=255)
    contents: Optional[str] = Field(None, title="상담문의 & 요청내용")
    state: Optional[str] = Field(None, title="100:상담문의, 200:상담중, 300:도입보류, 501:도입대기, 502:도입신청완료", max_length=30)
    create_at: Optional[datetime] = Field(None, title="등록일")
    update_at: Optional[datetime] = Field(None, title="수정일")
    delete_at: Optional[datetime] = Field(None, title="삭제일")
    memo: Optional[str] = Field(None, title="상담로그")
    class Config:
        orm_mode = True

class ChkAdminIdSchema(BaseModel) :
    adminid_input_value : Optional[str] = Field(None, title="체크할 값")
    adminid_check_value : Optional[str] = Field(None, title="이전에 체크한 값")
    is_adminid_checked : Optional[bool] = Field(None, title="이전에 체크 했는지")

class AuthNum(BaseModel):
    send_type: str
    value: str
    # login_id: str

class AuthNumInput(BaseModel):
    uid: Optional[int] = Field(0)
    counsel_uid: Optional[int] = Field(0)
    auth_num: Optional[str] = Field("")
    email: Optional[str] = Field("")
    mobile: Optional[str] = Field("")
    login_id: Optional[str] = Field("")

class UrlToken(BaseModel):
    uid: Optional[int] = Field(0)
    auth_num: Optional[str] = Field("")


class DreamBuild(BaseModel):
    # mode: Optional[str] = Field("", title="REG/MOD/DEL")
    uid: Optional[int] = Field(0, title="uid")
    company_name: Optional[str] = Field(None, title="기업명", max_length=100)
    ceo_name: Optional[str] = Field(None, title="대표자 성함", max_length=100)
    staff_name: Optional[str] = Field(None, title="담당자명", max_length=30)
    staff_dept: Optional[str] = Field(None, title="담당자 부서", max_length=30)
    staff_position: Optional[str] = Field(None, title="담당자 직급", max_length=30)
    staff_position2: Optional[str] = Field(None, title="담당자 직책", max_length=30)
    staff_mobile: Optional[str] = Field(None, title="담당자 연락처", max_length=30)
    staff_email: Optional[str] = Field(None, title="담당자 이메일", max_length=255)
    account_email: Optional[str] = Field(None, title="정산메일", max_length=255)
    post: Optional[str] = Field(None, title="우편번호", max_length=10)
    addr: Optional[str] = Field(None, title="주소", max_length=100)
    addr_detail: Optional[str] = Field(None, title="주소상세", max_length=100)
    company_hp: Optional[str] = Field(None, title="대표번호", max_length=20)
    biz_kind: Optional[str] = Field(None, title="분류", max_length=20)
    biz_item: Optional[str] = Field(None, title="업종", max_length=20)
    biz_no: Optional[str] = Field(None, title="사업자등록번호", max_length=20)
    biz_service: Optional[str] = Field(None, title="서비스 분류", max_length=20)
    mall_name: Optional[str] = Field(None, title="복지몰명", max_length=50)
    host: Optional[str] = Field(None, title="도메인 및 대표관리자아이디", max_length=50)
    file_biz_no: Optional[str] = Field(None, title="사업자등록증", max_length=255)
    file_bank: Optional[str] = Field(None, title="통장사본", max_length=255)
    file_logo: Optional[str] = Field(None, title="회사로고", max_length=255)
    file_mall_logo: Optional[str] = Field(None, title="복지몰로고", max_length=255)
    state: Optional[str] = Field(None, title="상태(100: 도입신청, 110: 구축신청, 200: 구축완료)", max_length=10)
    counsel_uid: Optional[int] = Field(0, title="T_DREAM_COUNSEL uid")
    create_at: Optional[datetime] = Field(None, title="등록일")
    update_at: Optional[datetime] = Field(None, title="수정일")
    delete_at: Optional[datetime] = Field(None, title="삭제일")
    is_terms : Optional[bool] = Field(False, title="약관동의체크")
    class Config:
        orm_mode = True