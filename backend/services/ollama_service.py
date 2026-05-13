import requests
import json
import os

class OllamaService:
    """Local Private Executive Brain — Off-Grid Strategic Reasoning."""
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "mistral")

    def generate_strategy_brief(self, market_data, sentiment):
        """Generates a deep executive briefing using local LLM reasoning."""
        prompt = f"""
        [EXECUTIVE COMMAND] Analyze the following institutional data and provide a strategic trade hypothesis for XAU/USD (Gold).
        
        DATA: {market_data}
        SENTIMENT: {sentiment}
        
        REQUIREMENT: Provide a 2-sentence 'Strategic Pivot' and a 'Confidence Score' (0-100).
        """
        
        try:
            res = requests.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": prompt, "stream": False},
                timeout=10
            )
            if res.status_code == 200:
                return res.json().get('response', 'REASONING_ERROR: Strategic silence.')
        except Exception:
            return "LOCAL_EXECUTIVE_OFFLINE: Reverting to algorithmic defaults."
        
        return "LOCAL_EXECUTIVE_BUSY: Retrying correlation."

ollama_executive = OllamaService()
