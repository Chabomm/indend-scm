from sqlalchemy import Column, String, Integer, ForeignKey, text, DateTime, Boolean

from app.core.database import Base

class T_SESSION(Base):
    __tablename__ = "T_SESSION"
    uid = Column(Integer, primary_key=True, index=True)
    site_id = Column(String, comment="b2b, seller")
    user_uid = Column(Integer)
    user_id = Column(String)
    access_token = Column(String)
    refresh_token = Column(String)
    ip = Column(String)
    create_date = Column(DateTime, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))

class T_AUTH_CONFIRM(Base):
    __tablename__ = "T_AUTH_CONFIRM"
    uid = Column(Integer, primary_key=True, index=True)
    send_type = Column(String)
    value = Column(String)
    auth_num = Column(String)
    try_count = Column(Integer)
    create_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), comment="등록일")
    expiry_at = Column(DateTime, comment="만료일") 
