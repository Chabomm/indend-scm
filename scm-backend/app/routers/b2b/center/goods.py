from fastapi import APIRouter, Depends, Request, Body
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from inspect import currentframe as frame
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core import exceptions as ex
from app.core import util
from app.core.config import PROXY_PREFIX, api_same_origin
import json

from app.deps.auth import get_current_active_center
from app.schemas.auth import *

from app.schemas.b2b.front import *
from app.service.b2b.center import goods_service

router = APIRouter (
    prefix = PROXY_PREFIX, 
    tags=["/b2b/center/goods"],
)

def 상품조회_필터조건(request: Request):
    request.state.inspect = frame()

    result = {}
    result.update({"skeyword_type": [
        {"key": 'title', "text": '서비스명'},
        {"key": 'option_title', "text": '옵션명'},
        {"key": 'indend_md', "text": '담당MD명'},
    ]})

    # 진행상태
    result.update({"is_display": [
        {"key": '', "text": '전체'},
        {"key": 'T', "text": '판매중'},
        {"key": 'F', "text": '판매중지'},
    ]})
    
    return result

# /scm/b2b/center/goods/init
@router.post("/b2b/center/goods/init", dependencies=[Depends(api_same_origin)])
async def 상품조회_init (
    request: Request
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
        ,"filters": {
            "skeyword": '',
            "skeyword_type": '',
            "is_display": '',
            "create_at": {
                "startDate": None,
                "endDate": None,
            },
        }
    }
    result.update({"params": params})
    # [ S ] 초기 파라메터

    result.update({"filter": 상품조회_필터조건(request)}) # 초기 필터

    return result

# /scm/b2b/center/goods/list
@router.post("/b2b/center/goods/list", dependencies=[Depends(api_same_origin)])
async def 상품조회(
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

    res = goods_service.list(request, pPage_param)
    request.state.inspect = frame()

    return res

from io import BytesIO # Add to Top of File
import pandas as pd
import xlsxwriter
@router.post("/b2b/center/goods/xlsx", dependencies=[Depends(api_same_origin)])
async def 상품_엑셀_다운로드(
     request: Request
    ,pPage_param: PPage_param
    ,user: TokenDataCenter = Depends(get_current_active_center)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataCenter(user), getTokenDataCenter(user)

    print('pPage_param',pPage_param)
    res = goods_service.list(request,pPage_param,True)
    request.state.inspect = frame()

    output = BytesIO()

    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet()

    # [ S ] 엑셀헤더
    worksheet.write("A1", "번호")
    worksheet.write("B1", "상태")
    worksheet.write("C1", "서비스명")
    worksheet.write("D1", "옵션")
    worksheet.write("E1", "등록일")
    worksheet.write("F1", "담당MD")
    # [ E ] 엑셀헤더
    
        
    idx = 2
    for c in res["list"] :
        worksheet.write("A"+str(idx), c["uid"])
        worksheet.write("B"+str(idx), c["is_display"])
        worksheet.write("C"+str(idx), c["title"])
        worksheet.write("D"+str(idx), c["option_value"])
        worksheet.write("E"+str(idx), c["create_at"])
        worksheet.write("F"+str(idx), c["indend_md_name"])
        idx = idx + 1

    # format1 = workbook.add_format({"num_format": "#,##0.00"})
    # format2 = workbook.add_format({"num_format": "0%"})

    # worksheet.set_row(1, 30)
    worksheet.set_column('C:F', width=18, cell_format=None)


    workbook.close()
    output.seek(0)

    headers = {
        'Content-Disposition': 'attachment; filename="filename.xlsx"'
    }

    return StreamingResponse(output, headers=headers)
