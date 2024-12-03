
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
from app.schemas.b2b.center.order import *
from app.models.b2b.order import *
from app.service import log_service
from app.service.log_service import *
from app.service.b2b import front_service
from app.service.b2b.center import order_service



from app.core.database import format_sql


# 상담내역
def consult_list(request: Request, pPage_param: PPage_param):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_ORDER, "delete_at") == None)
    filters.append(getattr(T_B2B_ORDER, "seller_id") == user.seller_id)

    if pPage_param.filters :
        if pPage_param.filters["skeyword"] :
            if pPage_param.filters["skeyword_type"] != "" :
                filters.append(getattr(T_B2B_ORDER, pPage_param.filters["skeyword_type"]).like("%"+pPage_param.filters["skeyword"]+"%"))
            else : 
                filters.append(
                    T_B2B_ORDER.apply_company.like("%"+pPage_param.filters["skeyword"]+"%") 
                    | T_B2B_ORDER.apply_name.like("%"+pPage_param.filters["skeyword"]+"%") 
                    | T_B2B_ORDER.title.like("%"+pPage_param.filters["skeyword"]+"%") 
                )

        if pPage_param.filters["create_at"]["startDate"] and pPage_param.filters["create_at"]["endDate"] :
            filters.append(
                and_(
                    T_B2B_ORDER.create_at >= pPage_param.filters["create_at"]["startDate"]
                    ,T_B2B_ORDER.create_at <= pPage_param.filters["create_at"]["endDate"] + " 23:59:59"
                )
            )
        if pPage_param.filters["state"] != '' :
            filters.append(getattr(T_B2B_ORDER, "state") == pPage_param.filters["state"])

    sql = (
        db.query(
             T_B2B_ORDER.uid
            ,T_B2B_ORDER.guid
            ,T_B2B_ORDER.seller_id
            ,T_B2B_ORDER.service_type
            ,T_B2B_ORDER.category
            ,T_B2B_ORDER.title
            ,T_B2B_ORDER.state
            ,T_B2B_ORDER.commission_type
            ,T_B2B_ORDER.commission
            ,T_B2B_ORDER.token_name
            ,T_B2B_ORDER.sosok_uid
            ,T_B2B_ORDER.sosok_id
            ,T_B2B_ORDER.apply_user_uid
            ,T_B2B_ORDER.apply_user_id
            ,T_B2B_ORDER.apply_company
            ,T_B2B_ORDER.apply_name
            ,T_B2B_ORDER.apply_depart
            ,T_B2B_ORDER.apply_position
            ,T_B2B_ORDER.apply_phone
            ,T_B2B_ORDER.apply_email
            ,func.date_format(T_B2B_ORDER.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_ORDER.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_ORDER.delete_at, '%Y-%m-%d %T').label('delete_at')
        )
        .filter(*filters)
        .order_by(T_B2B_ORDER.uid.desc())
        .offset((pPage_param.page-1)*pPage_param.page_view_size)
        .limit(pPage_param.page_view_size)
    )

    format_sql(sql)

    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))

        rows.append(list)


    # [ S ] 페이징 처리
    pPage_param.page_total = (
        db.query(T_B2B_ORDER)
        .filter(*filters)
        .count()
    )
    pPage_param.page_last = math.ceil(
        pPage_param.page_total / pPage_param.page_view_size)
    pPage_param.page_size = len(rows)  # 현재 페이지에 검색된 수
    # [ E ] 페이징 처리

    jsondata = {}
    jsondata.update({"params": pPage_param})
    jsondata.update({"list": rows})

    return jsondata

# 상담내역 상세
def consult_read(request: Request, uid: int):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_ORDER, "delete_at") == None)
    filters.append(getattr(T_B2B_ORDER, "uid") == uid)
    filters.append(getattr(T_B2B_ORDER, "seller_id") == user.seller_id)

    sql = ( 
        db.query(
             T_B2B_ORDER.uid
            ,T_B2B_ORDER.guid
            ,T_B2B_ORDER.seller_id
            ,T_B2B_ORDER.service_type
            ,T_B2B_ORDER.category
            ,T_B2B_ORDER.title
            ,T_B2B_ORDER.state
            ,T_B2B_ORDER.commission_type
            ,T_B2B_ORDER.commission
            ,T_B2B_ORDER.token_name
            ,T_B2B_ORDER.sosok_uid
            ,T_B2B_ORDER.sosok_id
            ,T_B2B_ORDER.apply_user_uid
            ,T_B2B_ORDER.apply_user_id
            ,T_B2B_ORDER.apply_company
            ,T_B2B_ORDER.apply_name
            ,T_B2B_ORDER.apply_depart
            ,T_B2B_ORDER.apply_position
            ,T_B2B_ORDER.apply_phone
            ,T_B2B_ORDER.apply_email
            ,func.date_format(T_B2B_ORDER.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_ORDER.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_ORDER.delete_at, '%Y-%m-%d %T').label('delete_at')
        )
        .filter(*filters)
    )
    format_sql(sql)
    
    
    res = sql.first()

    if res != None :
        res = dict(zip(res.keys(), res))
    
        memo_list = log_service.memo_list(request, "T_B2B_ORDER", uid)
        res.update({"memo_list" : memo_list["list"]})

        info_list = front_service.info_list(request, uid, res["guid"])
        request.state.inspect = frame()
        res.update({"info_list" : info_list})

    return res

# 상담내역_편집 - consult_update
def consult_update(request: Request, orderConsultInput: OrderConsultInput):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user
    
    res = db.query(T_B2B_ORDER).filter(T_B2B_ORDER.uid == orderConsultInput.uid).first()

    if res is None :
        return None
        
    if orderConsultInput.state is not None and res.state != orderConsultInput.state : 
        create_log(request, res.uid, "T_B2B_ORDER", "state", "처리상태", res.state, orderConsultInput.state, user.staff_id)
        request.state.inspect = frame()
        res.state = orderConsultInput.state
    
    res.update_at = util.getNow()

    return res


# 계약내역
def contract_list(request: Request, pPage_param: PPage_param):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_ORDER_CONT, "delete_at") == None)
    filters.append(getattr(T_B2B_ORDER_CONT, "seller_id") == user.seller_id)

    if pPage_param.filters :
        if pPage_param.filters["skeyword"] :
            if pPage_param.filters["skeyword_type"] != "" :
                filters.append(getattr(T_B2B_ORDER, pPage_param.filters["skeyword_type"]).like("%"+pPage_param.filters["skeyword"]+"%"))
            else : 
                filters.append(
                    T_B2B_ORDER.apply_company.like("%"+pPage_param.filters["skeyword"]+"%") 
                    | T_B2B_ORDER.apply_name.like("%"+pPage_param.filters["skeyword"]+"%") 
                    | T_B2B_ORDER.title.like("%"+pPage_param.filters["skeyword"]+"%") 
                )
        # 계약일
        if pPage_param.filters["create_at"]["startDate"] and pPage_param.filters["create_at"]["endDate"] :
            filters.append(
                and_(
                    T_B2B_ORDER_CONT.contract_date >= pPage_param.filters["create_at"]["startDate"]
                    ,T_B2B_ORDER_CONT.contract_date <= pPage_param.filters["create_at"]["endDate"] + " 23:59:59"
                )
            )
        if pPage_param.filters["cont_state"] != '' :
            filters.append(getattr(T_B2B_ORDER_CONT, "cont_state") == pPage_param.filters["cont_state"])

    sql = (
        db.query(
             T_B2B_ORDER_CONT.ouid
            ,T_B2B_ORDER_CONT.guid
            ,T_B2B_ORDER_CONT.cont_state
            ,T_B2B_ORDER_CONT.contract_date
            ,T_B2B_ORDER_CONT.start_date
            ,T_B2B_ORDER_CONT.end_date
            ,func.date_format(T_B2B_ORDER_CONT.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_ORDER_CONT.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_ORDER_CONT.delete_at, '%Y-%m-%d %T').label('delete_at')
            ,T_B2B_ORDER.title
            ,T_B2B_ORDER.apply_company
            ,T_B2B_ORDER.apply_name
        )
        .join(T_B2B_ORDER, T_B2B_ORDER.uid == T_B2B_ORDER_CONT.ouid)
        .filter(*filters)
        .order_by(T_B2B_ORDER.uid.desc())
        .offset((pPage_param.page-1)*pPage_param.page_view_size)
        .limit(pPage_param.page_view_size)
    )

    format_sql(sql)

    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))

        rows.append(list)


    # [ S ] 페이징 처리
    pPage_param.page_total = (
        db.query(T_B2B_ORDER_CONT)
        .join(T_B2B_ORDER, T_B2B_ORDER.uid == T_B2B_ORDER_CONT.ouid)
        .filter(*filters)
        .count()
    )
    pPage_param.page_last = math.ceil(
        pPage_param.page_total / pPage_param.page_view_size)
    pPage_param.page_size = len(rows)  # 현재 페이지에 검색된 수
    # [ E ] 페이징 처리

    jsondata = {}
    jsondata.update({"params":pPage_param})
    jsondata.update({"list": rows})

    return jsondata


# 계약진행_등록 - contract_create
def contract_create(request: Request, orderConsultInput: OrderConsultInput):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user

    db_item = T_B2B_ORDER_CONT (
         ouid = orderConsultInput.uid
        ,guid = orderConsultInput.guid
        ,cont_state = '임시저장(계약진행중)'
        ,seller_id = orderConsultInput.seller_id
        ,create_user = user.staff_id
    )

    db.add(db_item)
    db.flush()

    create_log(request, db_item.ouid, "T_B2B_ORDER_CONT", "INSERT", "계약진행 등록", 0, db_item.ouid, user.staff_id)
    request.state.inspect = frame()

    return db_item

# 계약내역_상세
def contract_read(request: Request, ouid: int):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_ORDER_CONT, "delete_at") == None)
    filters.append(getattr(T_B2B_ORDER_CONT, "ouid") == ouid)
    filters.append(getattr(T_B2B_ORDER_CONT, "seller_id") == user.seller_id)

    sql = ( 
        db.query(
             T_B2B_ORDER_CONT.ouid
            ,T_B2B_ORDER_CONT.guid
            ,T_B2B_ORDER_CONT.cont_state
            ,func.date_format(T_B2B_ORDER_CONT.contract_date, '%Y-%m-%d').label('contract_date')
            ,T_B2B_ORDER_CONT.contract_price
            ,T_B2B_ORDER_CONT.contract_code
            ,func.date_format(T_B2B_ORDER_CONT.start_date, '%Y-%m-%d').label('start_date')
            ,func.date_format(T_B2B_ORDER_CONT.end_date, '%Y-%m-%d').label('end_date')
            ,T_B2B_ORDER_CONT.cont_staff_name
            ,T_B2B_ORDER_CONT.cont_staff_depart
            ,T_B2B_ORDER_CONT.cont_staff_position
            ,T_B2B_ORDER_CONT.cont_staff_phone
            ,T_B2B_ORDER_CONT.cont_staff_email
            ,T_B2B_ORDER_CONT.seller_id
            ,T_B2B_ORDER_CONT.create_user
            ,func.date_format(T_B2B_ORDER_CONT.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_ORDER_CONT.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_ORDER_CONT.delete_at, '%Y-%m-%d %T').label('delete_at')
            ,T_B2B_ORDER.category
            ,T_B2B_ORDER.title
            ,T_B2B_ORDER.commission_type
            ,T_B2B_ORDER.commission
            ,T_B2B_ORDER.apply_company
            ,T_B2B_ORDER.apply_name
            ,T_B2B_ORDER.apply_depart
            ,T_B2B_ORDER.apply_position
            ,T_B2B_ORDER.apply_phone
            ,T_B2B_ORDER.apply_email
            ,func.date_format(T_B2B_ORDER.create_at, '%Y-%m-%d').label('order_create_at')
            ,func.date_format(T_B2B_ORDER.update_at, '%Y-%m-%d').label('order_update_at')
        )
        .join(T_B2B_ORDER,T_B2B_ORDER.uid == ouid)
        .filter(*filters)
    )
    format_sql(sql)
    
    res = sql.first()
    if res is not None :
        res = dict(zip(res.keys(), res))
    
    memo_list = log_service.memo_list(request, "T_B2B_ORDER_CONT", ouid)
    res.update({"memo_list" : memo_list["list"]})
    
    consult_memo_list = log_service.memo_list(request, "T_B2B_ORDER", ouid)
    res.update({"consult_memo_list" : consult_memo_list["list"]})
    
    info_list = front_service.info_list(request, ouid, res["guid"])
    request.state.inspect = frame()
    res.update({"info_list" : info_list})

    return res

# 계약내역_편집 - contract_update
def contract_update(request: Request, orderContractInput: OrderContractInput):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user

    res = db.query(T_B2B_ORDER_CONT).filter(T_B2B_ORDER_CONT.ouid == orderContractInput.ouid).first()
    if res is None :
        return None
        
    
    if orderContractInput.cont_staff_name is not None and res.cont_staff_name != orderContractInput.cont_staff_name : 
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "cont_staff_name", "계약담당자명", res.cont_staff_name, orderContractInput.cont_staff_name, user.staff_id)
        request.state.inspect = frame()
        res.cont_staff_name = orderContractInput.cont_staff_name
        
    if orderContractInput.cont_staff_depart is not None and res.cont_staff_depart != orderContractInput.cont_staff_depart : 
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "cont_staff_depart", "계약담당자부서", res.cont_staff_depart, orderContractInput.cont_staff_depart, user.staff_id)
        request.state.inspect = frame()
        res.cont_staff_depart = orderContractInput.cont_staff_depart
        
    if orderContractInput.cont_staff_position is not None and res.cont_staff_position != orderContractInput.cont_staff_position : 
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "cont_staff_position", "계약담당자직책", res.cont_staff_position, orderContractInput.cont_staff_position, user.staff_id)
        request.state.inspect = frame()
        res.cont_staff_position = orderContractInput.cont_staff_position
        
    if orderContractInput.cont_staff_phone is not None and res.cont_staff_phone != orderContractInput.cont_staff_phone : 
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "cont_staff_phone", "계약담당자연락처", res.cont_staff_phone, orderContractInput.cont_staff_phone, user.staff_id)
        request.state.inspect = frame()
        res.cont_staff_phone = orderContractInput.cont_staff_phone
        
    if orderContractInput.cont_staff_email is not None and res.cont_staff_email != orderContractInput.cont_staff_email : 
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "cont_staff_email", "계약담당자이메일", res.cont_staff_email, orderContractInput.cont_staff_email, user.staff_id)
        request.state.inspect = frame()
        res.cont_staff_email = orderContractInput.cont_staff_email
        
    if orderContractInput.cont_state is not None and res.cont_state != orderContractInput.cont_state : 
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "cont_state", "처리상태", res.cont_state, orderContractInput.cont_state, user.staff_id)
        request.state.inspect = frame()
        res.cont_state = orderContractInput.cont_state
        
    if orderContractInput.contract_price is not None and res.contract_price != orderContractInput.contract_price : 
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "contract_price", "최종결제금액", res.contract_price, orderContractInput.contract_price, user.staff_id)
        request.state.inspect = frame()
        res.contract_price = orderContractInput.contract_price
    
    if orderContractInput.contract_date is not None and datetime.strftime(res.contract_date, '%Y-%m-%d') != orderContractInput.contract_date.split('T')[0] : 
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "contract_date", "계약일", res.contract_date, orderContractInput.contract_date, user.staff_id)
        request.state.inspect = frame()
        res.contract_date = orderContractInput.contract_date

    if orderContractInput.start_date is not None and datetime.strftime(res.start_date, '%Y-%m-%d') != orderContractInput.start_date.split('T')[0] :
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "start_date", "서비스기간_시작일", res.start_date, orderContractInput.start_date, user.staff_id)
        request.state.inspect = frame()
        res.start_date = orderContractInput.start_date
    
    if orderContractInput.end_date is not None and datetime.strftime(res.end_date, '%Y-%m-%d') != orderContractInput.end_date.split('T')[0] :
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "end_date", "서비스기간_종료일", res.end_date, orderContractInput.end_date, user.staff_id)
        request.state.inspect = frame()
        res.end_date = orderContractInput.end_date
        
    if orderContractInput.cont_state == '계약완료(정산대기)' and res.contract_code is None : 
        date_select = db.query(
            func.date_format(T_B2B_ORDER.create_at, '%Y').label('year')
            ,func.date_format(T_B2B_ORDER.create_at, '%m').label('month')
            ,T_B2B_ORDER.uid
        ).filter(T_B2B_ORDER.uid == orderContractInput.ouid).first()
        orderContractInput.contract_code = date_select.year+date_select.month+str(date_select.uid)
        create_log(request, res.ouid, "T_B2B_ORDER_CONT", "contract_code", "계약담당자명", res.contract_code, orderContractInput.contract_code, user.staff_id)
        request.state.inspect = frame()
        res.contract_code = orderContractInput.contract_code

    res.update_at = util.getNow()

    return res


# 정산내역
def account_list(request: Request, pPage_param: PPage_param):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_ORDER_ACCOUNT, "delete_at") == None)
    filters.append(getattr(T_B2B_ORDER_ACCOUNT, "seller_id") == user.seller_id)

    if pPage_param.filters :
        if pPage_param.filters["skeyword"] :
            if pPage_param.filters["skeyword_type"] != "" :
                filters.append(getattr(T_B2B_ORDER, pPage_param.filters["skeyword_type"]).like("%"+pPage_param.filters["skeyword"]+"%"))
            else : 
                filters.append(
                    T_B2B_ORDER.apply_company.like("%"+pPage_param.filters["skeyword"]+"%") 
                    | T_B2B_ORDER.apply_name.like("%"+pPage_param.filters["skeyword"]+"%") 
                    | T_B2B_ORDER.title.like("%"+pPage_param.filters["skeyword"]+"%") 
                )
        # 등록일
        if pPage_param.filters["create_at"]["startDate"] and pPage_param.filters["create_at"]["endDate"] :
            filters.append(
                and_(
                    T_B2B_ORDER_ACCOUNT.create_at >= pPage_param.filters["create_at"]["startDate"]
                    ,T_B2B_ORDER_ACCOUNT.create_at <= pPage_param.filters["create_at"]["endDate"] + " 23:59:59"
                )
            )
        # 정산일
        if pPage_param.filters["account_at"]["startDate"] and pPage_param.filters["account_at"]["endDate"] :
            filters.append(
                and_(
                    T_B2B_ORDER_ACCOUNT.account_date >= pPage_param.filters["account_at"]["startDate"]
                    ,T_B2B_ORDER_ACCOUNT.account_date <= pPage_param.filters["account_at"]["endDate"] + " 23:59:59"
                )
            )
        if pPage_param.filters["account_state"] != '' :
            filters.append(getattr(T_B2B_ORDER_ACCOUNT, "account_state") == pPage_param.filters["account_state"])

    gagam_stmt = (
        db.query(
             T_B2B_ORDER_GAGAM.ouid.label('gagam_ouid')
            ,func.sum(T_B2B_ORDER_GAGAM.gagam_price).label('gagam_sum')
        )
        .group_by(T_B2B_ORDER_GAGAM.ouid)
        .subquery()
    )

    sql = (
        db.query(
             T_B2B_ORDER_ACCOUNT.ouid
            ,T_B2B_ORDER_ACCOUNT.guid
            ,func.date_format(T_B2B_ORDER_ACCOUNT.account_date, '%Y-%m-%d').label('account_date')
            ,T_B2B_ORDER_ACCOUNT.account_state
            ,T_B2B_ORDER_ACCOUNT.seller_id
            ,func.date_format(T_B2B_ORDER_ACCOUNT.contract_date, '%Y-%m-%d').label('contract_date')
            ,T_B2B_ORDER_ACCOUNT.contract_price
            ,T_B2B_ORDER_ACCOUNT.tax_invoice_date
            ,T_B2B_ORDER_ACCOUNT.confirm_commission
            ,func.date_format(T_B2B_ORDER_ACCOUNT.create_at, '%Y-%m-%d %T').label('create_at')
            ,T_B2B_ORDER_CONT.cont_staff_name
            ,T_B2B_ORDER.title
            ,T_B2B_ORDER.apply_company
            ,T_B2B_ORDER.apply_name
            ,(gagam_stmt.c.gagam_sum+T_B2B_ORDER_ACCOUNT.confirm_commission).label("account_price")
        )
        .join(
            T_B2B_ORDER_CONT,
            T_B2B_ORDER_CONT.ouid == T_B2B_ORDER_ACCOUNT.ouid
        )
        .join(
            T_B2B_ORDER,
            T_B2B_ORDER.uid == T_B2B_ORDER_ACCOUNT.ouid
        )
        .join(
            gagam_stmt, 
            gagam_stmt.c.gagam_ouid == T_B2B_ORDER_ACCOUNT.ouid,
            isouter = True 
        )
        .filter(*filters)
        .order_by(T_B2B_ORDER.uid.desc())
        .offset((pPage_param.page-1)*pPage_param.page_view_size)
        .limit(pPage_param.page_view_size)
    )

    format_sql(sql)

    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))
        rows.append(list)


    # [ S ] 페이징 처리
    pPage_param.page_total = (
        db.query(T_B2B_ORDER_ACCOUNT)
        .join(
            T_B2B_ORDER_CONT,
            T_B2B_ORDER_CONT.ouid == T_B2B_ORDER_ACCOUNT.ouid
        )
        .join(
            T_B2B_ORDER,
            T_B2B_ORDER.uid == T_B2B_ORDER_ACCOUNT.ouid
        )
        .join(
            gagam_stmt, 
            gagam_stmt.c.gagam_ouid == T_B2B_ORDER_ACCOUNT.ouid,
            isouter = True 
        )
        .filter(*filters)
        .count()
    )
    pPage_param.page_last = math.ceil(
        pPage_param.page_total / pPage_param.page_view_size)
    pPage_param.page_size = len(rows)  # 현재 페이지에 검색된 수
    # [ E ] 페이징 처리

    jsondata = {}
    jsondata.update({"params":pPage_param})
    jsondata.update({"list": rows})

    return jsondata

    
# 계약완료_정산등록 - account_create
def account_create(request: Request, orderContractInput: OrderContractInput):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user

    # [ S ] 정산일 구하기 등록일기준 마지막날
    this_month_last = (datetime(datetime.today().year, datetime.today().month, 1) + relativedelta(months=1)) + relativedelta(seconds=-1)
    # [ E ] 정산일 구하기

    # [ S ] 수수료 구하기
    if orderContractInput.commission_type == "A" :
        confirm_commission = orderContractInput.contract_price * orderContractInput.commission / 100
    elif orderContractInput.commission_type == "B" :
        confirm_commission = orderContractInput.commission
    # [ E ] 수수료 구하기
    
    db_item = T_B2B_ORDER_ACCOUNT (
         ouid = orderContractInput.ouid
        ,guid = orderContractInput.guid
        ,contract_code = orderContractInput.contract_code
        ,account_state = '정산대기'
        ,account_date = this_month_last.strftime('%Y-%m-%d')
        ,contract_date = orderContractInput.contract_date
        ,contract_price = orderContractInput.contract_price
        ,commission_type = orderContractInput.commission_type
        ,commission = orderContractInput.commission
        ,confirm_commission = confirm_commission
        ,create_user = orderContractInput.create_user
        ,seller_id = orderContractInput.seller_id
    )

    db.add(db_item)
    db.flush()

    create_log(request, db_item.ouid, "T_B2B_ORDER_CONT", "INSERT", "계약진행 등록", 0, db_item.ouid, user.staff_id)
    request.state.inspect = frame()

    return db_item

# 정산내역_상세
def account_read(request: Request, ouid: int):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_ORDER_ACCOUNT, "delete_at") == None)
    filters.append(getattr(T_B2B_ORDER_ACCOUNT, "ouid") == ouid)
    filters.append(getattr(T_B2B_ORDER_ACCOUNT, "seller_id") == user.seller_id)

    sql = ( 
        db.query(
             T_B2B_ORDER_ACCOUNT.ouid
            ,T_B2B_ORDER_ACCOUNT.guid
            ,T_B2B_ORDER_ACCOUNT.contract_code
            ,T_B2B_ORDER_ACCOUNT.account_state
            ,func.date_format(T_B2B_ORDER_ACCOUNT.tax_invoice_date, '%Y-%m-%d').label('tax_invoice_date')
            ,func.date_format(T_B2B_ORDER_ACCOUNT.account_date, '%Y-%m-%d').label('account_date')
            ,func.date_format(T_B2B_ORDER_ACCOUNT.contract_date, '%Y-%m-%d').label('contract_date')
            ,T_B2B_ORDER_ACCOUNT.contract_price
            ,T_B2B_ORDER_ACCOUNT.commission_type
            ,T_B2B_ORDER_ACCOUNT.commission
            ,T_B2B_ORDER_ACCOUNT.confirm_commission
            ,T_B2B_ORDER_ACCOUNT.create_user
            ,T_B2B_ORDER_ACCOUNT.seller_id
            ,func.date_format(T_B2B_ORDER_ACCOUNT.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_ORDER_ACCOUNT.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_ORDER_ACCOUNT.delete_at, '%Y-%m-%d %T').label('delete_at')
            ,T_B2B_ORDER.category
            ,T_B2B_ORDER.title
            ,T_B2B_ORDER.commission_type
            ,T_B2B_ORDER.commission
            ,T_B2B_ORDER.apply_company
            ,T_B2B_ORDER.apply_name
            ,T_B2B_ORDER.apply_depart
            ,T_B2B_ORDER.apply_position
            ,T_B2B_ORDER.apply_phone
            ,T_B2B_ORDER.apply_email
            ,func.date_format(T_B2B_ORDER.create_at, '%Y-%m-%d').label('order_create_at')
            ,func.date_format(T_B2B_ORDER.update_at, '%Y-%m-%d').label('order_update_at')
            ,func.date_format(T_B2B_ORDER_CONT.start_date, '%Y-%m-%d').label('start_date')
            ,func.date_format(T_B2B_ORDER_CONT.end_date, '%Y-%m-%d').label('end_date')
            ,T_B2B_ORDER_CONT.cont_state
            ,T_B2B_ORDER_CONT.cont_staff_name
            ,T_B2B_ORDER_CONT.cont_staff_depart
            ,T_B2B_ORDER_CONT.cont_staff_position
            ,T_B2B_ORDER_CONT.cont_staff_phone
            ,T_B2B_ORDER_CONT.cont_staff_email
        )
        .join(T_B2B_ORDER,T_B2B_ORDER.uid == T_B2B_ORDER_ACCOUNT.ouid)
        .join(T_B2B_ORDER_CONT,T_B2B_ORDER_CONT.ouid == T_B2B_ORDER_ACCOUNT.ouid)
        .filter(*filters)
    )
    format_sql(sql)
    
    res = sql.first()
    res = dict(zip(res.keys(), res))

    total_commission = res["confirm_commission"]
    
    gagam_list = order_service.gagam_list(request, ouid, total_commission)
    request.state.inspect = frame()
    res.update({"gagam_list" : gagam_list["list"]})

    cancle_list = order_service.cancle_list(request, ouid)
    request.state.inspect = frame()
    res.update({"cancle_list" : cancle_list["list"]})

    
    if len(gagam_list["list"]) > 0 :
        total_commission = total_commission + gagam_list["total_commission"]
    
    if len(cancle_list["list"]) > 0 :
        total_cancle_price = cancle_list["total_cancle_price"]

    res.update({"total_commission" : total_commission})
    res.update({"total_cancle_price" : total_cancle_price})
    
    memo_list = log_service.memo_list(request, "T_B2B_ORDER_ACCOUNT", ouid)
    request.state.inspect = frame()
    
    contrant_memo_list = log_service.memo_list(request, "T_B2B_ORDER_CONT", ouid)
    res.update({"contrant_memo_list" : contrant_memo_list["list"]})
    
    consult_memo_list = log_service.memo_list(request, "T_B2B_ORDER", ouid)
    res.update({"consult_memo_list" : consult_memo_list["list"]})

    info_list = front_service.info_list(request, ouid, res["guid"])
    request.state.inspect = frame()
    res.update({"info_list" : info_list})

    res.update({"memo_list" : memo_list["list"]})

    return res

# 가감 내역
def gagam_list(request: Request, ouid: int, total_commission:int):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_ORDER_GAGAM, "ouid") == ouid)
    filters.append(getattr(T_B2B_ORDER_GAGAM, "seller_id") == user.seller_id)

    sql = ( 
        db.query(
             T_B2B_ORDER_GAGAM.gagam_price
            ,T_B2B_ORDER_GAGAM.gagam_state
            ,T_B2B_ORDER_GAGAM.gagam_reason
            ,T_B2B_ORDER_GAGAM.gagam_tax
            ,T_B2B_ORDER_GAGAM.create_user
            ,func.date_format(T_B2B_ORDER_GAGAM.account_date, '%Y-%m-%d').label('gagam_account_date')
            ,func.date_format(T_B2B_ORDER_GAGAM.create_at, '%Y-%m-%d').label('gagam_create_at')
        )
        .filter(*filters)
    )

    format_sql(sql)

    rows = []
    total_commission = 0
    for c in sql.all():
        rows.append(dict(zip(c.keys(), c)))
        total_commission = int(total_commission) + int(c.gagam_price)

    
    jsondata = {}
    jsondata.update({"total_commission": total_commission})
    jsondata.update({"list": rows})

    return jsondata


# 취소/환불 내역
def cancle_list(request: Request, ouid: int):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_B2B_ORDER_CANCEL, "delete_at") == None)
    filters.append(getattr(T_B2B_ORDER_CANCEL, "ouid") == ouid)
    filters.append(getattr(T_B2B_ORDER_CANCEL, "seller_id") == user.seller_id)

    sql = ( 
        db.query(
             T_B2B_ORDER_CANCEL.cancel_price
            ,T_B2B_ORDER_CANCEL.cancel_reason
            ,T_B2B_ORDER_CANCEL.cancel_state
            ,T_B2B_ORDER_CANCEL.cancel_file_name
            ,T_B2B_ORDER_CANCEL.cancel_file_url
            ,T_B2B_ORDER_CANCEL.cancel_tax
            ,T_B2B_ORDER_CANCEL.create_user
            ,func.date_format(T_B2B_ORDER_CANCEL.create_at, '%Y-%m-%d').label('cancle_create_at')
        )
        .filter(*filters)
    )
    total_cancle_price = 0
    rows = []
    for c in sql.all():
        rows.append(dict(zip(c.keys(), c)))
        total_cancle_price = total_cancle_price+c.cancel_price

    jsondata = {}
    
    jsondata.update({"total_cancle_price": total_cancle_price})
    jsondata.update({"list": rows})

    return jsondata



# 취소요청_취소등록 - cancle_create
def cancle_create(request: Request, cancleInput: CancleInput):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user

    cancel_price = (cancleInput.cancel_price)*-1

    cancel_state = None
    if cancleInput.total_commission == cancleInput.cancel_price :
        cancel_state = '전체취소'
    elif cancleInput.total_commission > cancleInput.cancel_price :
        cancel_state = '부분취소'

    db_item = T_B2B_ORDER_CANCEL (
         ouid = cancleInput.ouid
        ,guid = cancleInput.guid
        ,cancel_price = cancel_price
        ,cancel_reason = cancleInput.cancel_reason
        ,cancel_state = cancel_state
        ,cancel_file_name = cancleInput.cancel_file_name
        ,cancel_file_url = cancleInput.cancel_file_url
        ,cancel_tax = cancleInput.cancel_tax
        ,seller_id = user.seller_id
        ,create_user = user.staff_id
    )

    db.add(db_item)
    db.flush()

    create_log(request, db_item.uid, "T_B2B_ORDER_CANCEL", "INSERT", "취소요청 등록", 0, db_item.uid, user.staff_id)
    request.state.inspect = frame()
    
    gagam_item = T_B2B_ORDER_GAGAM (
         ouid = cancleInput.ouid
        ,guid = cancleInput.guid
        ,gagam_price = cancel_price
        ,gagam_state = cancel_state
        ,gagam_reason = cancleInput.cancel_reason
        ,gagam_tax = cancleInput.cancel_tax
        ,account_date = cancleInput.account_date
        ,seller_id = user.seller_id
        ,create_user = user.staff_id
    )

    db.add(gagam_item)
    db.flush()

    create_log(request, gagam_item.uid, "T_B2B_ORDER_GAGAM", "INSERT", "가감 등록", 0, gagam_item.uid, user.staff_id)
    request.state.inspect = frame()

    return db_item