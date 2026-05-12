import os
import requests
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

class NewsFetcher:
    def __init__(self):
        self.api_key = os.getenv("NEWS_API_KEY")
        self.base_url = "https://newsapi.org/v2/everything"

    def fetch_gold_news(self, days=30):
        if not self.api_key:
            print("No NewsAPI key found.")
            return pd.DataFrame()

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        params = {
            'q': 'XAU/USD OR Gold Price OR Federal Reserve',
            'from': start_date.strftime('%Y-%m-%d'),
            'to': end_date.strftime('%Y-%m-%d'),
            'sortBy': 'relevancy',
            'language': 'en',
            'apiKey': self.api_key
        }

        try:
            response = requests.get(self.base_url, params=params)
            data = response.json()
            
            if data.get('status') != 'ok':
                print(f"NewsAPI error: {data.get('message')}")
                return pd.DataFrame()

            articles = data.get('articles', [])
            news_data = []
            for art in articles:
                news_data.append({
                    'timestamp': art['publishedAt'],
                    'title': art['title'],
                    'description': art['description'],
                    'source': art['source']['name']
                })
            
            df = pd.DataFrame(news_data)
            if not df.empty:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df.set_index('timestamp', inplace=True)
            return df
        except Exception as e:
            print(f"Failed to fetch news: {e}")
            return pd.DataFrame()

    def get_sentiment_score(self, text):
        # Basic keyword-based sentiment for POC
        # In production, use VADER or a trained Transformer
        bullish_words = ['up', 'rise', 'rally', 'surge', 'bullish', 'gain', 'strong', 'inflation', 'cut', 'safe haven']
        bearish_words = ['down', 'fall', 'drop', 'slump', 'bearish', 'loss', 'weak', 'rate hike', 'hawkish', 'sell']
        
        text = str(text).lower()
        score = 0
        for word in bullish_words:
            if word in text: score += 1
        for word in bearish_words:
            if word in text: score -= 1
        return score

if __name__ == "__main__":
    fetcher = NewsFetcher()
    df = fetcher.fetch_gold_news(days=7)
    if not df.empty:
        df['sentiment'] = df['title'].apply(fetcher.get_sentiment_score)
        print(f"Fetched {len(df)} news articles. Average sentiment: {df['sentiment'].mean():.2f}")
        df.to_csv(os.path.join(os.path.dirname(__file__), 'data', 'news_sentiment.csv'))
