from sqlalchemy import Column, String, Integer, ForeignKey, text, DateTime, Boolean, JSON

from app.core.database import Base

class T_GOODS_KEYWORD(Base):
    __tablename__ = "T_GOODS_KEYWORD"
    guid = Column(Integer, primary_key=True)
    keywords = Column(String) 
    alive = Column(Integer)

class T_GOODS_KEYWORD_TEMP(Base):
    __tablename__ = "T_GOODS_KEYWORD_TEMP"
    guid = Column(Integer, primary_key=True)
    keywords = Column(String) 
    alive = Column(Integer)

class T_GOODS_KEYWORD_LOG(Base):
    __tablename__ = "T_GOODS_KEYWORD_LOG"
    uid = Column(Integer, primary_key=True, index=True)
    user_id  = Column(String)
    ori_word = Column(String)
    rem_word = Column(String)
    pre_word = Column(String)
    sch_word = Column(JSON, default=[])
    res_count = Column(Integer)
    create_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"))