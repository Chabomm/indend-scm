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

from app.schemas.b2b.front import *
from app.service.b2b.center import order_service

router = APIRouter (
    prefix = PROXY_PREFIX, 
    tags=["/b2b/center/order"],
)

def 상담내역_필터조건(request: Request, type:str):
    request.state.inspect = frame()

    result = {}

    if type == 'read' :
        result.update({"state": [
            {"key": '신규상담', "text": '신규상담'},
            {"key": '상담중', "text": '상담중'},
            {"key": '진행보류', "text": '진행보류'},
            {"key": '계약미진행', "text": '계약미진행'},
            {"key": '계약진행', "text": '계약진행'},
        ]})
    else :
        result.update({"skeyword_type": [
            {"key": 'apply_company', "text": '기업명'},
            {"key": 'apply_name', "text": '상담자명'},
            {"key": 'title', "text": '서비스명'},
        ]})
        result.update({"state": [
            {"key": '', "text": '전체'},
            {"key": '신규상담', "text": '신규상담'},
            {"key": '상담중', "text": '상담중'},
            {"key": '진행보류', "text": '진행보류'},
            {"key": '계약미진행', "text": '계약미진행'},
            {"key": '계약진행', "text": '계약진행'},
        ]})
    
    return result

# /scm/b2b/center/order/consult/init
@router.post("/b2b/center/order/consult/init", dependencies=[Depends(api_same_origin)])
async def 상담내역_init(
     request: Request
    ,user: TokenDataCenter = Depends(get_current_active_center)
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
        ,"filters": {
            "skeyword": '',
            "skeyword_type": '',
            "state": '',
            "create_at": {
                "startDate": None,
                "endDate": None,
            },
        }
    }
    result.update({"params": params})
    # [ S ] 초기 파라메터

    result.update({"filter": 상담내역_필터조건(request, 'list')}) # 초기 필터

    return result

# /scm/b2b/center/order/consult/list
@router.post("/b2b/center/order/consult/list", dependencies=[Depends(api_same_origin)])
async def 상담내역(
     request: Request
    ,pPage_param: PPage_param
    ,user: TokenDataCenter = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    if not pPage_param.page or int(pPage_param.page) == 0:
        pPage_param.page = 1

    if not pPage_param.page_view_size or int(pPage_param.page_view_size) == 0:
        pPage_param.page_view_size = 30

    res = order_service.consult_list(request, pPage_param)
    request.state.inspect = frame()

    return res

# /scm/b2b/center/order/consult/read
@router.post("/b2b/center/order/consult/read", dependencies=[Depends(api_same_origin)])
async def 상담내역_상세(
    request: Request
    ,pRead : PRead
    ,user: TokenDataOutbound = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    if pRead.uid == 0 :
        return ex.ReturnOK(404, "상담내역을 찾을 수 없습니다.", request)
    else :
        res = order_service.consult_read(request, pRead.uid)
        request.state.inspect = frame()
    
    values = jsonable_encoder(parse_obj_as(OrderConsultInput, res))

    values_memo = {
         "table_uid" : res["uid"]
        ,"memo" : ''
        ,"file_url" : ''
        ,"file_name" : ''
    }
        
    jsondata = {}
    jsondata.update({"values": values})
    jsondata.update({"values_memo": values_memo})
    jsondata.update({"filter": 상담내역_필터조건(request, 'read')})
    jsondata.update(res)


    return ex.ReturnOK(200, "", request, jsondata)

# scm/b2b/center/order/consult/edit
@router.post("/b2b/center/order/consult/edit", dependencies=[Depends(api_same_origin)])
async def 상담내역_편집(
     request:Request
    ,orderConsultInput: OrderConsultInput
    ,user: TokenDataOutbound = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    res = order_service.consult_update(request, orderConsultInput)
    request.state.inspect = frame()
    if res is None :
        return ex.ReturnOK(404, "죄송합니다. 오류가 발생 하였습니다. 문제 지속시 개발자에게 접수 바랍니다.", request)
        

    if orderConsultInput.state == '계약진행' :
        contract = order_service.contract_create(request, orderConsultInput)
        request.state.inspect = frame()
        return ex.ReturnOK(200, "저장이 완료되었습니다.", request, {"uid":contract.ouid,"state":contract.cont_state})
    
    return ex.ReturnOK(200, "저장이 완료되었습니다.", request, {"uid":res.uid,"state":res.state})


def 계약내역_필터조건(request: Request, type:str):
    request.state.inspect = frame()

    result = {}
    if type == 'read' :
        result.update({"cont_state": [
            {"key": '임시저장(계약진행중)', "text": '임시저장(계약진행중)'},
            {"key": '계약완료(정산대기)', "text": '계약완료(정산대기)'},
        ]})
    else :
        result.update({"skeyword_type": [
            {"key": 'apply_company', "text": '기업명'},
            {"key": 'apply_name', "text": '상담자명'},
            {"key": 'title', "text": '서비스명'},
        ]})
        result.update({"cont_state": [
            {"key": '', "text": '전체'},
            {"key": '임시저장(계약진행중)', "text": '임시저장(계약진행중)'},
            {"key": '계약완료(정산대기)', "text": '계약완료(정산대기)'},
        ]})
    
    return result

# /scm/b2b/center/order/contract/init
@router.post("/b2b/center/order/contract/init", dependencies=[Depends(api_same_origin)])
async def 계약내역_init(
     request: Request
    ,user: TokenDataCenter = Depends(get_current_active_center)
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
        ,"filters": {
            "skeyword": '',
            "skeyword_type": '',
            "cont_state": '',
            "create_at": {
                "startDate": None,
                "endDate": None,
            },
        }
    }
    result.update({"params": params})
    # [ S ] 초기 파라메터

    result.update({"filter": 계약내역_필터조건(request, 'list')}) # 초기 필터

    return result

# /scm/b2b/center/order/contract/list
@router.post("/b2b/center/order/contract/list", dependencies=[Depends(api_same_origin)])
async def 계약내역(
     request: Request
    ,pPage_param: PPage_param
    ,user: TokenDataCenter = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    if not pPage_param.page or int(pPage_param.page) == 0:
        pPage_param.page = 1

    if not pPage_param.page_view_size or int(pPage_param.page_view_size) == 0:
        pPage_param.page_view_size = 30

    res = order_service.contract_list(request, pPage_param)
    request.state.inspect = frame()

    return res

# /scm/b2b/center/order/contract/read
@router.post("/b2b/center/order/contract/read", dependencies=[Depends(api_same_origin)])
async def 계약내역_상세(
    request: Request
    ,pRead : PRead
    ,user: TokenDataOutbound = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    res = order_service.contract_read(request, pRead.uid)
    request.state.inspect = frame()

    if res is None :
        return ex.ReturnOK(404, "계약내역을 찾을 수 없습니다.", request)
    
    values = jsonable_encoder(parse_obj_as(OrderContractInput, res))

    values_memo = {
         "table_uid" : res["ouid"]
        ,"memo" : ''
        ,"file_url" : ''
        ,"file_name" : ''
    }

    jsondata = {}
    jsondata.update({"values": values})
    jsondata.update({"values_memo": values_memo})
    jsondata.update({"filter": 계약내역_필터조건(request, 'read')})
    jsondata.update(res)

    return ex.ReturnOK(200, "", request, jsondata)

# scm/b2b/center/order/contract/edit
@router.post("/b2b/center/order/contract/edit", dependencies=[Depends(api_same_origin)])
async def 계약내역_편집(
     request:Request
    ,orderContractInput: OrderContractInput
    ,user: TokenDataOutbound = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    res = order_service.contract_update(request, orderContractInput)
    request.state.inspect = frame()
    if res is None :
        return ex.ReturnOK(404, "죄송합니다. 오류가 발생 하였습니다. 문제 지속시 개발자에게 접수 바랍니다.", request)

    if orderContractInput.cont_state == '계약완료(정산대기)' :
        account = order_service.account_create(request, orderContractInput)
        request.state.inspect = frame()
        return ex.ReturnOK(200, "저장이 완료되었습니다.", request, {"uid":account.ouid,"state":account.account_state})
    

    return ex.ReturnOK(200, "저장이 완료되었습니다.", request, {"uid":res.ouid, "state":res.cont_state})

def 정산내역_필터조건(request: Request, type:str):
    request.state.inspect = frame()

    result = {}
    if type == 'read' :
        result.update({"account_state": [
            {"key": '정산대기', "text": '정산대기'},
            {"key": '정산진행중', "text": '정산진행중'},
            {"key": '전체취소', "text": '전체취소'},
            {"key": '부분취소', "text": '부분취소'},
            {"key": '전체환불신청', "text": '전체환불신청'},
            {"key": '부분환불신청', "text": '부분환불신청'},
            {"key": '환불대기', "text": '환불대기'},
            {"key": '환불완료', "text": '환불완료'},
            {"key": '정산완료', "text": '정산완료'},
            {"key": '가감처리', "text": '가감처리'},
        ]})
    else :
        result.update({"skeyword_type": [
            {"key": 'apply_company', "text": '기업명'},
            {"key": 'apply_name', "text": '상담자명'},
            {"key": 'title', "text": '서비스명'},
        ]})
        result.update({"account_state": [
            {"key": '', "text": '전체'},
            {"key": '정산대기', "text": '정산대기'},
            {"key": '정산진행중', "text": '정산진행중'},
            {"key": '전체취소', "text": '전체취소'},
            {"key": '부분취소', "text": '부분취소'},
            {"key": '전체환불신청', "text": '전체환불신청'},
            {"key": '부분환불신청', "text": '부분환불신청'},
            {"key": '환불대기', "text": '환불대기'},
            {"key": '환불완료', "text": '환불완료'},
            {"key": '정산완료', "text": '정산완료'},
        ]})
    
    return result

# /scm/b2b/center/order/account/init
@router.post("/b2b/center/order/account/init", dependencies=[Depends(api_same_origin)])
async def 정산내역_init(
     request: Request
    ,user: TokenDataCenter = Depends(get_current_active_center)
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
        ,"filters": {
            "skeyword": '',
            "skeyword_type": '',
            "account_state": '',
            "create_at": {
                "startDate": None,
                "endDate": None,
            },
            "account_at": {
                "startDate": None,
                "endDate": None,
            },
        }
    }
    result.update({"params": params})
    # [ S ] 초기 파라메터

    result.update({"filter": 정산내역_필터조건(request, 'list')}) # 초기 필터

    return result

# /scm/b2b/center/order/account/list
@router.post("/b2b/center/order/account/list", dependencies=[Depends(api_same_origin)])
async def 정산내역(
     request: Request
    ,pPage_param: PPage_param
    ,user: TokenDataCenter = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    if not pPage_param.page or int(pPage_param.page) == 0:
        pPage_param.page = 1

    if not pPage_param.page_view_size or int(pPage_param.page_view_size) == 0:
        pPage_param.page_view_size = 30

    res = order_service.account_list(request, pPage_param)
    request.state.inspect = frame()

    return res

# /scm/b2b/center/order/account/read
@router.post("/b2b/center/order/account/read", dependencies=[Depends(api_same_origin)])
async def 정산내역_상세(
    request: Request
    ,pRead : PRead
    ,user: TokenDataOutbound = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    result = {}
    res = order_service.account_read(request, pRead.uid)

    if res is None :
        return ex.ReturnOK(404, "정산내역을 찾을 수 없습니다.", request)

    values = jsonable_encoder(parse_obj_as(CancleInput, res))

    values_memo = {
         "table_uid" : res["ouid"]
        ,"memo" : ''
        ,"file_url" : ''
        ,"file_name" : ''
    }

    result.update({"values": values})
    result.update({"filter": 정산내역_필터조건(request, 'read')})
    result.update({"values_memo": values_memo})
    result.update(res)

    return result

# scm/b2b/center/order/account/cancle
@router.post("/b2b/center/order/account/cancle", dependencies=[Depends(api_same_origin)])
async def 정산내역_취소요청(
     request:Request
    ,cancleInput: CancleInput
    ,user: TokenDataOutbound = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    cancle = order_service.cancle_create(request, cancleInput)
    request.state.inspect = frame()

    return ex.ReturnOK(200, "저장이 완료되었습니다.", request, {"uid":cancle.uid})
