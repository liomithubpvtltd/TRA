import os
import shutil
import time
import boto3
from datetime import datetime
from botocore.config import Config

class CloudArchivist:
    """Institutional Data Sychronization Layer for Massive.com S3."""
    
    def __init__(self):
        self.archive_dir = os.path.join(os.path.dirname(__file__), "..", "archives")
        os.makedirs(self.archive_dir, exist_ok=True)
        
        # S3 Configuration
        self.access_key = os.getenv("S3_ACCESS_KEY_ID", "")
        self.secret_key = os.getenv("S3_SECRET_ACCESS_KEY", "")
        self.endpoint = os.getenv("S3_ENDPOINT_URL", "")
        self.bucket = os.getenv("S3_BUCKET_NAME", "")
        
        self.last_sync = None
        self.is_synced = False
        
        self.s3_client = None
        if self.access_key and self.secret_key and self.endpoint:
            try:
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=self.endpoint,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key,
                    config=Config(signature_version='s3v4')
                )
                print("[ARCHIVIST] Massive.com S3 Client Initialized.")
            except Exception as e:
                print(f"[ARCHIVIST] S3 Connection Error: {e}")

    def perform_sync(self):
        """Synchronizes local forensic datasets and neural weights to Massive.com S3."""
        if not self.s3_client:
            print("[ARCHIVIST] Sync aborted: S3 Client not available.")
            return False
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        db_path = os.path.join(os.path.dirname(__file__), "..", "services", "vision_trading.db")
        
        if os.path.exists(db_path):
            try:
                # 1. Create forensic snapshot filename
                filename = f"vision_snapshot_{timestamp}.db"
                
                # 2. Upload directly to Massive.com S3
                print(f"[ARCHIVIST] Dispatching forensic archive to Massive.com: {filename}...")
                self.s3_client.upload_file(db_path, self.bucket, filename)
                
                self.last_sync = datetime.now()
                self.is_synced = True
                print(f"[ARCHIVIST] Forensic Sync SUCCESS: {filename} secured in {self.bucket}")
                return True
            except Exception as e:
                print(f"[ARCHIVIST] Sync Execution Error: {e}")
                self.is_synced = False
        return False

    def get_status(self):
        return {
            "status": "SECURED" if self.is_synced else "IDLE",
            "last_sync": self.last_sync.strftime("%H:%M:%S") if self.last_sync else "NEVER",
            "provider": "Massive.com S3",
            "bucket": self.bucket
        }

cloud_archivist = CloudArchivist()
