import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

app = FastAPI(title="ORL Studio Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6K_9Yz9WhmLa1f2sKTtjkymfCro65eHQzZ2EQHIBFeJHA")

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="./ebm_db", embedding_function=embeddings)


class ChatRequest(BaseModel):
    prompt: str

class RagRequest(BaseModel):
    prompt: str
    context: Optional[dict] = None


SYSTEM_PROMPT_TEMPLATE = """
Sei un assistente clinico EBM specializzato in Otorinolaringoiatria.
Rispondi al quesito del medico UTILIZZANDO ESCLUSIVAMENTE le linee guida certificate presenti nel contesto.

Contesto Paziente Attuale: {patient_context}
Linee Guida recuperate dal Database:
{context}

Quesito Medico: {question}

Formatta la risposta ESATTAMENTE in questo modo:
- **Raccomandazione Principale (Grado/Livello)**: [Indicazione sintetica con livello di evidenza]
- **Terapie non raccomandate / Controindicazioni**: [Eventuali farmaci/procedure sconsigliati]
- **Dosaggi e Red Flags**: [Eventuali segnali d'allarme o posologia]
- 📄 **Fonte Ufficiale**: [Nome Linea Guida, Anno, Pagina o Sezione]
"""


@app.get("/")
def read_root():
    return {"status": "online", "model": "gemini-3.6-flash RAG", "service": "ORL Studio API"}


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


@app.post("/api/rag-query")
async def handle_rag_query(req: RagRequest):
    try:
        patient_info = f"Diagnosi: {req.context.get('diagnosi', 'N/D')}" if req.context else "Nessuno"
        
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        docs = retriever.invoke(req.prompt)
        retrieved_text = "\n\n".join([d.page_content for d in docs])
        
        prompt = PromptTemplate(
            template=SYSTEM_PROMPT_TEMPLATE, 
            input_variables=["patient_context", "context", "question"]
        )
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.6-flash",
            google_api_key=GEMINI_API_KEY
        )
        
        chain_input = prompt.format(
            patient_context=patient_info,
            context=retrieved_text,
            question=req.prompt
        )
        
        response = llm.invoke(chain_input)
        return {"answer": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))