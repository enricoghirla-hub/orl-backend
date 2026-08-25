import os
from pypdf import PdfReader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def run_ingestion():
    pdf_folder = "./guidelines_pdf"
    
    if not os.path.exists(pdf_folder):
        os.makedirs(pdf_folder)
        print(f"Cartella '{pdf_folder}' creata! Inserisci i PDF e riprova.")
        return

    pdf_files = [f for f in os.listdir(pdf_folder) if f.endswith(".pdf")]
    if not pdf_files:
        print("Nessun documento PDF trovato nella cartella.")
        return

    documents = []
    for file_name in pdf_files:
        file_path = os.path.join(pdf_folder, file_name)
        print(f"Lettura file: {file_name}...")
        try:
            reader = PdfReader(file_path)
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    documents.append(Document(page_content=text, metadata={"source": file_name, "page": i+1}))
        except Exception as e:
            print(f"Errore durante la lettura di {file_name}: {e}")

    if not documents:
        print("Impossibile estrarre testo dai PDF.")
        return

    print(f"Estratte {len(documents)} pagine. Divisione in blocchi...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = text_splitter.split_documents(documents)

    print("Generazione database vettoriale in corso...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    Chroma.from_documents(chunks, embeddings, persist_directory="./ebm_db")
    print("✅ INDICIZZAZIONE COMPLETATA CON SUCCESSO!")

if __name__ == "__main__":
    run_ingestion()