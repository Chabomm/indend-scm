
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from inspect import currentframe as frame
from sqlalchemy.dialects import mysql as mysql_dialetct
from pymysql.converters import conversions, escape_item, encoders
from sqlalchemy import func, select, update, delete, Table, MetaData, and_
import math
import json

from app.core import exceptions as ex
from app.core import util

from app.models.b2b.goods import *
from app.models.b2b.order import *
from app.models.b2b.seller import *
from app.models.b2b.center.oubound import *
from app.schemas.b2b.admin import *
from app.schemas.b2b.front import *
from app.service.log_service import *
from app.service.b2b import front_service
from app.service.b2b import admin_service
# from app.service import partner_service

from app.core.database import format_sql

# 서비스_상세
def goods_read(request: Request, uid: int):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    sql = ( 
        db.query(
             T_B2B_GOODS.uid
            ,T_B2B_GOODS.service_type
            ,T_B2B_GOODS.category
            ,T_B2B_GOODS.seller_id
            ,T_B2B_GOODS.seller_name
            ,T_B2B_GOODS.title
            ,T_B2B_GOODS.sub_title
            ,T_B2B_GOODS.contents
            ,T_B2B_GOODS.benefit
            ,T_B2B_GOODS.attention
            ,T_B2B_GOODS.keyword
            ,T_B2B_GOODS.thumb
            ,T_B2B_GOODS.option_yn
            ,T_B2B_GOODS.option_value
            ,T_B2B_GOODS.option_cnt
            ,T_B2B_GOODS.market_price
            ,T_B2B_GOODS.price
            ,T_B2B_GOODS.str_sale_percent
            ,T_B2B_GOODS.str_market_price
            ,T_B2B_GOODS.str_price
            ,T_B2B_GOODS.commission_type
            ,T_B2B_GOODS.commission
            ,T_B2B_GOODS.other_service
            ,T_B2B_GOODS.sort
            ,T_B2B_GOODS.start_date
            ,T_B2B_GOODS.end_date
            ,T_B2B_GOODS.is_display
            ,T_B2B_GOODS.state
            ,func.date_format(T_B2B_GOODS.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_GOODS.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_GOODS.delete_at, '%Y-%m-%d %T').label('delete_at')
        )
        .filter(
            T_B2B_GOODS.uid == uid
            ,T_B2B_GOODS.is_display == 'T'
            ,T_B2B_GOODS.delete_at == None
        )
    )
    format_sql(sql)
    res = sql.first()

    if res != None :
        res = dict(zip(res.keys(), res))

    image_list = front_service.image_list(request, uid)
    request.state.inspect = frame()
    res.update({"etc_images" : image_list})

    other_service_list = front_service.other_service_list(request, res["other_service"], res["service_type"])
    request.state.inspect = frame()
    res.update({"other_service_list" : other_service_list})

    return res

def image_list(request: Request, uid: int):
    request.state.inspect = frame()
    db = request.state.db
    
    sql = (
        db.query(
             T_B2B_GOODS_IMAGE.guid
            ,T_B2B_GOODS_IMAGE.img_url
            ,T_B2B_GOODS_IMAGE.sort
        )
        .filter(T_B2B_GOODS_IMAGE.guid == uid)
        .order_by(T_B2B_GOODS_IMAGE.sort.asc())
    )

    format_sql(sql)

    rows = []
    for c in sql.all():
        rows.append(dict(zip(c.keys(), c)))

    return rows

# 업체추가리스트
def other_service_list(request: Request, other_service:str, service_type:str):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    if other_service != '' and other_service != None :
        other_service = other_service.split(',')
    else :
        return

    filters = []
    filters.append(getattr(T_B2B_GOODS, "delete_at") == None)
    filters.append(getattr(T_B2B_GOODS, "service_type") == service_type)
    filters.append(getattr(T_B2B_GOODS, "is_display") == 'T')
    filters.append(T_B2B_GOODS.uid.in_(other_service))

    sql = (
        db.query(
             T_B2B_GOODS.uid
            ,T_B2B_GOODS.category
            ,T_B2B_GOODS.title
            ,T_B2B_GOODS.keyword
            ,T_B2B_GOODS.thumb
            ,T_B2B_GOODS.str_market_price
            ,T_B2B_GOODS.str_price
            ,func.date_format(T_B2B_GOODS.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_GOODS.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_GOODS.delete_at, '%Y-%m-%d %T').label('delete_at')
        )
        .filter(*filters)
        .order_by(T_B2B_GOODS.uid.desc())
    )

    format_sql(sql)

    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))
        if list["keyword"] != '' and list["keyword"] != None :
            keyword = list["keyword"].split(',')
            list["keyword"] = keyword

        rows.append(list)

    return rows




# 서비스_신청_read
def order_detail(request: Request, orderInput : OrderInput):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    sql = ( 
        db.query(
             T_B2B_GOODS.uid.label('guid')
            ,T_B2B_GOODS.seller_id
            ,T_B2B_GOODS.seller_name
            ,T_B2B_GOODS.service_type
            ,T_B2B_GOODS.category
            ,T_B2B_GOODS.title
            ,T_B2B_GOODS.state
            ,T_B2B_GOODS.commission_type
            ,T_B2B_GOODS.commission
        )
        .filter(
            T_B2B_GOODS.uid == orderInput.guid
            ,T_B2B_GOODS.delete_at == None
            ,T_B2B_GOODS.is_display == 'T'
        )
    )
    # format_sql(sql)
    res = sql.first()

    if res != None :
        res = dict(zip(res.keys(), res))

    option_list = admin_service.option_list(request, orderInput.guid)
    request.state.inspect = frame()
    res.update({"option_list" : option_list})

    return res


# 서비스신청등록 - order_create
def order_create(request: Request, b2BOrderInput : B2BOrderInput):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user

    db_item = T_B2B_ORDER (
         guid = b2BOrderInput.guid
        ,seller_id = b2BOrderInput.seller_id
        ,service_type = b2BOrderInput.service_type
        ,category = b2BOrderInput.category
        ,title = b2BOrderInput.title
        ,state = '신규상담'
        ,commission_type = b2BOrderInput.commission_type
        ,commission = b2BOrderInput.commission
        ,token_name = b2BOrderInput.token_name
        ,sosok_uid = b2BOrderInput.sosok_uid
        ,sosok_id = b2BOrderInput.sosok_id
        ,apply_user_uid = b2BOrderInput.apply_user_uid
        ,apply_user_id = b2BOrderInput.apply_user_id
        ,apply_company = b2BOrderInput.apply_company
        ,apply_name = b2BOrderInput.apply_name
        ,apply_depart = b2BOrderInput.apply_depart
        ,apply_position = b2BOrderInput.apply_position
        ,apply_phone = b2BOrderInput.apply_phone
        ,apply_email = b2BOrderInput.apply_email
    )

    db.add(db_item)
    db.flush()

    # 서비스신청등록(옵션) - order_info_create
    if len(b2BOrderInput.info_list) > 0 :
        for info in b2BOrderInput.info_list :
            if info.option_type == 'E' :
                if info.placeholder == 'single' :
                    info.apply_value = info.apply_value["endDate"]
                else :
                    info.apply_value = info.apply_value["startDate"]+'~'+info.apply_value["endDate"]


        for val in b2BOrderInput.info_list :
            option_db_item = T_B2B_ORDER_INFO (
                 ouid = db_item.uid
                ,guid = b2BOrderInput.guid
                ,option_num = val.option_num
                ,option_type = val.option_type
                ,option_title = val.option_title
                ,option_yn = val.option_yn
                ,placeholder = val.placeholder
                ,apply_value = val.apply_value
                ,file_name = val.file_name
            )
            db.add(option_db_item)
            db.flush()
            

    create_log(request, db_item.uid, "T_B2B_ORDER", "INSERT", "서비스신청 등록", 0, db_item.uid, user.user_id)
    request.state.inspect = frame()

    return db_item

# 신청내역_상세
def order_read(request: Request, uid: int):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

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
        .filter(
            T_B2B_ORDER.uid == uid
            ,T_B2B_ORDER.delete_at == None
        )
    )
    format_sql(sql)
    res = sql.first()

    if res != None :
        res = dict(zip(res.keys(), res))

    info_list = front_service.info_list(request, uid, res["guid"])
    request.state.inspect = frame()
    res.update({"info_list" : info_list})

    return res

def info_list(request: Request, uid: int, guid:int):
    request.state.inspect = frame()
    db = request.state.db
    
    sql = (
        db.query(
             T_B2B_ORDER_INFO.uid
            ,T_B2B_ORDER_INFO.ouid
            ,T_B2B_ORDER_INFO.guid
            ,T_B2B_ORDER_INFO.option_title
            ,T_B2B_ORDER_INFO.option_num
            ,T_B2B_ORDER_INFO.option_type
            ,T_B2B_ORDER_INFO.placeholder
            ,T_B2B_ORDER_INFO.option_yn
            ,T_B2B_ORDER_INFO.apply_value
            ,T_B2B_ORDER_INFO.file_name
        )
        .filter(T_B2B_ORDER_INFO.ouid == uid, T_B2B_ORDER_INFO.guid == guid)
        .order_by(T_B2B_ORDER_INFO.option_num.asc())
    )

    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))
        rows.append(list)
    return rows

# outbound 등록 (token / jsondata)
def outbound_create(request: Request, goodsReadInput : GoodsReadInput):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user

    res = (
        db.query(T_OUTBOUND_DATA)
        .filter(
             T_OUTBOUND_DATA.user_uid == user.user_uid
            ,T_OUTBOUND_DATA.sosok_uid == user.sosok_uid
            ,T_OUTBOUND_DATA.token_name == user.token_name
        ).first()
    )

    if res is None :
        db_item = T_OUTBOUND_DATA (
            token_name = user.token_name
            ,user_uid = user.user_uid
            ,user_id = user.user_id
            ,sosok_uid = user.sosok_uid
            ,sosok_id = user.sosok_id
            ,jsondata = jsonable_encoder(goodsReadInput)
        )
        db.add(db_item)
        db.flush()

        create_log(request, db_item.uid, "T_OUTBOUND_DATA", "INSERT", "OUTBOUND 등록", 0, db_item.uid, user.user_id)
        request.state.inspect = frame()

    else :
        res.jsondata = jsonable_encoder(goodsReadInput)
        res.update_at = util.getNow()

def outbound_data_read(request: Request, user_uid:int, sosok_uid:int):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user

    sql = ( 
        db.query(
             T_OUTBOUND_DATA.uid
            ,T_OUTBOUND_DATA.token_name
            ,T_OUTBOUND_DATA.user_uid
            ,T_OUTBOUND_DATA.user_id
            ,T_OUTBOUND_DATA.sosok_uid
            ,T_OUTBOUND_DATA.sosok_id
            ,T_OUTBOUND_DATA.jsondata
            ,func.date_format(T_OUTBOUND_DATA.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_OUTBOUND_DATA.update_at, '%Y-%m-%d %T').label('update_at')
        )
        .filter(
            T_OUTBOUND_DATA.user_uid == user_uid
            ,T_OUTBOUND_DATA.sosok_uid == sosok_uid
        )
    )
    format_sql(sql)
    res = sql.first()

    if res != None :
        res = dict(zip(res.keys(), res))

    return res


def seller_staff_read(request: Request, seller_id:str):
    request.state.inspect = frame()
    db = request.state.db 
    user = request.state.user

    sql = ( 
        db.query(
             T_B2B_SELLER_STAFF.uid
            ,T_B2B_SELLER_STAFF.seller_uid
            ,T_B2B_SELLER_STAFF.seller_id
            ,T_B2B_SELLER_STAFF.mobile
            ,T_B2B_SELLER_STAFF.email
        )
        .filter(
            T_B2B_SELLER_STAFF.seller_id == seller_id
            ,T_B2B_SELLER_STAFF.delete_at == None
            ,func.json_contains(T_B2B_SELLER_STAFF.roles, f'[2]')
            # T_B2B_SELLER_STAFF.roles.like('%2%')
        )
    )
    format_sql(sql)
    
    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))
        rows.append(list)
    return rows