import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="ORL Studio Backend API", version="1.0.0")

# Abilitazione CORS per il frontend Next.js su localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6K_9Yz9WhmLa1f2sKTtjkymfCro65eHQzZ2EQHIBFeJHA")

class ChatRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"status": "online", "model": "gemini-3.6-flash", "service": "ORL Studio API"}

@app.post("/api/chat")
async def ask_ai(data: ChatRequest):
    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{
                "text": (
                    "Sei un assistente medico esperto in Otorinolaringoiatria (ORL). "
                    "Rispondi in modo conciso, professionale e basato su linee guida EBM:\n\n"
                    f"{data.prompt}"
                )
            }]
        }]
    }

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        res_data = response.json()

        if "candidates" in res_data:
            text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return {"reply": text}
        elif "error" in res_data:
            return {"reply": f"⚠️ Errore Google ({res_data['error'].get('code')}): {res_data['error'].get('message')}"}
        else:
            return {"reply": f"⚠️ Risposta non valida dal server Gemini: {res_data}"}

    except requests.exceptions.Timeout:
        return {"reply": "⚠️ Tempo di attesa esaurito (più di 60 secondi). Riprova a inviare la richiesta."}
    except Exception as e:
        return {"reply": f"⚠️ Errore di connessione Python: {str(e)}"}