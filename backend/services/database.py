from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, BigInteger, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import pandas as pd

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
    symbol = Column(String(20))
    side = Column(String(10)) # buy/sell
    entry_price = Column(Float)
    size = Column(Float)
    timestamp = Column(DateTime)
    status = Column(String(20)) # open/closed
    pnl = Column(Float, default=0.0)

class TradeLog(Base):
    __tablename__ = 'trade_logs'
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20))
    action = Column(String(20)) # signal_received / trade_opened / trade_closed
    price = Column(Float)
    details = Column(String(255))
    timestamp = Column(DateTime)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    phone = Column(String(20))
    password = Column(String(255)) # In real app, hash this!
    role = Column(String(20), default='user') # admin/user
    created_at = Column(DateTime, default=pd.Timestamp.now)

class DatabaseService:
    def __init__(self):
        # Use SQLite for out-of-the-box local persistence
        db_path = os.path.join(os.path.dirname(__file__), 'vision_trading.db')
        self.url = f"sqlite:///{db_path}"
        
        # Create engine
        self.engine = create_engine(self.url, connect_args={"check_same_thread": False})
        self.Session = sessionmaker(bind=self.engine)
        Base.metadata.create_all(self.engine)

    def insert_data(self, df, symbol):
        session = self.Session()
        try:
            for index, row in df.iterrows():
                # Convert index to datetime if it's not
                ts = index.to_pydatetime() if hasattr(index, 'to_pydatetime') else index
                
                # Simple check-and-insert (Upsert logic)
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
            print(f"Synced {symbol} to MySQL via SQLAlchemy")
        except Exception as e:
            session.rollback()
            print(f"Error inserting data for {symbol}: {e}")
        finally:
            session.close()

    def fetch_history(self, symbol, limit=1000):
        query = f"SELECT timestamp, open, high, low, close, volume FROM market_data WHERE symbol = '{symbol}' ORDER BY timestamp DESC LIMIT {limit}"
        df = pd.read_sql(query, self.engine)
        df.set_index('timestamp', inplace=True)
        return df.sort_index()

db_service = DatabaseService()
