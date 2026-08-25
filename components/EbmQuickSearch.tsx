'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, BookOpen, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PatientContext {
  diagnosi?: string;
  capitolo?: string;
  eta?: number;
  note?: string;
}

export default function EbmQuickSearch({ patientContext }: { patientContext?: PatientContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  // Gestione Hotkey (Cmd + K o Ctrl + Spazio)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.code === 'Space')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofill del prompt basato sul contesto del paziente quando si apre la modale
  useEffect(() => {
    if (isOpen && patientContext?.diagnosi) {
      setQuery(`Algoritmo terapeutico e indicazioni EBM per: ${patientContext.diagnosi} ${patientContext.eta ? `(Età: ${patientContext.eta} anni)` : ''}`);
    }
  }, [isOpen, patientContext]);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('https://orl-backend-api.onrender.com/api/rag-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: query,
          context: patientContext 
        }),
      });

      const data = await res.json();
      setResponse(data.answer);
    } catch (err) {
      setResponse("⚠️ Errore di connessione al database RAG EBM.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-full shadow-lg shadow-indigo-300 transition-all duration-300 hover:scale-105"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-bold">EBM Quick-Assist (⌘K)</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header Modale */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">EBM Clinical Copilot</h3>
              <p className="text-[10px] text-slate-500">Database RAG Validato (EPOS, AAO-HNS, SIO)</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input & Context Banner */}
        <div className="p-4 space-y-3 bg-white border-b border-slate-100">
          {patientContext?.diagnosi && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Contesto acquisito: <strong>{patientContext.diagnosi}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Chiedi un protocollo o linea guida..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition disabled:opacity-50"
            >
              {loading ? "Ricerca in corso..." : "Consulta EBM"}
            </button>
          </div>
        </div>

        {/* Output RAG */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {loading && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Interrogazione del database documentale chiuso in corso...
            </div>
          )}

          {response && (
            <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
              <div className="prose prose-slate text-xs max-w-none">
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>

              {/* Disclaimer Legale Obbligatorio */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[10px] text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Strumento Decisionale di Supporto:</strong> Le informazioni sintetizzate provengono da linee guida certificate ma non sostituiscono il giudizio clinico autonomo del medico.
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}