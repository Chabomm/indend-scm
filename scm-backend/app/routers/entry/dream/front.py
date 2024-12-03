import json
import requests
import string
import random
import os
from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Body
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from inspect import currentframe as frame

from app.core import exceptions as ex
from app.core import util
from app.core.config import PROXY_PREFIX, api_same_origin
from app.deps.auth import ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_MINUTES

from app.schemas.schema import *
from app.schemas.dream import *
from app.service.entry.dream import front_service, admin_service

router = APIRouter (
    prefix = PROXY_PREFIX, 
    tags=["/entry/dream"],
)


# -------------------------- [ S ] 상담 ---------------------------


# /scm/dream/counsel/edit
@router.post("/dream/counsel/edit", dependencies=[Depends(api_same_origin)])
async def 복지드림_상담신청_편집(
     request:Request
    ,dreamCounsel: DreamCounsel = Body(
        ...,
        examples = {
            "example01" : {
                "summary": "구축문의 등록 예시 1",
                "description": "",
                "value": {
                     "mode" : "REG"
                    ,"company_name" : "(주)어쩌구"
                    ,"homepage_url" : "https://adfasdf" 
                    ,"staff_count" : 659
                    ,"wish_build_at" : "2023-06-27"
                    ,"staff_name" : "김가나"
                    ,"staff_position" : "직책"
                    ,"staff_mobile" : "010-1234-1234"
                    ,"staff_email" : "asdf@ddd.co.kr"
                    ,"contents" : "테스트 상담 문의"
                }
            },
            "example03" : {
                "summary": "게시물 Board의 uid",
                "description": "",
                "value": {
                    "uid" : 2076
                    ,"mode" : "DEL"
                }
            },
        }
    )
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    # 등록
    if dreamCounsel.mode == "REG" :
        res = front_service.counsel_create(request, dreamCounsel)
        request.state.inspect = frame()
        return ex.ReturnOK(200, "구축상담 신청 등록 완료", request, {"uid" : res.uid})

# /scm/dream/counsel/read
@router.post("/dream/counsel/read", dependencies=[Depends(api_same_origin)])
async def 상담신청_상세(
     request: Request
    ,pRead: PRead
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    if pRead.uid == 0 :
        return DreamCounsel()
    

# -------------------------- [ E ] 상담 ---------------------------












# -------------------------- [ S ] 인증 ---------------------------

from app.core.dbDream import SessionLocal_dream
from app.service.dream import partner_service
# /scm/dream/build/check 
@router.post("/dream/build/check", dependencies=[Depends(api_same_origin)])
async def 복지드림_구축신청_아이디_중복확인(
    request:Request
    ,chkAdminIdSchema: ChkAdminIdSchema = Body(
        ...,
        examples = {
            "example01" : {
                "summary": "구축신청 아이디 중복체크",
                "description": "",
                "value": {
                     "adminid_input_value" : "aaasssddd"
                    ,"adminid_check_value" : ""
                    ,"is_adminid_checked" : "false"
                }
            }
        }
    )
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    request.state.db_dream = SessionLocal_dream() # DREAM DB session

    result = {}

    if chkAdminIdSchema.adminid_input_value == "" :
        return ex.ReturnOK(400, "중복확인할 아이디를 입력해 주세요", request, result)
    
    res = partner_service.read_partner_info(request, chkAdminIdSchema.adminid_input_value)
    request.state.inspect = frame()

    if res is None : # 중복안됨, 사용가능
        result = {"check_result" : True}
    else : # 중복됨, 사용불가
        result = {"check_result" : False}

    return ex.ReturnOK(200, "", request, result)

    # URL = os.environ.get('DREAM_URL') + "/be/dream/build/check"
    # headers = {
    #     'Content-Type': 'application/json; charset=utf-8'
    #     ,'x-user-ip': request.state.user_ip
    # }
    
    # result = {}
    # params = json.dumps(jsonable_encoder(chkAdminIdSchema))
    # try : 
    #     result = requests.post(URL, headers=headers, data=params, timeout=1).text
    #     result = json.loads(result)
    # except Exception as e:
    #     return ex.ReturnOK(500, str(e), request)
    
    # return ex.ReturnOK(200, "", request, result)


# /scm/dream/build/auth/send
@router.post("/dream/build/auth/send")
def 구축신청_인증번호_발송 (
    request: Request,
    authNum: AuthNum = Body(
        ...,
        examples = {
            "example01" : {
                "summary": "문자인증",
                "description": "",
                "value": {
                    "send_type" : "mobile",
                    "value" : "010-2395-6573",
                }
            },
            "example02" : {
                "summary": "이메일인증",
                "description": "",
                "value": {
                    "send_type" : "email",
                    "value" : "bcha@indend.co.kr",
                }
            },
        }
    )
):
    request.state.inspect = frame()

    # 회원 select
    member = front_service.build_auth_read(request, authNum)
    request.state.inspect = frame()

    # None => 없으니깐 다시 확인하라고 메시지 리턴
    if member == None :
        return ex.ReturnOK(404, "일치하는 정보가 없습니다", request, {})
    # 그리고나서 밑에 소스는 실행안됨 

    # 6가지 랜덤숫자
    _LENGTH = 6
    string_pool = string.digits
    random_num = "" #결과값
    for i in range(_LENGTH) :
        random_num += random.choice(string_pool)     

    # 4가지 랜덤숫자
    LENGTH_SMS = 4
    string_SMS = string.digits
    sms_num = "" #결과값
    for i in range(LENGTH_SMS) :
        sms_num += random.choice(string_SMS)

    if authNum.send_type == 'email' :
        request_body = {
            "ums_uid": 3,
            "send_list": [
                {
                    "ums_type": "email",
                    "msgId": "sample_0001",
                    "toEmail": authNum.value,
                    "#{플랫폼}": "복지드림 구축신청 페이지",
                    "#{인증번호}": random_num,
                }
            ]
        }
    else :
        request_body = {
            "ums_uid": 4,
            "send_list": [
                {
                    "ums_type": "sms",
                    "msgId": "sample_"+sms_num,
                    "toMobile": authNum.value,
                    "#{플랫폼}": "복지드림 구축신청 페이지",
                    "#{인증번호}": random_num,
                }
            ]
        }
    # end if
        
    # 2024-05-05 UMS 서버가 없기때문에 
    auth_confirm = front_service.auth_num_create(request, random_num, authNum)
    request.state.inspect = frame()

    print("=-=-=-=-=-=-=-=-=-=-=-=-=-=")
    print(" 인증번호 :", random_num)
    print("=-=-=-=-=-=-=-=-=-=-=-=-=-=")

    # URL = "http://0.0.0.0:5000/ums/send"
    # headers = {
    #     'Content-Type': 'application/json; charset=utf-8'
    #     ,'x-user-ip': request.state.user_ip
    # }
    # params = json.dumps(jsonable_encoder(request_body))
    # try : 
    #     result = requests.post(URL, headers=headers, data=params, timeout=1).text
    #     response = json.loads(result)

    #     if response["list"][0]["result"] == "OK" :
    #         auth_confirm = front_service.auth_num_create(request, random_num, authNum)
    #         request.state.inspect = frame()
    #     else :
    #         return ex.ReturnOK(500, "죄송합니다. 전송도중 오류가 발생하였습니다. 이메일 주소를 다시 한번 확인해 주시고 문제 지속시 관리자에게 문의바랍니다.", request)

    # except Exception as e:
    #     print("eee", e)
    #     return ex.ReturnOK(501, "죄송합니다. 전송도중 오류가 발생하였습니다. 이메일 주소를 다시 한번 확인해 주시고 문제 지속시 관리자에게 문의바랍니다.", request)

    
    # return ex.ReturnOK(200, "", request, {})
    return ex.ReturnOK(200, "", request, {"uid":auth_confirm.uid})


# /scm/dream/build/auth/vaild
@router.post("/dream/build/auth/vaild")
async def 구축신청_인증번호_확인 (
    request: Request,
    authNumInput: AuthNumInput = Body(
        ...,
        examples = {
            "example01" : {
                "summary": "로그인",
                "description": "",
                "value": {
                    "uid" : "223",
                    "counsel_uid" : "6",
                    "auth_num" : "760313",
                }
            },
        }
    )
):
    request.state.inspect = frame()

    result = front_service.auth_num_vaild(request, authNumInput)
    request.state.inspect = frame()

    if result["code"] != 200 :
        return ex.ReturnOK(result["code"], result["msg"], request, {})
    
    # 구축상담정보 가져오기
    counsel_info = front_service.consel_read(request, authNumInput.counsel_uid)
    request.state.inspect = frame()

    build = DreamCounsel() # 임시, 제거해야됨

    # {T_AUTH_CONFIRM의 uid} |:| {T_AUTH_CONFIRM의 auth_num} |:| {T_DREAM_COUNSEL의 uid}
    enc_auth_num = util.encrypt_aes_128(str(authNumInput.uid)+"|:|"+str(authNumInput.auth_num)+"|:|"+str(authNumInput.counsel_uid), "0000000000000000", "9999999999999999")
   
    return ex.ReturnOK(result["code"], result["msg"], request, {
        "auth_num":enc_auth_num
        ,"build_uid":util.checkNumeric(counsel_info.uid)
    })


# -------------------------- [ E ] 인증 ---------------------------









# -------------------------- [ S ] 구축 ---------------------------
    
# /scm/dream/build/auth
@router.post("/dream/build/auth", dependencies=[Depends(api_same_origin)])
async def 구축할때_상담상세(
     request: Request
    ,pRead: PRead
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    if pRead.uid == 0 :
        return DreamCounsel()
    
    res = front_service.consel_read(request, pRead.uid)
    request.state.inspect = frame()

    if res is None:
        return ex.ReturnOK(404, "페이지를 불러오는데 실패하였습니다.", request)
    
    build_res = front_service.build_read_uid(request, res.uid)
    request.state.inspect = frame
        
    if build_res is None:
        return ex.ReturnOK(507, "유효하지 않은 요청입니다.", request)

    return res

# /scm/dream/build/read
@router.post("/dream/build/read", dependencies=[Depends(api_same_origin)])
async def 구축신청_상세(
     request: Request
    ,urlToken: UrlToken
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    # [ S ] auth_num 인증검사
    if str(urlToken.auth_num) != "" :
        dec_auth_num = util.decrypt_aes_128(str(urlToken.auth_num), "0000000000000000", "9999999999999999")
        auth_num_info = dec_auth_num.split("|:|")
    
        # 0 : {T_AUTH_CONFIRM의 uid} 
        # 1 : {T_AUTH_CONFIRM의 auth_num} 
        # 2 : {T_DREAM_COUNSEL의 uid}
        if int(auth_num_info[2]) != int(urlToken.uid) :
            return ex.ReturnOK(403, "", request)

        res = front_service.build_num_vaild(request, auth_num_info[0], auth_num_info[1])
        request.state.inspect = frame()
    # [ E ] auth_num 인증검사
        
    if res is None:
        return ex.ReturnOK(403, "", request)
    
    if urlToken.uid == 0 :
        build_info = DreamBuild()
    
    else :
        ###########################################################################
        ################ 업종코드는 servicefront_service.com_item_list 에서 가져옴
        ################ 약관은 resource/dream/terms/build.html 에서 가져옴
        ################ 2023-12-26 by.namgu
        ###########################################################################

        # 업종코드 리스트, 템플릿 가져오기 
        # URL = "http://192.168.0.81:8888/api/dream/build/getBuild.asp"
        # headers = {
        #     'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        # }
        
        # result = ""
        # result = requests.post(URL, headers=headers).text
        # result = json.loads(result)

        # 구축정보 가져오기
        build_info = front_service.build_read(request, urlToken.uid)
        request.state.inspect = frame()

        if build_info is None :
            return ex.ReturnOK(501, "구축정보가 존재하지 않습니다.", request)
        
        build_info = jsonable_encoder(build_info)
        if build_info["state"] == "100" : # 도입신청 
            counsel_info = front_service.consel_read(request, urlToken.uid)
            request.state.inspect = frame()

            build_info.update({
                 "company_name": counsel_info.company_name
                ,"staff_name": counsel_info.staff_name
                ,"staff_dept": counsel_info.staff_dept
                ,"staff_position": counsel_info.staff_position
                ,"staff_position2": counsel_info.staff_position2
                ,"staff_mobile": counsel_info.staff_mobile
                ,"staff_email": counsel_info.staff_email
            })

        # 업종코드 리스트
        com_item_list = front_service.com_item_list(request)
        
        jsondata = {}
        jsondata.update({"values": build_info})
        jsondata.update({"com_item_list": com_item_list})

        return ex.ReturnOK(200, "", request, jsondata) 

# /scm/dream/build/edit
@router.post("/dream/build/edit", dependencies=[Depends(api_same_origin)])
async def 복지드림_구축신청_편집(
     request:Request
    ,dreamBuild: DreamBuild = Body(
        ...,
        examples = {
            "example01" : {
                "summary": "구축문의 등록 예시 1",
                "description": "",
                "value": {
                     "mode" : "REG"
                    ,"company_name" : "구축등록 테스트1"
                    ,"ceo_name" : "대표자"
                    ,"staff_name" : "담당자"
                    ,"staff_dept" : "개발팀"
                    ,"staff_position" : "대리"
                    ,"staff_mobile" : "010-1234-5678"
                    ,"staff_email" : "aaa@indend.co.kr"
                    ,"account_email" : "bbb@indend.co.kr"
                    ,"post" : "12345"
                    ,"addr" : "인천 연수구 갯벌로 3"
                    ,"addr_detail" : "1층"
                    ,"company_hp" : "02-1111-2222"
                    ,"biz_kind" : "100"
                    ,"biz_item" : "R"
                    ,"biz_no" : "123-45-78945"
                    ,"biz_service" : ""
                    ,"mall_name" : "복지몰명"
                    ,"host" : "jkjk123"
                    ,"state" : "302"
                    ,"counsel_uid" : "6"
                }
            },
        }
    )
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    # 등록
    res = front_service.build_update(request, dreamBuild)
    request.state.inspect = frame()

    return ex.ReturnOK(200, "구축 신청 등록 완료되었습니다.", request, {"uid" : res.uid})

# -------------------------- [ E ] 구축 ---------------------------