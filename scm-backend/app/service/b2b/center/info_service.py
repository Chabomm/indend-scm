
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from inspect import currentframe as frame
from sqlalchemy.dialects import mysql as mysql_dialetct
from pymysql.converters import conversions, escape_item, encoders
from sqlalchemy import func, select, update, delete, Table, MetaData, and_
import math
import datetime
from dateutil.relativedelta import *

from app.core import exceptions as ex
from app.core import util
from app.deps import auth

from app.schemas.schema import *
from app.schemas.b2b.center.info import *
from app.models.b2b.seller import *
from app.service import log_service

from app.core.database import format_sql

# 계정 상세
def staff_read(request: Request):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    # where = ""
    # where = where + "WHERE delete_at is NULL "
    # where = where + "AND uid = "+user.staff_uid
    # where = where + "AND seller_id = '" + user.seller_id + "' "

    sql = """
        SELECT 
            uid
            ,seller_uid
            ,seller_id
            ,login_id
            ,login_pw
            ,name
            ,roles
            ,depart
            ,position
            ,tel
            ,mobile
            ,email
            ,sort
            ,alarm_email
            ,alarm_kakao
            ,state
            ,DATE_FORMAT(create_at, '%Y-%m-%d %T') as create_at
            ,(
                select GROUP_CONCAT(name SEPARATOR ', ') AS result  
                From T_B2B_SELLER_ROLE 
                where uid MEMBER OF(roles->>'$')
            ) as roles_txt
        FROM T_B2B_SELLER_STAFF
        WHERE delete_at is NULL
        AND uid = {uid}
        AND seller_id = '{seller_id}'
        ORDER BY uid DESC
    """.format(uid=user.staff_uid, seller_id = user.seller_id)

    res = db.execute(text(sql)).first()

    return res
    

# 상담내역_편집 - staff_info_update
def staff_update(request: Request, staffInfoInput : StaffInfoInput):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user
    
    res = db.query(T_B2B_SELLER_STAFF).filter(T_B2B_SELLER_STAFF.uid == staffInfoInput.uid).first()

    if res is None :
        return None
        
    if staffInfoInput.name is not None and res.name != staffInfoInput.name : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "name", "이름", res.name, staffInfoInput.name, user.staff_id)
        request.state.inspect = frame()
        res.name = staffInfoInput.name
        res.update_at = util.getNow()
    
    if staffInfoInput.login_pw is not None and staffInfoInput.login_pw != ''  : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "login_pw", "비밀번호", res.login_pw, staffInfoInput.login_pw, user.staff_id)
        request.state.inspect = frame()
        res.login_pw = auth.get_password_hash(staffInfoInput.login_pw)
        res.update_at = util.getNow()
        
    if staffInfoInput.depart is not None and res.depart != staffInfoInput.depart : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "depart", "부서", res.depart, staffInfoInput.depart, user.staff_id)
        request.state.inspect = frame()
        res.depart = staffInfoInput.depart
        res.update_at = util.getNow()
        
    if staffInfoInput.position is not None and res.position != staffInfoInput.position : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "position", "직급/직책", res.position, staffInfoInput.position, user.staff_id)
        request.state.inspect = frame()
        res.position = staffInfoInput.position
        res.update_at = util.getNow()
        
    if staffInfoInput.tel is not None and res.tel != staffInfoInput.tel : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "tel", "일반전화번호", res.tel, staffInfoInput.tel, user.staff_id)
        request.state.inspect = frame()
        res.tel = staffInfoInput.tel
        res.update_at = util.getNow()
        
    if staffInfoInput.mobile is not None and res.mobile != staffInfoInput.mobile : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "mobile", "핸드폰번호", res.mobile, staffInfoInput.mobile, user.staff_id)
        request.state.inspect = frame()
        res.mobile = staffInfoInput.mobile
        res.update_at = util.getNow()
        
    if staffInfoInput.alarm_kakao is not None and res.alarm_kakao != staffInfoInput.alarm_kakao : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "alarm_kakao", "카카오알림", res.alarm_kakao, staffInfoInput.alarm_kakao, user.staff_id)
        request.state.inspect = frame()
        res.alarm_kakao = staffInfoInput.alarm_kakao
        res.update_at = util.getNow()
        
    if staffInfoInput.email is not None and res.email != staffInfoInput.email : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "email", "이메일", res.email, staffInfoInput.email, user.staff_id)
        request.state.inspect = frame()
        res.email = staffInfoInput.email
        res.update_at = util.getNow()
        
    if staffInfoInput.alarm_email is not None and res.alarm_email != staffInfoInput.alarm_email : 
        log_service.create_log(request, res.uid, "T_B2B_SELLER_STAFF", "alarm_email", "이메일알림", res.alarm_email, staffInfoInput.alarm_email, user.staff_id)
        request.state.inspect = frame()
        res.alarm_email = staffInfoInput.alarm_email
        res.update_at = util.getNow()

    return res


# 계정 상세
def seller_read(request: Request):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_SELLER, "delete_at") == None)
    filters.append(getattr(T_B2B_SELLER, "uid") == user.seller_uid)
    filters.append(getattr(T_B2B_SELLER, "seller_id") == user.seller_id)

    sql = ( 
        db.query(
             T_B2B_SELLER.uid
            ,T_B2B_SELLER.seller_id
            ,T_B2B_SELLER.seller_name
            ,T_B2B_SELLER.account_cycle
            ,T_B2B_SELLER.indend_md
            ,T_B2B_SELLER.indend_md_name
            ,T_B2B_SELLER.state
            ,T_B2B_SELLER.ceo_name
            ,T_B2B_SELLER.tel
            ,T_B2B_SELLER.biz_no
            ,T_B2B_SELLER.biz_kind
            ,T_B2B_SELLER.biz_item
            ,T_B2B_SELLER.bank
            ,T_B2B_SELLER.account
            ,T_B2B_SELLER.depositor
            ,T_B2B_SELLER.homepage
            ,T_B2B_SELLER.post
            ,T_B2B_SELLER.addr
            ,T_B2B_SELLER.addr_detail
            ,T_B2B_SELLER.biz_file
            ,T_B2B_SELLER.biz_hooper
            ,T_B2B_SELLER.indend_md_email
            ,T_B2B_SELLER.indend_md_tel
            ,T_B2B_SELLER.indend_md_mobile
            ,T_B2B_SELLER.tax_email
            ,func.date_format(T_B2B_SELLER.create_at, '%Y-%m-%d %T').label('create_at')
        )
        .filter(*filters)
    )

    format_sql(sql)
    
    res = sql.first()
    balju_staff_list = balju_staff(request)
    if res != None :
        res = dict(zip(res.keys(), res))
        res.update({'balju_staff_list':balju_staff_list})
    
    return res

def balju_staff(request: Request):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(func.json_contains(T_B2B_SELLER_STAFF.roles, f'[2]'))
    filters.append(getattr(T_B2B_SELLER_STAFF, "seller_uid") == user.seller_uid)

    res = ( 
        db.query(
             T_B2B_SELLER_STAFF.uid
            ,T_B2B_SELLER_STAFF.seller_uid
            ,T_B2B_SELLER_STAFF.name
            ,T_B2B_SELLER_STAFF.email
            ,T_B2B_SELLER_STAFF.depart
        )
        .filter(*filters)
    )

    rows = []
    for c in res.all():
        list = dict(zip(c.keys(), c))
        rows.append(list)
    
    return rows