from fastapi import Response, Request

PROXY_PREFIX = "/scm"

def api_same_origin(
    request:Request,
    response:Response):

    return True
