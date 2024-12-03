from sqlalchemy import Column, String, Integer, ForeignKey, text, DateTime, Boolean, JSON, Text

from app.core.database import Base

class T_SCM_MENU(Base):
    __tablename__ = "T_SCM_MENU"
    uid = Column(Integer, primary_key=True, index=True)
    site_id = Column(String, comment="b2b, seller")
    name = Column(String, comment="메뉴명")
    icon = Column(String, comment="아이콘")
    to = Column(String, comment="링크")
    sort = Column(Integer, comment="순서")
    depth = Column(Integer, comment="단계", default=1)
    parent = Column(Integer, comment="부모uid", default=0)