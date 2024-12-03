import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from urllib.parse import quote_plus

DATABASE_USER_DREAM = os.environ['MYSQL_USER_DREAM']
DATABASE_PASSWORD_DREAM = quote_plus(os.environ['MYSQL_PASSWORD_DREAM']) # 비밀번호에 @들어간경우 방지
DATABASE_HOST_DREAM = os.environ['MYSQL_HOST_DREAM']
DATABASE_PORT_DREAM = os.environ['MYSQL_PORT_DREAM']
DATABASE_NAME_DREAM = os.environ['MYSQL_DATABASE_DREAM']
SQLALCHEMY_DATABASE_URL_DREAM = f"mysql+pymysql://{DATABASE_USER_DREAM}:{DATABASE_PASSWORD_DREAM}@{DATABASE_HOST_DREAM}:{DATABASE_PORT_DREAM}/{DATABASE_NAME_DREAM}"

engine_dream = create_engine (
    SQLALCHEMY_DATABASE_URL_DREAM
    ,pool_size=20
    ,pool_recycle=500
    ,max_overflow=20
    ,echo=True if os.environ['PROFILE']=="development" else False
)

SessionLocal_dream = sessionmaker(autocommit=False, autoflush=False, bind=engine_dream)

Base = declarative_base()

def get_session():
    with Session(engine_dream) as session:
        yield session
