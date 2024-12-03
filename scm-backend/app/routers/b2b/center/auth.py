from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Body
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from inspect import currentframe as frame
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core import exceptions as ex
from app.core import util
from app.core.config import PROXY_PREFIX, api_same_origin
import json

from app.deps.auth import create_access_token, get_current_active_center
from app.deps.auth import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_MINUTES

from app.models.session import *
from app.schemas.auth import *
from app.schemas.b2b.center.auth import *
from app.service.b2b.center import auth_service
from app.service import session_service, menu_service
from app.service.log_service import *

router = APIRouter (
    prefix = PROXY_PREFIX, 
    tags=["/b2b/center/auth"],
)

# /scm/b2b/center/auth/signin
@router.post("/b2b/center/auth/signin")
async def 고객사관리자_로그인(
    request: Request,
    response: Response,
    signin_request: SignInRequest = Body(
        ...,
        examples = {
            "example01" : {
                "summary": "uhjung@indend.co.kr",
                "description": "",
                "value": {
                    "seller_id" : "B2B1239",
                    "login_id" : "1239@indend.co.kr",
                    "user_pw" : "1239@indend.co.kr",
                    "auto_save" : ""
                }
            },
        }
    )
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    user = auth_service.signin_scm(request, signin_request)
    request.state.inspect = frame()

    if user is None :
        return ex.ReturnOK(404, "정보를 찾을 수 없습니다. 아이디와 비밀번호를 다시 확인해 주세요", request)
    
    token_data = TokenDataCenter(
         token_name = "SCM-B2B"
        ,seller_uid = user.seller_uid
        ,seller_id = user.seller_id
        ,seller_name = user.seller_name
        ,staff_uid = user.uid
        ,staff_id = user.user_id
        ,staff_name = user.name
        ,staff_depart = user.depart
        ,roles = user.roles
        ,access_token = ""
    )

    access_token = create_access_token(data=util.toJson(token_data), expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_access_token(data=util.toJson(token_data), expires_delta=timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES))

    session_param = T_SESSION (
         site_id = token_data.token_name
        ,user_uid = token_data.staff_uid
        ,user_id = token_data.staff_id
        ,access_token = access_token
        ,refresh_token = refresh_token
        ,ip = request.state.user_ip
    )

    token_data.access_token = access_token
    request.state.user = token_data

    session_service.create_session(request, session_param)
    request.state.inspect = frame()

    # 관리자 메뉴 가져오기
    res = menu_service.get_center_menus(request)
    request.state.inspect = frame()

    response = JSONResponse(
        ex.ReturnOK(200, "", request, {
            "access_token": access_token
            ,"token_type": "bearer"
            ,"center_menus": res["center_menus"]
        })
    )

    response.set_cookie( key=token_data.token_name, value=access_token )

    return response


def 로그_필터조건(request: Request):
    request.state.inspect = frame()

    result = {}
    result.update({"skeyword_type": [
        {"key": 'column_key', "text": 'column_key'},
    ]})
    
    return result

# /scm/b2b/center/auth/log/init
@router.post("/b2b/center/auth/log/init", dependencies=[Depends(api_same_origin)])
async def 상품조회_init (
    request: Request
    ,logListInput: LogListInput
    ,user: TokenDataOutbound = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    result = {}

    # [ S ] 초기 파라메터
    params = {
         "page" : 1
        ,"page_view_size": 30
        ,"page_size": 0
        ,"page_total": 0
        ,"page_last": 0
        ,"table_name": logListInput.table_name
        ,"table_uid": logListInput.table_uid
        ,"filters": {
            "skeyword": '',
            "skeyword_type": '',
            "create_at": {
                "startDate": None,
                "endDate": None,
            },
        }
    }
    result.update({"params": params})
    # [ S ] 초기 파라메터

    result.update({"filter": 로그_필터조건(request)}) # 초기 필터

    return result

# /scm/b2b/center/auth/log/list
@router.post("/b2b/center/auth/log/list", dependencies=[Depends(api_same_origin)])
async def 로그_리스트(
     request: Request
    ,logListInput: LogListInput
    ,user: TokenDataCenter = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    if not logListInput.page or int(logListInput.page) == 0:
        logListInput.page = 1

    if not logListInput.page_view_size or int(logListInput.page_view_size) == 0 :
        logListInput.page_view_size = 30

    table_name = ''
    if logListInput.table_name == 'ACCOUNT' :
        table_name = ['T_B2B_ORDER_ACCOUNT', 'T_B2B_ORDER_CANCEL', 'T_B2B_ORDER_GAGAM']
    else : 
        table_name = [logListInput.table_name]

    res = auth_service.log_list(request, table_name, logListInput) 
    request.state.inspect = frame()
    
    return res

# /scm/b2b/center/auth/memo/create
@router.post("/b2b/center/auth/memo/create", dependencies=[Depends(api_same_origin)])
async def 메모_등록(
     request:Request
    ,memoInput: MemoInput
    ,user: TokenDataOutbound = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    create_memo(request, memoInput.table_uid, memoInput.table_name, memoInput.memo, user.staff_id, user.token_name, user.seller_id, user.seller_uid, memoInput.file_url, memoInput.file_name)
    request.state.inspect = frame()

    return ex.ReturnOK(200, "메모 등록이 완료되었습니다.", request)