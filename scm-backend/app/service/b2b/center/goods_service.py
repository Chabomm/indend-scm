
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from inspect import currentframe as frame
from sqlalchemy.dialects import mysql as mysql_dialetct
from pymysql.converters import conversions, escape_item, encoders
from sqlalchemy import func, select, update, delete, Table, MetaData, and_, case
import math

from app.core import exceptions as ex
from app.core import util
from app.deps import auth


from app.schemas.schema import *
from app.models.b2b.goods import *
from app.models.b2b.seller import *

from app.core.database import format_sql



# 상품리스트
def list(request: Request, pPage_param: PPage_param, fullsearch:bool=False):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    seller_stmt = (
        db.query(
             T_B2B_SELLER.uid.label('seller_uid')
            ,T_B2B_SELLER.seller_id
            ,T_B2B_SELLER.seller_name
            ,T_B2B_SELLER.indend_md
            ,T_B2B_SELLER.indend_md_name
        )
        .subquery()
    )
    
        
    offsets = 0
    if fullsearch == False :
        offsets = (pPage_param.page-1)*pPage_param.page_view_size

    limits = None
    if fullsearch == False :
        limits = pPage_param.page_view_size
    
    filters = []
    filters.append(getattr(T_B2B_GOODS, "seller_id") == user.seller_id)
    filters.append(getattr(T_B2B_GOODS, "delete_at") == None)

    
    if pPage_param.filters :
        if pPage_param.filters["skeyword"] :
            if pPage_param.filters["skeyword_type"] != "" :
                if pPage_param.filters["skeyword_type"] == "indend_md_name" :
                    filters.append(seller_stmt.c.indend_md_name.like("%"+pPage_param.filters["skeyword"]+"%"))
                else :
                    filters.append(getattr(T_B2B_GOODS, pPage_param.filters["skeyword_type"]).like("%"+pPage_param.filters["skeyword"]   +"%"))
            else : 
                filters.append(
                    T_B2B_GOODS.title.like("%"+pPage_param.filters["skeyword"]+"%") 
                    | T_B2B_GOODS.option_value.like("%"+pPage_param.filters["skeyword"]+"%") 
                    | seller_stmt.c.indend_md_name.like("%"+pPage_param.filters["skeyword"]+"%") 
                )

        if pPage_param.filters["create_at"]["startDate"] and pPage_param.filters["create_at"]["endDate"] :
            filters.append(
                and_(
                    T_B2B_GOODS.create_at >= pPage_param.filters["create_at"]["startDate"]
                    ,T_B2B_GOODS.create_at <= pPage_param.filters["create_at"]["endDate"] + " 23:59:59"
                )
            )
        if pPage_param.filters["is_display"] != '' :
            filters.append(getattr(T_B2B_GOODS, "is_display") == pPage_param.filters["is_display"])

    sql = (
        db.query(
             T_B2B_GOODS.uid
            ,T_B2B_GOODS.category
            ,T_B2B_GOODS.title
            ,T_B2B_GOODS.keyword
            ,T_B2B_GOODS.thumb
            ,T_B2B_GOODS.service_type
            ,T_B2B_GOODS.option_value
            ,T_B2B_GOODS.is_display
            ,func.date_format(T_B2B_GOODS.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_GOODS.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_GOODS.delete_at, '%Y-%m-%d %T').label('delete_at')
            ,seller_stmt.c.indend_md_name
        )
        .join(
            seller_stmt, 
            T_B2B_GOODS.seller_id == seller_stmt.c.seller_id,
            isouter = True 
        )
        .filter(*filters)
        .order_by(T_B2B_GOODS.sort.asc(), T_B2B_GOODS.uid.desc())
        # .offset((pPage_param.page-1)*pPage_param.page_view_size)
        # .limit(pPage_param.page_view_size)
        .offset(offsets)
        .limit(limits)
    )


    format_sql(sql)

    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))
        if list["keyword"] != '' and list["keyword"] != None :
            keyword = list["keyword"].split(',')
            list["keyword"] = keyword

        rows.append(list)

    jsondata = {}
    if fullsearch == False :
        # [ S ] 페이징 처리
        pPage_param.page_total = (
            db.query(T_B2B_GOODS)
            .join(
                seller_stmt, 
                T_B2B_GOODS.seller_id == seller_stmt.c.seller_id,
                isouter = True 
            )
            .filter(*filters)
            .count()
        )
        pPage_param.page_last = math.ceil(
            pPage_param.page_total / pPage_param.page_view_size)
        pPage_param.page_size = len(rows)  # 현재 페이지에 검색된 수
        # [ E ] 페이징 처리

        jsondata.update({"params" : pPage_param})
        
    jsondata.update({"list": rows})

    return jsondata




# 상품 엑셀 리스트
def excel_list(request: Request):
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    seller_stmt = (
        db.query(
             T_B2B_SELLER.uid.label('seller_uid')
            ,T_B2B_SELLER.seller_id
            ,T_B2B_SELLER.seller_name
            ,T_B2B_SELLER.indend_md
            ,T_B2B_SELLER.indend_md_name
        )
        .subquery()
    )
    
    filters = []
    filters.append(getattr(T_B2B_GOODS, "seller_id") == user.seller_id)
    filters.append(getattr(T_B2B_GOODS, "delete_at") == None)

    
    sql = (
        db.query(
             T_B2B_GOODS.uid
            ,T_B2B_GOODS.category
            ,T_B2B_GOODS.title
            ,T_B2B_GOODS.keyword
            ,T_B2B_GOODS.thumb
            ,T_B2B_GOODS.service_type
            ,T_B2B_GOODS.option_value
            ,case(
                [
                    (T_B2B_GOODS.is_display == 'T', "판매중")
                    ,(T_B2B_GOODS.is_display == 'F', "판매중지")
                ], else_ = "판매중지"
            ).label('is_display')
            ,func.date_format(T_B2B_GOODS.create_at, '%Y-%m-%d %T').label('create_at')
            ,func.date_format(T_B2B_GOODS.update_at, '%Y-%m-%d %T').label('update_at')
            ,func.date_format(T_B2B_GOODS.delete_at, '%Y-%m-%d %T').label('delete_at')
            ,seller_stmt.c.indend_md_name
        )
        .join(
            seller_stmt, 
            T_B2B_GOODS.seller_id == seller_stmt.c.seller_id,
            isouter = True 
        )
        .filter(*filters)
        .order_by(T_B2B_GOODS.sort.asc(), T_B2B_GOODS.uid.desc())
    )

    format_sql(sql)

    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))
        if list["keyword"] != '' and list["keyword"] != None :
            keyword = list["keyword"].split(',')
            list["keyword"] = keyword

        rows.append(list)

    jsondata = {}
    jsondata.update({"list": rows})

    return jsondata


