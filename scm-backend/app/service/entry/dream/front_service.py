from fastapi import Request
from sqlalchemy import func, select, update, delete, Table, MetaData
from sqlalchemy.dialects import mysql as mysql_dialetct
from inspect import currentframe as frame

from app.core import exceptions as ex
from app.core import util
from app.core.database import format_sql
from app.models.partner import *
from app.models.entry.dream import *
from app.models.session import *
from app.schemas.schema import *
from app.schemas.dream import *
from app.service.log_service import *

import datetime

# [ S ] 상담

# 파트너 상담신청 create
def counsel_create(request: Request, dreamCounsel: DreamCounsel) :
    request.state.inspect = frame()
    db = request.state.db 

    db_item = T_DREAM_COUNSEL (
         company_name = dreamCounsel.company_name
        ,homepage_url = dreamCounsel.homepage_url
        ,staff_count = dreamCounsel.staff_count
        ,wish_build_at = dreamCounsel.wish_build_at
        ,staff_name = dreamCounsel.staff_name
        ,staff_dept = dreamCounsel.staff_dept
        ,staff_position = dreamCounsel.staff_position
        ,staff_position2 = dreamCounsel.staff_position2
        ,staff_mobile = dreamCounsel.staff_mobile
        ,staff_email = dreamCounsel.staff_email
        ,contents = dreamCounsel.contents
    )
    db.add(db_item)
    db.flush()

    create_log(request, db_item.uid, "T_DREAM_COUNSEL", "INSERT", "파트너 구축상담 등록", 0, db_item.uid, request.state.user_ip)
    request.state.inspect = frame()

    return db_item

# 파트너 상담신청 상세보기
def consel_read(request: Request, uid: int):
    request.state.inspect = frame()
    db = request.state.db

    sql = ( 
        db.query(
             T_DREAM_COUNSEL.uid
            ,T_DREAM_COUNSEL.company_name
            ,T_DREAM_COUNSEL.homepage_url
            ,T_DREAM_COUNSEL.staff_count
            ,T_DREAM_COUNSEL.wish_build_at
            ,T_DREAM_COUNSEL.staff_name
            ,T_DREAM_COUNSEL.staff_dept
            ,T_DREAM_COUNSEL.staff_position
            ,T_DREAM_COUNSEL.staff_position2
            ,T_DREAM_COUNSEL.staff_mobile
            ,T_DREAM_COUNSEL.staff_email
            ,T_DREAM_COUNSEL.contents
            ,T_DREAM_COUNSEL.state
            ,T_DREAM_COUNSEL.create_at
            ,T_DREAM_COUNSEL.update_at
        )
        .filter(
            T_DREAM_COUNSEL.uid == uid
            ,T_DREAM_COUNSEL.delete_at == None
        )
    )
    format_sql(sql)
    return sql.first()

# [ E ] 상담








# [ S ] 인증

# 상담신청 담당자 select 구축신청_인증번호_발송
def build_auth_read(request: Request, authNum: AuthNum):
    request.state.inspect = frame()
    db = request.state.db 

    filters = []
    # filters.append(T_MEMBER.login_id == authNum.login_id)
    
    if authNum.send_type == 'email' :
        filters.append(T_DREAM_COUNSEL.staff_email == authNum.value)

    if authNum.send_type == 'mobile' :
        filters.append(T_DREAM_COUNSEL.staff_mobile == authNum.value)
        
    sql = (
        db.query(
             T_DREAM_COUNSEL.uid
            ,T_DREAM_COUNSEL.company_name
            ,T_DREAM_COUNSEL.homepage_url
            ,T_DREAM_COUNSEL.staff_count
            ,T_DREAM_COUNSEL.wish_build_at
            ,T_DREAM_COUNSEL.staff_name
            ,T_DREAM_COUNSEL.staff_dept
            ,T_DREAM_COUNSEL.staff_position
            ,T_DREAM_COUNSEL.staff_position2
            ,T_DREAM_COUNSEL.staff_mobile
            ,T_DREAM_COUNSEL.staff_email
            ,T_DREAM_COUNSEL.contents
            ,T_DREAM_COUNSEL.state
        )
        .filter(*filters)
    ).first()

    return sql

# app 핸드폰번호, 이메일 인증번호 insert
def auth_num_create(request: Request, random_num:int, authNum :AuthNum):
    request.state.inspect = frame()
    db = request.state.db 

    current = datetime.datetime.now()
    five_minutes_later = current + datetime.timedelta(minutes=5)

    db_item = T_AUTH_CONFIRM (
         send_type = authNum.send_type
        ,value = authNum.value
        ,auth_num = random_num
        ,try_count = 0
        ,expiry_at = five_minutes_later
    )
    db.add(db_item)
    db.flush()

    return db_item

# 인증번호 확인
def auth_num_vaild(request: Request, authNumInput: AuthNumInput):
    request.state.inspect = frame()
    db = request.state.db 

    res = (
        db.query(T_AUTH_CONFIRM)
        .filter(
             T_AUTH_CONFIRM.uid == authNumInput.uid
        )
    ).first()

    result = {} 
    result["code"] = 200
    result["msg"] = ""


    # 매칭되는 uid로 일단은 무조건 데이터 가져와서
    # 1. 제한시간체크 3분 
    if res.expiry_at <= datetime.datetime.now() :
        result["code"] = 500
        result["msg"] = "제한 시간(5분)을 초과했습니다. 다시 시도하여 주십시오."
    
    # 2. try_count 회수체크 3회
    elif res.try_count >= 3 :
        result["code"] = 500
        result["msg"] = "제한 횟수(3회)를 초과했습니다. 다시 시도하여 주십시오."

    # 3. db auth_num 이랑 input auth_num 비교
    elif res.auth_num != authNumInput.auth_num :
        result["code"] = 300
        result["msg"] = "인증번호가 불일치 합니다. 인증번호를 다시 입력해 주세요."

    if result["code"] != 200 :
        res.try_count = res.try_count + 1

    return result

# 인증번호 확인(조건: uid, auth_num)
def build_num_vaild(request: Request, uid: int, auth_num: str):
    request.state.inspect = frame()
    db = request.state.db 

    res = (
        db.query(T_AUTH_CONFIRM)
        .filter(
             T_AUTH_CONFIRM.uid == uid,
             T_AUTH_CONFIRM.auth_num == auth_num
        )
    )

    format_sql(res)
    return res.first()

# [ E ] 인증








# [ S ] 구축

# # 구축신청 - 등록
# def build_create(request: Request, dreamBuild: DreamBuild):
#     request.state.inspect = frame()
#     db = request.state.db 
#     user = request.state.user

#     db_item = T_DREAM_BUILD (
#          company_name = dreamBuild.company_name
#         ,ceo_name = dreamBuild.ceo_name
#         ,staff_name = dreamBuild.staff_name
#         ,staff_dept = dreamBuild.staff_dept
#         ,staff_position = dreamBuild.staff_position
#         ,staff_position2 = dreamBuild.staff_position2
#         ,staff_mobile = dreamBuild.staff_mobile
#         ,staff_email = dreamBuild.staff_email
#         ,account_email = dreamBuild.account_email
#         ,post = dreamBuild.post
#         ,addr = dreamBuild.addr
#         ,addr_detail = dreamBuild.addr_detail
#         ,company_hp = dreamBuild.company_hp
#         ,biz_kind = dreamBuild.biz_kind
#         ,biz_item = dreamBuild.biz_item
#         ,biz_no = dreamBuild.biz_no
#         ,biz_service = dreamBuild.biz_service
#         ,mall_name = dreamBuild.mall_name
#         ,host = dreamBuild.host
#         ,file_biz_no = dreamBuild.file_biz_no
#         ,file_bank = dreamBuild.file_bank
#         ,file_logo = dreamBuild.file_logo
#         ,file_mall_logo = dreamBuild.file_mall_logo
#         ,state = "100"
#         ,counsel_uid = dreamBuild.counsel_uid
#     )
#     db.add(db_item)
#     db.flush()

#     create_log(request, db_item.uid, "T_DREAM_BUILD", "INSERT", "파트너 구축 등록", 0, db_item.uid, request.state.user_ip)
#     request.state.inspect = frame()

#     # [ S ] T_DREAM_COUNSEL state 변경
#     res = db.query(T_DREAM_COUNSEL).filter(T_DREAM_COUNSEL.uid == dreamBuild.counsel_uid).first()

#     if res.state != "502":
#         create_log(request, res.uid, "T_DREAM_COUNSEL", "state", "진행상태", res.state, "502", request.state.user_ip)
#         request.state.inspect = frame()
#         res.state = "502"

#     res.update_at = util.getNow()

#     if res is None :
#         raise ex.NotFoundUser
#     # [ E ] T_DREAM_COUNSEL state 변경

#     return db_item

# 구축신청 - 수정
################################################################## logo 등 데이터 다 업데이트
def build_update(request: Request, dreamBuild: DreamBuild):
    request.state.inspect = frame()
    db = request.state.db 

    res = db.query(T_DREAM_BUILD).filter(T_DREAM_BUILD.counsel_uid == dreamBuild.counsel_uid).first()

    # format_sql(res)
    if res is None :
        raise ex.NotFoundUser

    if dreamBuild.company_name is not None and res.company_name != dreamBuild.company_name : 
        create_log(request, res.uid, "T_DREAM_BUILD", "company_name", "기업명 수정", res.company_name, dreamBuild.company_name, request.state.user_ip)
        request.state.inspect = frame()
        res.company_name = dreamBuild.company_name

    if dreamBuild.staff_name is not None and res.staff_name != dreamBuild.staff_name : 
        create_log(request, res.uid, "T_DREAM_BUILD", "staff_name", "담당자명 수정", res.staff_name, dreamBuild.staff_name, request.state.user_ip)
        request.state.inspect = frame()
        res.staff_name = dreamBuild.staff_name

    if dreamBuild.staff_dept is not None and res.staff_dept != dreamBuild.staff_dept : 
        create_log(request, res.uid, "T_DREAM_BUILD", "staff_dept", "담당자 부서 수정", res.staff_dept, dreamBuild.staff_dept, request.state.user_ip)
        request.state.inspect = frame()
        res.staff_dept = dreamBuild.staff_dept

    if dreamBuild.staff_position is not None and res.staff_position != dreamBuild.staff_position : 
        create_log(request, res.uid, "T_DREAM_BUILD", "staff_position", "담당자 직급 수정", res.staff_position, dreamBuild.staff_position, request.state.user_ip)
        request.state.inspect = frame()
        res.staff_position = dreamBuild.staff_position

    if dreamBuild.staff_position2 is not None and res.staff_position2 != dreamBuild.staff_position2 : 
        create_log(request, res.uid, "T_DREAM_BUILD", "staff_position2", "담당자 직책 수정", res.staff_position2, dreamBuild.staff_position2, request.state.user_ip)
        request.state.inspect = frame()
        res.staff_position2 = dreamBuild.staff_position2

    if dreamBuild.staff_mobile is not None and res.staff_mobile != dreamBuild.staff_mobile : 
        create_log(request, res.uid, "T_DREAM_BUILD", "staff_mobile", "담당자 연락처 수정", res.staff_mobile, dreamBuild.staff_mobile, request.state.user_ip)
        request.state.inspect = frame()
        res.staff_mobile = dreamBuild.staff_mobile

    if dreamBuild.staff_email is not None and res.staff_email != dreamBuild.staff_email : 
        create_log(request, res.uid, "T_DREAM_BUILD", "staff_email", "담당자 이메일 수정", res.staff_email, dreamBuild.staff_email, request.state.user_ip)
        request.state.inspect = frame()
        res.staff_email = dreamBuild.staff_email

    if dreamBuild.ceo_name is not None and res.ceo_name != dreamBuild.ceo_name : 
        create_log(request, res.uid, "T_DREAM_BUILD", "ceo_name", "대표자 성함", res.ceo_name, dreamBuild.ceo_name, request.state.user_ip)
        request.state.inspect = frame()
        res.ceo_name = dreamBuild.ceo_name

    if dreamBuild.account_email is not None and res.account_email != dreamBuild.account_email : 
        create_log(request, res.uid, "T_DREAM_BUILD", "account_email", "정산메일", res.account_email, dreamBuild.account_email, request.state.user_ip)
        request.state.inspect = frame()
        res.account_email = dreamBuild.account_email

    if dreamBuild.post is not None and res.post != dreamBuild.post : 
        create_log(request, res.uid, "T_DREAM_BUILD", "post", "우편번호", res.post, dreamBuild.post, request.state.user_ip)
        request.state.inspect = frame()
        res.post = dreamBuild.post

    if dreamBuild.addr is not None and res.addr != dreamBuild.addr : 
        create_log(request, res.uid, "T_DREAM_BUILD", "addr", "주소", res.addr, dreamBuild.addr, request.state.user_ip)
        request.state.inspect = frame()
        res.addr = dreamBuild.addr

    if dreamBuild.addr_detail is not None and res.addr_detail != dreamBuild.addr_detail : 
        create_log(request, res.uid, "T_DREAM_BUILD", "addr_detail", "주소상세", res.addr_detail, dreamBuild.addr_detail, request.state.user_ip)
        request.state.inspect = frame()
        res.addr_detail = dreamBuild.addr_detail

    if dreamBuild.company_hp is not None and res.company_hp != dreamBuild.company_hp : 
        create_log(request, res.uid, "T_DREAM_BUILD", "company_hp", "대표번호", res.company_hp, dreamBuild.company_hp, request.state.user_ip)
        request.state.inspect = frame()
        res.company_hp = dreamBuild.company_hp

    if dreamBuild.biz_kind is not None and res.biz_kind != dreamBuild.biz_kind : 
        create_log(request, res.uid, "T_DREAM_BUILD", "biz_kind", "사업자 분류", res.biz_kind, dreamBuild.biz_kind, request.state.user_ip)
        request.state.inspect = frame()
        res.biz_kind = dreamBuild.biz_kind

    if dreamBuild.biz_item is not None and res.biz_item != dreamBuild.biz_item : 
        create_log(request, res.uid, "T_DREAM_BUILD", "biz_item", "업종", res.biz_item, dreamBuild.biz_item, request.state.user_ip)
        request.state.inspect = frame()
        res.biz_item = dreamBuild.biz_item

    if dreamBuild.biz_no is not None and res.biz_no != dreamBuild.biz_no : 
        create_log(request, res.uid, "T_DREAM_BUILD", "biz_no", "사업자등록번호", res.biz_no, dreamBuild.biz_no, request.state.user_ip)
        request.state.inspect = frame()
        res.biz_no = dreamBuild.biz_no

    if dreamBuild.mall_name is not None and res.mall_name != dreamBuild.mall_name : 
        create_log(request, res.uid, "T_DREAM_BUILD", "mall_name", "복지몰명", res.mall_name, dreamBuild.mall_name, request.state.user_ip)
        request.state.inspect = frame()
        res.mall_name = dreamBuild.mall_name

    if dreamBuild.mall_name is not None and res.mall_name != dreamBuild.mall_name : 
        create_log(request, res.uid, "T_DREAM_BUILD", "mall_name", "복지몰명", res.mall_name, dreamBuild.mall_name, request.state.user_ip)
        request.state.inspect = frame()
        res.mall_name = dreamBuild.mall_name

    if dreamBuild.host is not None and res.host != dreamBuild.host : 
        create_log(request, res.uid, "T_DREAM_BUILD", "host", "도메인 및 대표관리자 아이디", res.host, dreamBuild.host, request.state.user_ip)
        request.state.inspect = frame()
        res.host = dreamBuild.host

    if dreamBuild.file_biz_no is not None and res.file_biz_no != dreamBuild.file_biz_no : 
        create_log(request, res.uid, "T_DREAM_BUILD", "file_biz_no", "사업자등록증", res.file_biz_no, dreamBuild.file_biz_no, request.state.user_ip)
        request.state.inspect = frame()
        res.file_biz_no = dreamBuild.file_biz_no

    if dreamBuild.file_bank is not None and res.file_bank != dreamBuild.file_bank : 
        create_log(request, res.uid, "T_DREAM_BUILD", "file_bank", "통장사본", res.file_bank, dreamBuild.file_bank, request.state.user_ip)
        request.state.inspect = frame()
        res.file_bank = dreamBuild.file_bank

    if dreamBuild.file_logo is not None and res.file_logo != dreamBuild.file_logo : 
        create_log(request, res.uid, "T_DREAM_BUILD", "file_logo", "회사로고", res.file_logo, dreamBuild.file_logo, request.state.user_ip)
        request.state.inspect = frame()
        res.file_logo = dreamBuild.file_logo

    if dreamBuild.file_mall_logo is not None and res.file_mall_logo != dreamBuild.file_mall_logo : 
        create_log(request, res.uid, "T_DREAM_BUILD", "file_mall_logo", "복지몰로고", res.file_mall_logo, dreamBuild.file_mall_logo, request.state.user_ip)
        request.state.inspect = frame()
        res.file_mall_logo = dreamBuild.file_mall_logo
    
    create_log(request, res.uid, "T_DREAM_BUILD", "state", "판매자 구축신청 상태변경", res.state, dreamBuild.state, request.state.user_ip)
    request.state.inspect = frame()
    res.state = "110"

    res.update_at = util.getNow()

    return res

# 구축 정보 UID SELECT(이미 있는지) 
def build_read_uid(request: Request, uid: int):
    request.state.inspect = frame()
    db = request.state.db

    sql = ( 
        db.query(
             T_DREAM_BUILD.uid
        )
        .filter(
            T_DREAM_BUILD.counsel_uid == uid
            ,T_DREAM_BUILD.delete_at == None
            ,T_DREAM_BUILD.state != "320"
        )
    )
    format_sql(sql)
    return sql.first()

# 구축정보 상세보기
def build_read(request: Request, uid: int):
    request.state.inspect = frame()
    db = request.state.db

    sql = ( 
        db.query(
             T_DREAM_BUILD.uid
            ,T_DREAM_BUILD.company_name
            ,T_DREAM_BUILD.ceo_name
            ,T_DREAM_BUILD.staff_name
            ,T_DREAM_BUILD.staff_dept
            ,T_DREAM_BUILD.staff_position
            ,T_DREAM_BUILD.staff_position2
            ,T_DREAM_BUILD.staff_mobile
            ,T_DREAM_BUILD.staff_email
            ,T_DREAM_BUILD.account_email
            ,T_DREAM_BUILD.post
            ,T_DREAM_BUILD.addr
            ,T_DREAM_BUILD.addr_detail
            ,T_DREAM_BUILD.company_hp
            ,T_DREAM_BUILD.biz_kind
            ,T_DREAM_BUILD.biz_item
            ,T_DREAM_BUILD.biz_no
            ,T_DREAM_BUILD.biz_service
            ,T_DREAM_BUILD.mall_name
            ,T_DREAM_BUILD.host
            ,T_DREAM_BUILD.file_biz_no
            ,T_DREAM_BUILD.file_bank
            ,T_DREAM_BUILD.file_logo
            ,T_DREAM_BUILD.file_mall_logo
            ,T_DREAM_BUILD.state
            ,T_DREAM_BUILD.counsel_uid
            ,func.date_format(T_DREAM_BUILD.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_DREAM_BUILD.update_at, '%Y-%m-%d %T').label('update_at')
        )
        .filter(
            T_DREAM_BUILD.counsel_uid == uid
            ,T_DREAM_BUILD.delete_at == None
            ,T_DREAM_BUILD.state != "320"
        )
    )
    format_sql(sql)
    return sql.first()

def com_item_list(request: Request) :
    return [
        {
            "sub_code": "A",
            "sub_code_name" : "농업, 임업 및 어업(01~03)"
        },
        {
            "sub_code": "B",
            "sub_code_name" : "광업(05~08)"
        },
        {
            "sub_code": "C",
            "sub_code_name" : "제조업(10~34)"
        },
        {
            "sub_code": "D",
            "sub_code_name" : "전기, 가스, 증기 및 공기 조절 "
        },
        {
            "sub_code": "E",
            "sub_code_name" : "수도, 하수 및 폐기물 처리, 원"
        },
        {
            "sub_code": "F",
            "sub_code_name" : "건설업(41~42)"
        },
        {
            "sub_code": "G",
            "sub_code_name" : "도매 및 소매업(45~47)"
        },
        {
            "sub_code": "H",
            "sub_code_name" : "운수 및 창고업(49~52)"
        },
        {
            "sub_code": "I",
            "sub_code_name" : "숙박 및 음식점업(55~56)"
        },
        {
            "sub_code": "J",
            "sub_code_name" : "정보통신업(58~63)"
        },
        {
            "sub_code": "K",
            "sub_code_name" : "금융 및 보험업(64~66)"
        },
        {
            "sub_code": "L",
            "sub_code_name" : "부동산업(68)"
        },
        {
            "sub_code": "M",
            "sub_code_name" : "전문, 과학 및 기술 서비스업(70)"
        },
        {
            "sub_code": "N",
            "sub_code_name" : "사업시설 관리, 사업 지원 및 임대 서비스업(74~76)"
        },
        {
            "sub_code": "O",
            "sub_code_name" : "공공 행정, 국방 및 사회보장 행정(84)"
        },
        {
            "sub_code": "P",
            "sub_code_name" : "교육 서비스업(85)"
        },
        {
            "sub_code": "Q",
            "sub_code_name" : "보건업 및 사회복지 서비스업(86~87)"
        },
        {
            "sub_code": "R",
            "sub_code_name" : "예술, 스포츠 및 여가관련 서비스업(90~91)"
        },
        {
            "sub_code": "S",
            "sub_code_name" : "협회 및 단체, 수리 및 기타 개인 서비스업(94~96)"
        },
        {
            "sub_code": "T",
            "sub_code_name" : "가구 내 고용활동 및 달리 분류되지 않은 자가 소비 생산활동(97~98)"
        },
    ]


# [ S ] 구축

