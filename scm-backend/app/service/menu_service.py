from fastapi import Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from inspect import currentframe as frame
from sqlalchemy.dialects import mysql as mysql_dialetct
from pymysql.converters import conversions, escape_item, encoders
from sqlalchemy import func, select, update, delete, Table, MetaData
import math
from app.schemas.schema import *

from app.core import util
from app.core.database import format_sql

from app.models.menu import *


# 메뉴 select
def get_center_menus(request: Request) :
    request.state.inspect = frame()
    db = request.state.db
    user = request.state.user

    filters = []
    filters.append(getattr(T_SCM_MENU, "site_id") == user.token_name)
        
    parent_sql = (
        db.query(
             T_SCM_MENU.uid
            ,T_SCM_MENU.name
            ,T_SCM_MENU.to
            ,T_SCM_MENU.sort
            ,T_SCM_MENU.parent
        )
        .filter(*filters)
        .order_by(T_SCM_MENU.sort.asc())
    )
    format_sql(parent_sql)

    depth1s = []
    for c in parent_sql.all() :
        is_due = False # 중복이 안된다고 가정
        for d1 in depth1s :
            if d1 == c.parent :
                is_due =  True # 이미 추가된 1depth 메뉴
        if not is_due :
            depth1s.append(c.parent)

    child_sql = ( # 1depth menu
        db.query(
             T_SCM_MENU.uid
            ,T_SCM_MENU.name
            ,T_SCM_MENU.icon
            ,T_SCM_MENU.sort
        )
        .filter(T_SCM_MENU.uid.in_(depth1s))
        .order_by(T_SCM_MENU.sort.asc())
    )
    format_sql(child_sql)
    
    rows = []
    for c in child_sql.all():
        column_json = dict(zip(c.keys(), c))

        column_json["children"] = []

        for cc in parent_sql.all():
            if cc.parent == c.uid :
                d2_json = dict(zip(cc.keys(), cc))
                column_json["children"].append(d2_json)


        rows.append(column_json)
    
    
    jsondata = {}
    jsondata.update({"center_menus": rows})

    return jsondata