from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, BigInteger, UniqueConstraint, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime

load_dotenv()

Base = declarative_base()

class MarketData(Base):
    __tablename__ = 'market_data'
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20))
    timestamp = Column(DateTime)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(BigInteger)
    
    __table_args__ = (UniqueConstraint('symbol', 'timestamp', name='_symbol_timestamp_uc'),)

class Position(Base):
    __tablename__ = 'positions'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer)
    symbol = Column(String(20))
    stock_name = Column(String(100))
    exchange = Column(String(20), default='NSE')
    side = Column(String(10)) # BUY/SELL
    entry_price = Column(Float)
    quantity = Column(Float)
    live_price = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default='OPEN') # OPEN/CLOSED
    pnl = Column(Float, default=0.0)
    auto_sl_price = Column(Float, nullable=True)
    auto_target_price = Column(Float, nullable=True)
    auto_ema_enabled = Column(Integer, default=0) # 0=False, 1=True

class TradeLog(Base):
    __tablename__ = 'trade_logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer)
    symbol = Column(String(20))
    stock_name = Column(String(100))
    trade_type = Column(String(10)) # BUY/SELL
    quantity = Column(Float)
    price = Column(Float)
    status = Column(String(20), default='FILLED')
    action = Column(String(50)) # e.g. signal_received / trade_opened
    profit = Column(Float, default=0.0)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    phone = Column(String(20))
    password = Column(String(255))
    role = Column(String(20), default='user')
    balance = Column(Float, default=100000.0) # Virtual trading seed balance
    created_at = Column(DateTime, default=datetime.utcnow)

class SignalReport(Base):
    """General report for AI algorithmic performance tracked against market."""
    __tablename__ = 'signal_reports'
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20))
    exchange = Column(String(20), default='NSE')
    action = Column(String(10)) # BUY/SELL
    strategy = Column(String(50))
    entry_price = Column(Float)
    target_value = Column(Float, nullable=True)
    closed_price = Column(Float, nullable=True)
    status = Column(String(30)) # TARGET HIT / SL HIT / ACTIVE
    pnl_pct = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

class StrategyBenchmark(Base):
    __tablename__ = 'strategy_benchmarks'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    win_rate = Column(String(10))
    sharpe = Column(String(10))
    status = Column(String(20))
    discovered_at = Column(DateTime, default=datetime.utcnow)
    institutional_grade = Column(Integer, default=1)

class SystemConfig(Base):
    __tablename__ = 'system_config'
    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(100), unique=True)
    value = Column(String(255))
    updated_at = Column(DateTime, default=datetime.utcnow)

class DatabaseService:
    def __init__(self):
        # Check for MySQL credentials in .env
        host = os.getenv('MYSQL_HOST')
        user = os.getenv('MYSQL_USER')
        pw = os.getenv('MYSQL_PASSWORD', '')
        db = os.getenv('MYSQL_DB')

        if host and user and db:
            # Use MySQL
            self.url = f"mysql+pymysql://{user}:{pw}@{host}/{db}"
            self.engine = create_engine(self.url, pool_recycle=3600)
            print("[DATABASE] Connecting to Institutional MySQL Cluster.")
        else:
            # Fallback to SQLite
            db_path = os.path.join(os.path.dirname(__file__), 'vision_trading.db')
            self.url = f"sqlite:///{db_path}"
            self.engine = create_engine(self.url, connect_args={"check_same_thread": False})
            print("[DATABASE] Falling back to Local SQLite forensic store.")
            
        self.Session = sessionmaker(bind=self.engine)
        Base.metadata.create_all(self.engine)

    def insert_data(self, df, symbol):
        session = self.Session()
        try:
            for index, row in df.iterrows():
                ts = index.to_pydatetime() if hasattr(index, 'to_pydatetime') else index
                existing = session.query(MarketData).filter_by(symbol=symbol, timestamp=ts).first()
                if not existing:
                    item = MarketData(
                        symbol=symbol,
                        timestamp=ts,
                        open=row['Open'],
                        high=row['High'],
                        low=row['Low'],
                        close=row['Close'],
                        volume=row.get('Volume', 0)
                    )
                    session.add(item)
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"[ERROR] Sync failure for {symbol}: {e}")
        finally:
            session.close()

    def fetch_history(self, symbol, limit=1000):
        query = f"SELECT timestamp, open, high, low, close, volume FROM market_data WHERE symbol = '{symbol}' ORDER BY timestamp DESC LIMIT {limit}"
        df = pd.read_sql(query, self.engine)
        if not df.empty:
            df.set_index('timestamp', inplace=True)
            return df.sort_index()
        return df

db_service = DatabaseService()
