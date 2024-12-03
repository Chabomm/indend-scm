import json
import requests
import string
import random
import os

from fastapi import APIRouter, Depends, Request, Body
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from inspect import currentframe as frame

from app.core import exceptions as ex
from app.core import util
from app.core.config import PROXY_PREFIX, api_same_origin
from app.deps.auth import get_current_active_outbound

from app.schemas.auth import *
from app.schemas.schema import *
from app.schemas.dream import *
from app.service import log_service
from app.service.entry.dream import admin_service, front_service

router = APIRouter (
    prefix = PROXY_PREFIX, 
    tags=["/entry/dream/admin"],
)



# [ S ] 복지드림 구축

# /scm/entry/dream/admin/build_edit
@router.post("/entry/dream/admin/build_edit", dependencies=[Depends(api_same_origin)])
async def 복지드림_구축신청_편집(
     request:Request
    ,dreamBuild: DreamBuild
    ,user: TokenDataOutbound = Depends(get_current_active_outbound)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataOutbound(user), getTokenDataOutbound(user)

    # 등록
    res = front_service.build_create(request, dreamBuild)
    request.state.inspect = frame()
    if res is None :
        return ex.ReturnOK(500, "구축신청서 등록에 실패했습니다.", request)

    return ex.ReturnOK(200, "구축신청서 등록이 완료되었습니다.", request, {"uid":res.uid})
    