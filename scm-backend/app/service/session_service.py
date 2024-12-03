
from fastapi import Request
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from inspect import currentframe as frame
from sqlalchemy.dialects import mysql as mysql_dialetct
from pymysql.converters import conversions, escape_item, encoders
from sqlalchemy import func, select, update, delete, Table, MetaData
import math

from app.models.session import *
# from app.models.menu import *
# from app.models.partner import *
from app.schemas.schema import *
from app.core import util
from app.core.database import format_sql
from app.deps import auth

# 세선 select
def read_session(request: Request, session_uid: Optional[int] = None, access_token: Optional[str] = None):
    request.state.inspect = frame()
    db = request.state.db 

    filters = []
    if session_uid is not None and session_uid > 0 :
        filters.append(getattr(T_SESSION, "uid") == session_uid)
    elif access_token is not None and access_token != "" :
        filters.append(getattr(T_SESSION, "access_token") == access_token)

    if len(filters) == 0 :
        return None

    sql = db.query(T_SESSION).filter(*filters)
    return sql.first()

# 세션 insert
def create_session(request: Request, session_param: T_SESSION):
    request.state.inspect = frame()
    db = request.state.db 

    delete_session(request, session_param.user_uid)
    
    db_item = session_param 
    db.add(db_item)
    db.flush()
    return db_item

# 세션 delete
def delete_session(request: Request, user_uid: int):
    request.state.inspect = frame()
    db = request.state.db 
    return db.query(T_SESSION).filter(T_SESSION.user_uid == user_uid).delete()
