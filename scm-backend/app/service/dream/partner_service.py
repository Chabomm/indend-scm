
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from inspect import currentframe as frame
from sqlalchemy.dialects import mysql as mysql_dialetct
from pymysql.converters import conversions, escape_item, encoders
from sqlalchemy import func, select, update, delete, Table, MetaData
import math

from app.core import exceptions as ex
from app.core import util
from app.core.database import format_sql
from app.schemas.schema import *

from app.models.dream.partner import *

# 고객사 정보 where partner_id, 아이디 중복검사에 사용
def read_partner_info(request: Request, partner_id: str):
    request.state.inspect = frame()
    db_dream = request.state.db_dream
    filters = []
    filters.append(getattr(T_PARTNER, "partner_id") == partner_id)
    sql = db_dream.query(T_PARTNER.uid).filter(*filters)
    return sql.first()
