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
from fastapi.encoders import jsonable_encoder
from pydantic.tools import parse_obj_as

from app.deps.auth import get_current_active_center
from app.schemas.auth import *
from app.schemas.b2b.center.order import *
from app.service.log_service import *

from app.schemas.b2b.center.info import *
from app.service.b2b.center import info_service

router = APIRouter (
    prefix = PROXY_PREFIX, 
    tags=["/b2b/center/info"],
)

# /scm/b2b/center/info/staff/read
@router.post("/b2b/center/info/staff/read", dependencies=[Depends(api_same_origin)])
async def 계정관리_상세 (
    request: Request
    ,user: TokenDataCenter = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    res = info_service.staff_read(request)
    request.state.inspect = frame()

    if res is None :
        return ex.ReturnOK(404, "정보를 찾을 수 없습니다. 다시 확인 후 시도해주세요", request)
    
    values = jsonable_encoder(parse_obj_as(StaffInfoInput, res))
    values["login_pw"] = ""

    jsondata = {}
    jsondata.update({"values": values})
    jsondata.update({"filter": {}})
    jsondata.update(res)
        
    return ex.ReturnOK(200, "", request, jsondata)


# /scm/b2b/center/info/staff/edit
@router.post("/b2b/center/info/staff/edit", response_model_exclude_none=True, dependencies=[Depends(api_same_origin)])
async def 계정관리_편집 (
    request: Request
    ,staffInfoInput : StaffInfoInput
    ,user: TokenDataCenter = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    res = info_service.staff_update(request, staffInfoInput)
    request.state.inspect = frame()

    if res is None :
        return ex.ReturnOK(404, "정보를 찾을 수 없습니다. 다시 확인 후 시도해주세요", request)

    return ex.ReturnOK(200, "저장이 완료되었습니다.", request, {"uid":res.uid})

    

# /scm/b2b/center/info/seller/read
@router.post("/b2b/center/info/seller/read", dependencies=[Depends(api_same_origin)])
async def 계정관리_상세 (
    request: Request
    ,user: TokenDataCenter = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    res = info_service.seller_read(request)
    request.state.inspect = frame()

    if res is None :
        return ex.ReturnOK(404, "정보를 찾을 수 없습니다. 다시 확인 후 시도해주세요", request)

    jsondata = {}
    jsondata.update({"filter": {}})
    jsondata.update(res)
        
    return ex.ReturnOK(200, "", request, jsondata)
