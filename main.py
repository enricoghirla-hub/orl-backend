import os
from typing import Optional, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="ORL Studio Backend API", version="1.0.0")

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

class RagRequest(BaseModel):
    prompt: str
    context: Optional[Any] = None


@app.get("/")
def read_root():
    return {"status": "online", "model": "gemini-3.6-flash Direct RAG", "service": "ORL Studio API"}


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
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        res_data = response.json()

        if "candidates" in res_data:
            text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return {"reply": text, "answer": text}
        elif "error" in res_data:
            return {"reply": f"⚠️ Errore Google ({res_data['error'].get('code')}): {res_data['error'].get('message')}"}
        else:
            return {"reply": f"⚠️ Risposta non valida dal server Gemini: {res_data}"}

    except requests.exceptions.Timeout:
        return {"reply": "⚠️ Tempo di attesa esaurito. Riprova a inviare la richiesta."}
    except Exception as e:
        return {"reply": f"⚠️ Errore di connessione Python: {str(e)}"}


@app.post("/api/rag-query")
async def handle_rag_query(req: RagRequest):
    try:
        if isinstance(req.context, dict):
            patient_info = f"Diagnosi: {req.context.get('diagnosi', 'N/D')}"
        elif isinstance(req.context, str) and req.context.strip():
            patient_info = f"Contesto: {req.context}"
        else:
            patient_info = "Nessuna diagnosi specifica fornita."

        headers = {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json"
        }
        
        prompt_text = (
            f"Sei un assistente clinico EBM specializzato in Otorinolaringoiatria.\n"
            f"Contesto Paziente Attuale: {patient_info}\n"
            f"Quesito Medico: {req.prompt}\n\n"
            f"Formatta la risposta ESATTAMENTE in questo modo:\n"
            f"- **Raccomandazione Principale (Grado/Livello)**: [Indicazione sintetica con livello di evidenza]\n"
            f"- **Terapie non raccomandate / Controindicazioni**: [Eventuali farmaci/procedure sconsigliati]\n"
            f"- **Dosaggi e Red Flags**: [Eventuali segnali d'allarme o posologia]\n"
            f"- 📄 **Fonte Ufficiale**: [Nome Linea Guida EBM/EPOS/AAO-HNS, Anno, Pagina o Sezione]"
        )
        
        payload = {
            "contents": [{"parts": [{"text": prompt_text}]}]
        }

        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        res_data = response.json()

        if "candidates" in res_data:
            text = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return {"answer": text, "reply": text}
        elif "error" in res_data:
            err_msg = res_data['error'].get('message', 'Errore generico API')
            return {"answer": f"⚠️ Errore API Google: {err_msg}", "reply": f"⚠️ Errore API Google: {err_msg}"}
        else:
            return {"answer": "⚠️ Impossibile generare la risposta EBM.", "reply": "⚠️ Impossibile generare la risposta EBM."}

    except Exception as e:
        return {"answer": f"⚠️ Errore interno server: {str(e)}", "reply": f"⚠️ Errore interno server: {str(e)}"}