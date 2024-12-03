# adm.dreamy.kr 상품,판매자,주문,정산 관리

from fastapi import APIRouter, Depends, Request, Body
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from inspect import currentframe as frame
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core import exceptions as ex
from app.core import util
from app.core.config import PROXY_PREFIX, api_same_origin
import json

from app.deps.auth import get_current_active_outbound
from app.schemas.auth import *

from app.service.b2b import admin_service
from app.schemas.b2b.admin import *
from app.service.log_service import *

router = APIRouter (
    prefix = PROXY_PREFIX, 
    tags=["/b2b/admin"],
)