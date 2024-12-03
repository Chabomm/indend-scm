from sqlalchemy import Column, String, Integer, ForeignKey, text, DateTime, Boolean, JSON, Text

from app.core.database import Base

class T_OUTBOUND_DATA(Base):
    __tablename__ = "T_OUTBOUND_DATA"
    uid = Column(Integer, primary_key=True, index=True)
    token_name  = Column(String, comment='')
    user_uid  = Column(String, comment='')
    user_id  = Column(String, comment='')
    sosok_uid  = Column(String, comment='')
    sosok_id = Column(String, comment='')
    jsondata = Column(JSON, default=[], comment='')
    create_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), comment="등록일")
    update_at = Column(DateTime, comment="수정일")
