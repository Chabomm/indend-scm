
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

from app.schemas.b2b.admin import *
from app.models.b2b.seller import *
from app.models.b2b.goods import *
from app.models.b2b.order import *
from app.service.b2b import admin_service
from app.service.log_service import *
from app.service import log_service
from app.core.database import format_sql

def option_list(request: Request, uid: int):
    request.state.inspect = frame()
    db = request.state.db
    
    sql = (
        db.query(
             T_B2B_GOODS_INFO.uid
            ,T_B2B_GOODS_INFO.guid
            ,T_B2B_GOODS_INFO.option_title
            ,T_B2B_GOODS_INFO.option_num
            ,T_B2B_GOODS_INFO.option_type
            ,T_B2B_GOODS_INFO.placeholder
            ,T_B2B_GOODS_INFO.option_yn
        )
        .filter(T_B2B_GOODS_INFO.guid == uid)
        .order_by(T_B2B_GOODS_INFO.option_num.asc())
    )

    # format_sql(sql)
    
    rows = []
    for c in sql.all():
        list = dict(zip(c.keys(), c))
        # if list["option_type"] == 'C' or list["option_type"] == 'D' :
        #     placeholder = list["placeholder"].split(',')
        #     placeholder.pop()
        #     list["placeholder"] = placeholder

        rows.append(list)

    return rows