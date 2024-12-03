# manager 가 될수도 있고 seller가 될수도
# 서비스(상품) 리스트, 상세, 신청 등 수행
from fastapi import APIRouter, Depends, Request, Body, Response
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
import requests
import os
from urllib import parse

from app.deps.auth import get_current_active_outbound, get_current_user_outbound
from app.schemas.auth import *

from app.schemas.b2b.front import *
from app.service.b2b import front_service

router = APIRouter (
    prefix = PROXY_PREFIX, 
    tags=["/b2b/front"],
)

# /scm/b2b/front/order/create
@router.post("/b2b/front/order/create", dependencies=[Depends(api_same_origin)])
async def 서비스_신청_등록(
     request:Request
    ,b2BOrderInput: B2BOrderInput
    ,user: TokenDataOutbound = Depends(get_current_active_outbound)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataOutbound(user), getTokenDataOutbound(user)

    order = front_service.order_create(request, b2BOrderInput)
    request.state.inspect = frame()

    URL = "http://0.0.0.0:5000/ums/send"
    headers = {
        'Content-Type': 'application/json; charset=utf-8'
        ,'x-user-ip': request.state.user_ip
    }

    # [ S ] 구매자 ums 전송
    order_detail_url = ""
    if b2BOrderInput.token_name == "DREAM-MANAGER" :
        if os.environ.get('PROFILE') == 'development' :
            order_detail_url = "http://localhost:8010/b2b/order/popup/detail?uid=" + str(order.uid)
        elif os.environ.get('PROFILE') == 'production' :
            order_detail_url = "https://"+ b2BOrderInput.sosok_id +".dreamy.kr/b2b/order/popup/detail?uid=" + str(order.uid)

    elif b2BOrderInput.token_name == "SCM-SELLER" :
        if os.environ.get('PROFILE') == 'development' :
            order_detail_url = ""
        elif os.environ.get('PROFILE') == 'production' :
            order_detail_url = ""
    

    # [ S ] 구매자 상담내용
    table_html = []
    table_html.append('<table class="" cellspacing="0">')
    table_html.append('    <colgroup>')
    table_html.append('        <col style="width:200px;">')
    table_html.append('        <col />')
    table_html.append('    </colgroup>')
    table_html.append('    <tbody>')

    table_html.append('        <tr>')
    table_html.append('            <th style="background-color:#f1f1f1;border:1px solid #9e9e9e; text-align:center; border-collapse: collapse;">')
    table_html.append('                상담 신청 서비스명')
    table_html.append('            </th>')
    table_html.append('            <td style="border:1px solid #9e9e9e; border-collapse: collapse; text-align:center;">')
    table_html.append(                 b2BOrderInput.title);
    table_html.append('            </td>')
    table_html.append('        </tr>')

    table_html.append('        <tr>')
    table_html.append('            <th style="background-color:#f1f1f1;border:1px solid #9e9e9e; text-align:center; border-collapse: collapse;">')
    table_html.append('                상담 신청 기업명')
    table_html.append('            </th>')
    table_html.append('            <td style="border:1px solid #9e9e9e; border-collapse: collapse; text-align:center;">')
    table_html.append(                 b2BOrderInput.seller_name);
    table_html.append('            </td>')
    table_html.append('        </tr>')

    table_html.append('        <tr>')
    table_html.append('            <th style="background-color:#f1f1f1;border:1px solid #9e9e9e; text-align:center; border-collapse: collapse;">')
    table_html.append('                신청 내역 확인 URL')
    table_html.append('            </th>')
    table_html.append('            <td style="border:1px solid #9e9e9e; border-collapse: collapse; text-align:center;">')
    table_html.append(                 order_detail_url);
    table_html.append('            </td>')
    table_html.append('        </tr>')

    table_html.append('    </tbody>')
    table_html.append('</table>')
    # [ E ] 구매자 상담내용

    params = json.dumps(jsonable_encoder({
        "ums_uid": 11,
        "send_list": [
            {
                "ums_type": "email"
                ,"msgId": util.getNow("%Y%m%d%H%M%S")
                ,"toEmail": b2BOrderInput.apply_email
                ,"#{메뉴명}": "고객사혜택" if b2BOrderInput.service_type == "C" else "드림클럽"
                ,"#{상담내용}": ''.join(table_html)
            }
        ]
    }))
    
    try : 
        result = requests.post(URL, headers=headers, data=params, timeout=1).text
        response = json.loads(result)

    except Exception as e:
        print(str(e))
    # [ E ] 구매자 ums 전송

    # [ S ] 판매자 ums 전송
    order_detail_url = ""
    if b2BOrderInput.token_name == "DREAM-MANAGER" :
        if os.environ.get('PROFILE') == 'development' :
            order_detail_url = "http://localhost:13000"
        elif os.environ.get('PROFILE') == 'production' :
            order_detail_url = "https://"

    elif b2BOrderInput.token_name == "SCM-SELLER" :
        if os.environ.get('PROFILE') == 'development' :
            order_detail_url = ""
        elif os.environ.get('PROFILE') == 'production' :
            order_detail_url = ""

    # [ S ] 판매자 상담내용
    table_html = []
    table_html.append('<table class="" cellspacing="0">')
    table_html.append('    <colgroup>')
    table_html.append('        <col style="width:200px;">')
    table_html.append('        <col />')
    table_html.append('    </colgroup>')
    table_html.append('    <tbody>')

    table_html.append('        <tr>')
    table_html.append('            <th style="background-color:#f1f1f1;border:1px solid #9e9e9e; text-align:center; border-collapse: collapse;">')
    table_html.append('                상담 신청 서비스명')
    table_html.append('            </th>')
    table_html.append('            <td style="border:1px solid #9e9e9e; border-collapse: collapse; text-align:center;">')
    table_html.append(                 b2BOrderInput.title);
    table_html.append('            </td>')
    table_html.append('        </tr>')

    table_html.append('        <tr>')
    table_html.append('            <th style="background-color:#f1f1f1;border:1px solid #9e9e9e; text-align:center; border-collapse: collapse;">')
    table_html.append('                상담 신청 기업명')
    table_html.append('            </th>')
    table_html.append('            <td style="border:1px solid #9e9e9e; border-collapse: collapse; text-align:center;">')
    table_html.append(                 b2BOrderInput.apply_company);
    table_html.append('            </td>')
    table_html.append('        </tr>')

    table_html.append('        <tr>')
    table_html.append('            <th style="background-color:#f1f1f1;border:1px solid #9e9e9e; text-align:center; border-collapse: collapse;">')
    table_html.append('                B2B 제휴사 판매자센터 URL')
    table_html.append('            </th>')
    table_html.append('            <td style="border:1px solid #9e9e9e; border-collapse: collapse; text-align:center;">')
    table_html.append(                 order_detail_url);
    table_html.append('            </td>')
    table_html.append('        </tr>')

    table_html.append('    </tbody>')
    table_html.append('</table>')
    # [ E ] 판매자 상담내용

    seller_staff = front_service.seller_staff_read(request, b2BOrderInput.seller_id)
    request.state.inspect = frame()

    send_list = []
    for c in seller_staff:
        send_list.append({
            "ums_type": "email"
            ,"msgId": util.getNow("%Y%m%d%H%M%S")
            ,"toEmail": c["email"]
            ,"#{제휴사업체명}": b2BOrderInput.apply_company
            ,"#{상담내용}": ''.join(table_html)
        })

    params = json.dumps(jsonable_encoder({
        "ums_uid": 12,
        "send_list": send_list
    }))

    try : 
        result = requests.post(URL, headers=headers, data=params, timeout=1).text
        response = json.loads(result)
        print('판매자 result', response)

    except Exception as e:
        print(str(e))
    # [ E ] 판매자 ums 전송

    return ex.ReturnOK(200, "신청이 완료되었습니다.", request, {"uid":order.uid}, False)

# /scm/b2b/front/goods/read
@router.post("/b2b/front/goods/read", dependencies=[Depends(api_same_origin)])
async def B2B_상품_상세( # INBOND
     request: Request
    ,response: Response
    ,goodsReadInput : GoodsReadInput
    ,user: TokenDataOutbound = Depends(get_current_active_outbound)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataOutbound(user), getTokenDataOutbound(user)

    goods = front_service.goods_read(request, goodsReadInput.guid)
    request.state.inspect = frame()

    if goods is None :
        return ex.ReturnOK(404, "정보를 찾을 수 없습니다. 다시 확인 후 시도해주세요", request)

    if goodsReadInput.method == "POST" :
        if goodsReadInput.email != None :
            goodsReadInput.email = parse.unquote(goodsReadInput.email)
        front_service.outbound_create(request, goodsReadInput)
        request.state.inspect = frame()

    return ex.ReturnOK(200, "", request, goods, False)

# /scm/b2b/front/order/read
@router.post("/b2b/front/order/read", dependencies=[Depends(api_same_origin)])
async def 서비스_신청_상세( # INBOND
     request: Request
    ,orderInput : OrderInput
    ,user: TokenDataOutbound = Depends(get_current_active_outbound)
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)
    user, request.state.user = getTokenDataOutbound(user), getTokenDataOutbound(user)

    res = front_service.order_detail(request, orderInput)
    request.state.inspect = frame()

    if res is None :
        return ex.ReturnOK(404, "신청 상세을(를) 찾을 수 없습니다.", request)

    values = jsonable_encoder(parse_obj_as(B2BOrderInput, res))

    values.update({'token_name':user.token_name})
    values.update({'sosok_uid':user.sosok_uid})
    values.update({'sosok_id':user.sosok_id})
    values.update({'apply_user_uid':user.user_uid})
    values.update({'apply_user_id':user.user_id})
    values.update({'apply_name':user.user_name})

    if user.token_name == 'DREAM-MANAGER' or user.token_name == 'DREAM-ADMIN' :
        outbound_data = front_service.outbound_data_read(request, user.user_uid, user.sosok_uid )
        request.state.inspect = frame()
        
        if outbound_data is None :
            return ex.ReturnOK(404, "예기치 못한 오류가 발생하였습니다. 다시 시도해 주세요.", request)
        
        values.update({'apply_company':outbound_data["jsondata"]["company_name"]})
        values.update({'apply_depart':outbound_data["jsondata"]["depart"]})
        values.update({'apply_position':outbound_data["jsondata"]["position1"]})
        values.update({'apply_phone':outbound_data["jsondata"]["mobile"]})
        values.update({'apply_email':outbound_data["jsondata"]["email"]})

    jsondata = {}
    jsondata.update(res)
    jsondata.update({"values": values})

    return ex.ReturnOK(200, "", request, jsondata)
