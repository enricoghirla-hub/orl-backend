'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { 
  Search, Plus, BookOpen, FileText, Tag, Clock, 
  Ear, Activity, Wind, MicVocal, Skull, Stethoscope, Sparkles,
  ShieldCheck, Bold, Italic, Underline as UnderlineIcon, 
  Trash2, Save, Send, Bot, ChevronRight, Copy, Check, ArrowUpRight, Zap, Calculator
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import EbmCalculators from "../components/EbmCalculators";

// Configurazione del Nuovo Font Premium (Plus Jakarta Sans)
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

interface Note {
  id: string;
  title: string;
  section: string;
  content_json: any;
  tags: string[];
  updated_at: string;
}

interface Guideline {
  id: string;
  title: string;
  society: string;
  year: number;
  category: string;
  summary: string;
  link?: string;
}

const CAPITOLI_ORL: Record<string, { icon: any; badge: string }> = {
  'Otologia': { icon: Ear, badge: 'bg-amber-50 text-amber-700 border-amber-200/80' },
  'Otoneurologia & Vestibologia': { icon: Activity, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' },
  'Rinologia & Paranasali': { icon: Wind, badge: 'bg-teal-50 text-teal-700 border-teal-200/80' },
  'Faringo-Laringologia': { icon: MicVocal, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' },
  'Patologia Cervico-Facciale': { icon: Skull, badge: 'bg-rose-50 text-rose-700 border-rose-200/80' },
  'Oncologia Testa-Collo': { icon: Stethoscope, badge: 'bg-purple-50 text-purple-700 border-purple-200/80' },
  'ORL Pediatrica': { icon: Sparkles, badge: 'bg-pink-50 text-pink-700 border-pink-200/80' },
};

const INITIAL_GUIDELINES: Guideline[] = [
  {
    id: 'nccn-1',
    title: 'NCCN Guidelines: Head and Neck Cancers - Oral Cavity',
    society: 'NCCN v2.2025',
    year: 2025,
    category: 'Oncologia Testa-Collo',
    summary: 'Algoritmi operativi per Carcinoma Squamocellulare (HPV+ / HPV-). Indicazioni a resezione chirurgica primaria e svuotamento cervicale.',
    link: 'https://www.nccn.org'
  },
  {
    id: 'nccn-2',
    title: 'Laryngeal & Hypopharyngeal Cancer Preservation',
    society: 'NCCN v1.2025',
    year: 2025,
    category: 'Oncologia Testa-Collo',
    summary: 'Protocolli di organ preservation (RT/CRT vs Laser Transorale/TORS) per stadi T1-T2.',
    link: 'https://www.nccn.org'
  },
  {
    id: '4',
    title: 'Ipoacusia Improvvisa Sensorineurale (SSNHL)',
    society: 'AAO-HNS CPG',
    year: 2024,
    category: 'Otologia',
    summary: 'Diagnosi tempestiva, audiometria entro 14 giorni, steroide sistemico vs intratimpanico ed RM encefalo.',
  },
  {
    id: '5',
    title: 'CRSwNP e Biologici in Otoneurologia/Rinologia',
    society: 'EPOS 2023',
    year: 2023,
    category: 'Rinologia & Paranasali',
    summary: 'Criteri di eleggibilità per Dupilumab e Omalizumab. Indicazioni chirurgiche FESS revision.',
  }
];

const SUGGESTED_PROMPTS = [
  "Dosaggio steroide intratimpanico SSNHL",
  "Criteri EPOS 2023 uso biologici CRSwNP",
  "TORS vs Laser per T1-T2 Orofaringe HPV+",
  "Staging TNM 8a Edizione Laringe"
];

export default function StudioDashboard() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'guidelines' | 'ai'>('workspace');
  const [showCalculatorWidget, setShowCalculatorWidget] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('Tutti');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; time: string }[]>([
    { 
      role: 'ai', 
      text: 'Buongiorno Dottore. Sono pronto per assistere la sua attività clinica. Che cosa vogliamo consultare o sintetizzare oggi?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[380px] text-slate-800 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-inner font-sans text-sm leading-relaxed',
      },
    },
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (editor && selectedNote) {
      editor.commands.setContent(selectedNote.content_json || `<p>${selectedNote.title}</p>`);
    }
  }, [selectedNote, editor]);

  const fetchNotes = async () => {
    const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (!error && data) {
      setNotes(data);
      if (data.length > 0 && !selectedNote) setSelectedNote(data[0]);
    }
  };

  const handleCreateNote = async () => {
    const newNote = {
      title: 'Nuovo Referto / Scheda',
      section: selectedSection === 'Tutti' ? 'Otologia' : selectedSection,
      content_json: '<p>Inserire qui note cliniche, obiettività o dati anamnestici...</p>',
      tags: ['Bozza'],
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('notes').insert([newNote]).select();
    if (!error && data) {
      setNotes([data[0], ...notes]);
      setSelectedNote(data[0]);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote || !editor) return;
    setIsSaving(true);
    
    const updatedContent = editor.getHTML();
    const { error } = await supabase
      .from('notes')
      .update({ 
        content_json: updatedContent, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', selectedNote.id);

    if (!error) {
      setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, content_json: updatedContent, updated_at: new Date().toISOString() } : n));
    }
    setIsSaving(false);
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) {
      const updated = notes.filter(n => n.id !== id);
      setNotes(updated);
      if (selectedNote?.id === id) setSelectedNote(updated[0] || null);
    }
  };

  const handleSendAiMessage = async (customPrompt?: string) => {
    const query = customPrompt || chatInput;
    if (!query.trim() || isAiThinking) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', text: query, time: timeStr }]);
    if (!customPrompt) setChatInput('');
    setIsAiThinking(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch('https://orl-backend-api.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Errore HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: data.reply || "⚠️ Nessuna risposta valida ricevuta dal backend.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error: any) {
      clearTimeout(timeoutId);
      let errorText = '⚠️ Impossibile collegarsi al backend Cloud su Render. Verifica la connessione.';
      if (error.name === 'AbortError') {
        errorText = '⚠️ Il server sta impiegando troppo tempo a rispondere (Cold Start di Render in corso). Attendi circa 30 secondi e invia nuovamente la domanda.';
      }

      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: errorText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSection = selectedSection === 'Tutti' || n.section === selectedSection;
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [notes, selectedSection, searchQuery]);

  const filteredGuidelines = useMemo(() => {
    return INITIAL_GUIDELINES.filter(g => {
      const matchesSection = selectedSection === 'Tutti' || g.category === selectedSection;
      const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.society.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [selectedSection, searchQuery]);

  return (
    <div className={`min-h-screen bg-[#f8fafc] text-slate-900 antialiased pb-12 selection:bg-indigo-100 selection:text-indigo-900 ${plusJakartaSans.className}`}>
      
      {/* Floating Header */}
      <div className="max-w-7xl mx-auto pt-6 px-6">
        <header className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-3 px-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">ORL Studio</h1>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">EBM 2.0</span>
              </div>
              <p className="text-[11px] text-slate-500">Piattaforma Clinica & Assistente Intelligente</p>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'workspace' 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Workspace Clinico
            </button>
            <button
              onClick={() => setActiveTab('guidelines')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'guidelines' 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Linee Guida EBM
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'ai' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Copilot
            </button>
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium">Cloud Backend: Render</span>
            </div>
          </div>

        </header>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-6">

        {/* Filter Pills & Global Search */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cerca schede, diagnosi, o linee guida..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedSection('Tutti')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  selectedSection === 'Tutti' 
                    ? 'bg-indigo-600 text-white font-semibold' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tutti i Capitoli
              </button>
              {Object.entries(CAPITOLI_ORL).map(([name, meta]) => {
                const Icon = meta.icon;
                const isSelected = selectedSection === name;
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedSection(name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                      isSelected 
                        ? `${meta.badge} font-bold shadow-xs` 
                        : 'bg-slate-50 text-slate-600 border-slate-200/60 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {name}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* TAB 1: WORKSPACE CLINICO CON CALCOLATORI INTEGRATI */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            
            {/* Widget Calcolatori Inserito nella Pagina Principale */}
            <div className="transition-all">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setShowCalculatorWidget(!showCalculatorWidget)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition shadow-xs"
                >
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                  {showCalculatorWidget ? "Nascondi Calcolatori EBM" : "Mostra Calcolatori EBM (Steroidi, TNM, Pack-Years, BMI)"}
                </button>
              </div>

              {showCalculatorWidget && <EbmCalculators />}
            </div>

            {/* Sezione Note / Refertazione */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Lista Schede */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-slate-800">Dossier & Schede ({filteredNotes.length})</h2>
                  <button 
                    onClick={handleCreateNote}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nuova Scheda
                  </button>
                </div>

                <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                  {filteredNotes.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs">Nessuna scheda trovata.</p>
                    </div>
                  ) : (
                    filteredNotes.map((note) => {
                      const isSelected = selectedNote?.id === note.id;
                      return (
                        <div
                          key={note.id}
                          onClick={() => setSelectedNote(note)}
                          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-white border-indigo-500/80 shadow-md ring-2 ring-indigo-500/10'
                              : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {note.section}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(note.updated_at).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-800 mb-2">
                            {note.title}
                          </h3>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              {note.tags?.map((t) => (
                                <span key={t} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Tag className="w-2.5 h-2.5" /> {t}
                                </span>
                              ))}
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                              className="text-slate-400 hover:text-rose-600 p-1 transition"
                              title="Elimina"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Editor Form */}
              <div className="lg:col-span-8">
                {selectedNote ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div className="w-full">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedNote.section}</span>
                        <input 
                          type="text" 
                          value={selectedNote.title} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedNote({ ...selectedNote, title: val });
                            setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, title: val } : n));
                          }}
                          className="text-lg font-bold text-slate-900 bg-transparent focus:outline-none focus:border-b border-indigo-500 w-full"
                        />
                      </div>

                      <button 
                        onClick={handleSaveNote}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-sm disabled:opacity-50 shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" /> {isSaving ? "Salvataggio..." : "Salva Modifiche"}
                      </button>
                    </div>

                    {/* Rich Text Toolbar */}
                    {editor && (
                      <div className="flex items-center gap-1 border border-slate-200/60 p-1.5 rounded-xl bg-slate-50">
                        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded-lg text-slate-600 hover:bg-white transition ${editor.isActive('bold') ? 'bg-white text-indigo-600 font-bold shadow-xs' : ''}`}><Bold className="w-4 h-4"/></button>
                        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded-lg text-slate-600 hover:bg-white transition ${editor.isActive('italic') ? 'bg-white text-indigo-600 shadow-xs' : ''}`}><Italic className="w-4 h-4"/></button>
                        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded-lg text-slate-600 hover:bg-white transition ${editor.isActive('underline') ? 'bg-white text-indigo-600 shadow-xs' : ''}`}><UnderlineIcon className="w-4 h-4"/></button>
                      </div>
                    )}

                    <EditorContent editor={editor} />
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-slate-200 rounded-3xl p-8 text-center bg-white">
                    <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 text-xs">Seleziona una scheda dalla colonna di sinistra per iniziare.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: LINEE GUIDA */}
        {activeTab === 'guidelines' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredGuidelines.map((gl) => (
                <div 
                  key={gl.id} 
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 hover:shadow-md hover:border-indigo-300 transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                        {gl.society} • {gl.year}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(`${gl.title}\n${gl.summary}`, gl.id)}
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        {copiedId === gl.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mb-2">
                      {gl.title}
                    </h3>

                    <p className="text-slate-600 text-xs leading-relaxed mb-4">
                      {gl.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">{gl.category}</span>
                    {gl.link && (
                      <a 
                        href={gl.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline"
                      >
                        NCCN Portal <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI COPILOT */}
        {activeTab === 'ai' && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl flex flex-col h-[650px] shadow-sm overflow-hidden">
            
            {/* AI Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-xs">AI Copilot (Gemini 3.6)</h2>
                  <p className="text-[10px] text-slate-500">FastAPI Cloud Service</p>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Online
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white font-medium rounded-tr-xs' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-1 text-[9px] opacity-70">
                      <span className="font-bold">{m.role === 'user' ? 'Clinico' : 'AI Copilot'}</span>
                      <span>{m.time}</span>
                    </div>

                    {/* RENDER CON REACT-MARKDOWN PER RISPOSTE FORMATTATE */}
                    {m.role === 'ai' ? (
                      <div className="prose prose-slate text-xs sm:text-sm max-w-none leading-relaxed">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{m.text}</div>
                    )}
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-slate-500 text-xs bg-white p-3 rounded-xl border border-slate-200 w-fit">
                  <Bot className="w-4 h-4 text-indigo-600 animate-spin" />
                  Elaborazione risposta EBM...
                </div>
              )}
            </div>

            {/* SUGGERIMENTI */}
            <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-slate-400 font-semibold uppercase whitespace-nowrap">SUGGERIMENTI:</span>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendAiMessage(prompt)}
                  disabled={isAiThinking}
                  className="text-[11px] bg-white hover:bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200 whitespace-nowrap transition flex items-center gap-1 disabled:opacity-50"
                >
                  <ChevronRight className="w-3 h-3 text-indigo-500" />
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Scrivi un quesito o richiedi una sintesi EBM..."
                  value={chatInput}
                  disabled={isAiThinking}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendAiMessage()}
                  disabled={isAiThinking || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Invia
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}