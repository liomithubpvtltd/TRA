import os
from whatsapp_api_client_python import API

class WhatsAppService:
    """Institutional WhatsApp Delivery Layer — Powering Real-Time Trading Alerts."""
    
    def __init__(self):
        self.api_id = os.getenv("GREEN_API_ID", "")
        self.api_token = os.getenv("GREEN_API_TOKEN", "")
        self.target_phone = os.getenv("WHATSAPP_ADMIN_PHONE", "") # Format: 1234567890 (no +)
        
        self.client = None
        if self.api_id and self.api_token:
            self.client = API.GreenAPI(self.api_id, self.api_token)
            print("[WHATSAPP] Green API Client Initialized.")
        else:
            print("[WHATSAPP] Warning: Green API credentials missing. Running in Simulation Mode.")

    def send_notification(self, message: str):
        """Sends a high-priority alert to the master administrator."""
        if not self.client or not self.target_phone:
            print(f"[WHATSAPP-SIM] Notification: {message}")
            return {"status": "Simulated", "message": message}
            
        try:
            # Green API uses @c.us for personal chats
            chat_id = f"{self.target_phone}@c.us"
            response = self.client.sending.sendMessage(chat_id, message)
            
            if response.code == 200:
                print(f"[WHATSAPP] Alert Dispatched Successfully.")
                return {"status": "Delivered", "id": response.data.get('idMessage')}
            else:
                print(f"[WHATSAPP] Delivery Failed: {response.error}")
                return {"status": "Error", "error": response.error}
        except Exception as e:
            print(f"[WHATSAPP] Bridge Error: {e}")
            return {"status": "Bridge-Error", "error": str(e)}

    def send_report(self, report_title: str, summary: str, score: int):
        """Sends a formatted Institutional Research Brief."""
        formatted_brief = (
            f"🧠 *VISION NEURAL BRIEF*\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"📄 *TITLE:* {report_title}\n"
            f"🎯 *CONFIDENCE:* {score}%\n"
            f"📅 *DATE:* {os.popen('date /t').read().strip()}\n\n"
            f"📝 *SUMMARY:*\n{summary}\n\n"
            f"✅ *ACTION:* Review proposed high-probability edge in the AI Matrix Portal."
        )
        return self.send_notification(formatted_brief)

whatsapp_service = WhatsAppService()
