
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from inspect import currentframe as frame
from sqlalchemy.dialects import mysql as mysql_dialetct
from pymysql.converters import conversions, escape_item, encoders
from sqlalchemy import func, select, update, delete, Table, MetaData, and_
import math

from app.core import exceptions as ex
from app.core import util
from app.schemas.b2b.center.auth import *
from app.models.b2b.seller import *
from app.models.log import *
from app.deps import auth

from app.core.database import format_sql

# scm-b2b id & pw로 로그인
def signin_scm(request: Request, signin_request :SignInRequest):
    request.state.inspect = frame()
    db = request.state.db 

    sql = (
        db.query(
            T_B2B_SELLER_STAFF.uid
            ,T_B2B_SELLER_STAFF.seller_uid
            ,T_B2B_SELLER.seller_id
            ,T_B2B_SELLER.seller_name
            ,T_B2B_SELLER_STAFF.login_id
            ,T_B2B_SELLER_STAFF.login_pw
            ,T_B2B_SELLER_STAFF.user_id
            ,T_B2B_SELLER_STAFF.name
            ,T_B2B_SELLER_STAFF.depart
            ,T_B2B_SELLER_STAFF.roles
        )
        .join(
            T_B2B_SELLER,
            T_B2B_SELLER.uid == T_B2B_SELLER_STAFF.seller_uid,
        )
        .filter(
            T_B2B_SELLER_STAFF.user_id == signin_request.seller_id+'_'+signin_request.login_id
            ,T_B2B_SELLER_STAFF.login_id == signin_request.login_id
            ,T_B2B_SELLER_STAFF.seller_id == signin_request.seller_id
            ,T_B2B_SELLER_STAFF.delete_at == None
            ,T_B2B_SELLER.delete_at == None
            ,T_B2B_SELLER.state == "100"
        )
    )

    format_sql(sql)

    user = sql.first()

    if not user:
        return None
    
    if not auth.verify_password(signin_request.login_pw, user.login_pw):
        return None
    
    return user

# 로그 list
def log_list(request: Request, table_name:str, logListInput: LogListInput):
    request.state.inspect = frame()
    db = request.state.db

    filters = []
    filters.append(T_CHANGE_LOG.table_name.in_(table_name))
    filters.append(T_CHANGE_LOG.table_uid == logListInput.table_uid)
    
    if logListInput.filters :
        if logListInput.filters["skeyword"] :
            if logListInput.filters["skeyword_type"] != "" :
                filters.append(getattr(T_CHANGE_LOG, logListInput.filters["skeyword_type"]).like("%"+logListInput.filters["skeyword"]   +"%"))
            else : 
                filters.append(
                    T_CHANGE_LOG.column_key.like("%"+logListInput.filters["skeyword"]+"%") 
                )

        if logListInput.filters["create_at"]["startDate"] and logListInput.filters["create_at"]["endDate"] :
            filters.append(
                and_(
                    T_CHANGE_LOG.create_at >= logListInput.filters["create_at"]["startDate"]
                    ,T_CHANGE_LOG.create_at <= logListInput.filters["create_at"]["endDate"] + " 23:59:59"
                )
            )

    sql = (
        db.query(
             T_CHANGE_LOG.uid
            ,T_CHANGE_LOG.table_uid
            ,T_CHANGE_LOG.table_name
            ,T_CHANGE_LOG.column_key
            ,T_CHANGE_LOG.column_name
            ,T_CHANGE_LOG.cl_before
            ,T_CHANGE_LOG.cl_after
            ,T_CHANGE_LOG.create_user
            ,func.date_format(T_CHANGE_LOG.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.left(T_CHANGE_LOG.cl_before, 75).label('cl_before_left')
            ,func.left(T_CHANGE_LOG.cl_after, 75).label('cl_after_left')
        )
        .filter(*filters)
        .order_by(T_CHANGE_LOG.uid.desc())
        .offset((logListInput.page-1)*logListInput.page_view_size)
        .limit(logListInput.page_view_size)
    )

    format_sql(sql)

    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))
        if list["cl_before"] is not None and len(list["cl_before"]) > 75 : 
            list["cl_before"] = list["cl_before_left"]+"..."
        if list["cl_after"] is not None and len(list["cl_after"]) > 75 : 
            list["cl_after"] = list["cl_after_left"]+"..."
        rows.append(list)

    # [ S ] 페이징 처리
    logListInput.page_total = (
        db.query(T_CHANGE_LOG)
        .filter(*filters)
        .count()
    )
    logListInput.page_last = math.ceil(logListInput.page_total / logListInput.page_view_size)
    logListInput.page_size = len(rows) # 현재 페이지에 검색된 수
    # [ E ] 페이징 처리

    jsondata = {}
    jsondata.update({"params":logListInput})
    jsondata.update({"list": rows})

    return jsondata
