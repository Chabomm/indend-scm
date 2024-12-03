from sqlalchemy import Column, String, Integer, ForeignKey, text, DateTime, Boolean, JSON

from app.core.database import Base

class T_PARTNER(Base):
    __tablename__ = "T_PARTNER"
    uid = Column(Integer, primary_key=True, index=True)
    partner_type = Column(String)
    partner_id = Column(String)
    mall_name = Column(String)
    company_name = Column(String)
    sponsor = Column(String)
    partner_code = Column(String)
    prefix = Column(String)
    logo = Column(String)
    is_welfare = Column(String, default='F')
    is_dream = Column(String, default='F')
    state = Column(String, default='100')
    mem_type = Column(String, default='임직원')
    create_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"), comment="등록일")
    delete_at = Column(DateTime, comment="삭제일") 
    update_at = Column(DateTime, comment="수정일")