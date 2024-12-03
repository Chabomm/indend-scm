import json
import os
from fastapi import FastAPI, Depends, HTTPException, status, Request, Header
from fastapi.responses import PlainTextResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from inspect import currentframe as frame

from app.core import exceptions as ex
from app.core.logger import api_logger
from app.core.database import SessionLocal
from app.core import util

app = FastAPI(
    title = '인디앤드코리아 판매자센터 API Server',
    description = '인디앤드코리아 판매자센터 API Server'
)

allow_ip_list = [
    "112.221.134.106"
]

api_key_header = APIKeyHeader(name="Token")

origins = [
    "http://localhost:5300",
]

# origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header (request: Request, call_next):
    request.state.req_time = util.getNow()
    request.state.start = util.getUnixTime()
    try :
        if os.environ['PROFILE'] == "development" :
            request.state.user_ip = "127.0.0.1"

        elif request.headers.get('x-user-ip') != None and os.environ['HOST_IP'] != str(request.headers.get('x-user-ip')) :
            request.state.user_ip = str(request.headers.get('x-user-ip')) # nextjs serversideprops에서 보낸 아이피

        elif request.headers.get('x-real-ip') != None and os.environ['HOST_IP'] != str(request.headers.get('x-real-ip')) :
            request.state.user_ip = str(request.headers.get('x-real-ip'))

        elif request.client.host != None and os.environ['HOST_IP'] != str(request.client.host) :
            request.state.user_ip = str(request.client.host)
            
        if not hasattr(request.state, 'user_ip') :
            request.state.user_ip = "127.0.0.1"

    except Exception as e :
        request.state.user_ip = "0.0.0.0"
        timestr = util.getNow("%Y-%m-%d")
        file_name = timestr + ".log"
        logm = util.getNow() + " |:| " + str(e) + "\n"
        logm = logm + str(request.__dict__) + "\n"

        util.file_open (
            "/usr/src/app/data/scm-backend/request/"
            ,file_name
            ,logm
        )

    # static 미들웨어 허용
    if request.url.path.startswith("/be/static/") or request.url.path.startswith("/be/resource/") :
        response = await call_next(request)
        return response
    
    if request.url.path.startswith("/openapi.json") :
        IS_BLOCK = True
        for allow_ip in allow_ip_list:
            if os.environ.get('PROFILE') == 'development' :
                IS_BLOCK = False
            elif allow_ip == str(request.state.user_ip) :
                IS_BLOCK = False
            if IS_BLOCK :
                return PlainTextResponse(status_code=404)
            
        response = await call_next(request)
        return response

    # docs local만 허용
    if request.url.path.startswith("/docs") \
        or request.url.path.startswith("/redoc") :
        
        IS_BLOCK = True
        for allow_ip in allow_ip_list:
            if os.environ.get('PROFILE') == 'development' :
                IS_BLOCK = False
            elif allow_ip == str(request.state.user_ip) :
                IS_BLOCK = False
            if IS_BLOCK :
                return PlainTextResponse(status_code=404)

    request.state.inspect = None
    request.state.body = None
    request.state.user = None
    request.state.db = SessionLocal()

    try :
        print("")
        print("")
        print("\033[95m" + "######################## [",request.state.user_ip,"] [", util.getNow(), "] [",util.get_request_url(request),"] START " + "\033[0m")
        response = await call_next(request)
        request.state.db.commit()
        request.state.db.close()

        # DREAM DB conn 있으면 커밋
        if hasattr(request.state, 'db_dream'):
            request.state.db_dream.commit()
            request.state.db_dream.close()

        print("\033[95m" + "######################## [",request.state.user_ip,"] [", util.getNow(), "] [",util.get_request_url(request),"] SUCCESS END " + "\033[0m")
    except Exception as e:
        request.state.db.rollback()
        request.state.db.close()

        # DREAM DB conn 있으면 롤백
        if hasattr(request.state, 'db_dream'):
            request.state.db_dream.rollback()
            request.state.db_dream.close()

        # 디테일한 내용을 log 찍어주고 간단한 내용을 클라이언트한테 response
        # print("Exception----------", str(e))
        error = await ex.exception_handler(e)
        error_dict = dict(status=error.status_code, msg=error.msg, code=error.code)
        response = JSONResponse(status_code=error.status_code, content=error_dict)
        await api_logger(request=request, error=error)
        print("\033[95m" + "######################## [",request.state.user_ip,"] [", util.getNow(), "] [",util.get_request_url(request),"] EXCEPTION END " + "\033[0m")

    if request.state.user :
        print("\033[95m" + str(request.state.user) + "\033[0m")
        if '/logout' in str(request._url):
            response.delete_cookie(request.state.user.token_name)
        else :
            response.set_cookie (
                key=request.state.user.token_name
                ,value=request.state.user.access_token
            )

    # print("")
    # print("")
    # print("--- request")
    # print(request.__dict__)
    # print("")
    # print("")
    # print("--- response")
    # print(response.__dict__)
    # print("")
    # print("")

    return response

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    print(f"{repr(exc)}")
    return PlainTextResponse(str(exc.detail), status_code=exc.status_code)

@app.get("/")
def read_root(request: Request):
    print(request.state.user_ip)
    return "Hello World"

API_TOKEN = "SECRET_API_TOKEN"

async def api_token(token: str = Depends(APIKeyHeader(name="Token"))):
    if token != API_TOKEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

@app.get("/protected-route", dependencies=[Depends(api_token)])
async def protected_route():
    return {"hello": "world"}

@app.get("/be/ping", status_code=200, description="***** Liveliness Check *****")
async def ping(
    request:Request
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    return "pong"

@app.post("/scm/client_error")
async def client_error(
    request:Request
):
    request.state.inspect = frame()
    request.state.body = await util.getRequestParams(request)

    timestr = util.getNow("%Y-%m-%d")
    file_name = timestr + ".log"
    logm = util.getNow() + " |:| " + request.state.user_ip + "\n"
    logm = logm + "┏────────────request.state.body─────────────┓" + "\n"
    logm = logm + json.dumps(request.state.body, ensure_ascii=False, indent=4) + "\n"
    logm = logm + "└───────────────────────────────────────────┘" 

    util.file_open (
        "/usr/src/app/data/scm-backend/client/"
        ,file_name
        ,logm
    )

    
# ==== start common ==== 
from .routers import auth
app.include_router(auth.router)
from .routers import aws
app.include_router(aws.router)
# ==== end common ==== 


# ==== start b2b ==== 
from .routers.b2b import admin as b2b_admin
app.include_router(b2b_admin.router)

from .routers.b2b import front as b2b_front
app.include_router(b2b_front.router)

from .routers.b2b.center import auth as b2b_center_auth
app.include_router(b2b_center_auth.router)

from .routers.b2b.center import goods as b2b_center_goods
app.include_router(b2b_center_goods.router)

from .routers.b2b.center import order as b2b_center_order
app.include_router(b2b_center_order.router)

from .routers.b2b.center import info as b2b_center_info
app.include_router(b2b_center_info.router)
# ==== end b2b ==== 


# ==== start entry ==== 
from .routers.entry.dream import front as dream_front
app.include_router(dream_front.router)

from .routers.entry.dream import admin as dream_admin
app.include_router(dream_admin.router)
# ==== end entry ==== 


