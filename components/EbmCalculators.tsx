'use client';

import { useState } from 'react';
import { 
  Pill, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  Calculator, 
  Flame, 
  Scale 
} from 'lucide-react';

// --- STEROID CALCULATOR DATA ---
interface Steroid {
  id: string;
  name: string;
  eqFactor: number; // Equivalenza rispetto a 5mg di Prednisone
  halfLife: string;
  type: string;
}

const STEROIDS: Steroid[] = [
  { id: 'prednisone', name: 'Prednisone (es. Deltacortene)', eqFactor: 5, halfLife: '12-36 ore', type: 'Intermedia' },
  { id: 'metilprednisolone', name: 'Metilprednisolone (es. Urbason, Medrol)', eqFactor: 4, halfLife: '12-36 ore', type: 'Intermedia' },
  { id: 'deflazacort', name: 'Deflazacort (es. Deflan)', eqFactor: 6, halfLife: '12-36 ore', type: 'Intermedia' },
  { id: 'desametasone', name: 'Desametasone (es. Decadron)', eqFactor: 0.75, halfLife: '36-54 ore', type: 'Lunga' },
  { id: 'betametasone', name: 'Betametasone (es. Bentelan)', eqFactor: 0.60, halfLife: '36-54 ore', type: 'Lunga' },
  { id: 'idrocortisone', name: 'Idrocortisone (es. Flocort)', eqFactor: 20, halfLife: '8-12 ore', type: 'Breve' },
];

export default function EbmCalculators() {
  const [activeCalc, setActiveCalc] = useState<'steroids' | 'tnm_oral' | 'tnm_larynx' | 'pack_years' | 'bmi'>('steroids');

  // --- STEROID STATE ---
  const [selectedSteroid, setSelectedSteroid] = useState<string>('prednisone');
  const [inputDose, setInputDose] = useState<number>(25);

  // --- TNM ORAL CAVITY STATE (AJCC 8th) ---
  const [oralSize, setOralSize] = useState<number>(1.8);
  const [oralDoi, setOralDoi] = useState<number>(4);
  const [oralT4Type, setOralT4Type] = useState<'none' | 't4a' | 't4b'>('none');
  const [oralN, setOralN] = useState<string>('N0');
  const [oralM, setOralM] = useState<string>('M0');

  // --- TNM LARYNX STATE ---
  const [larynxSubsite, setLarynxSubsite] = useState<'glottis' | 'supraglottis'>('glottis');
  const [larynxT, setLarynxT] = useState<string>('T1a');
  const [larynxN, setLarynxN] = useState<string>('N0');
  const [larynxM, setLarynxM] = useState<string>('M0');

  // --- PACK-YEARS STATE ---
  const [cigsPerDay, setCigsPerDay] = useState<number>(20);
  const [yearsSmoked, setYearsSmoked] = useState<number>(30);

  // --- BMI STATE ---
  const [bmiWeightKg, setBmiWeightKg] = useState<number>(70);
  const [bmiHeightCm, setBmiHeightCm] = useState<number>(170);

  // --- CALCULATIONS ---
  // Steroid Equivalents
  const currentSteroid = STEROIDS.find(s => s.id === selectedSteroid) || STEROIDS[0];
  const calculateEquivalent = (targetFactor: number) => {
    if (!inputDose || inputDose <= 0) return '0';
    const eq = (inputDose / currentSteroid.eqFactor) * targetFactor;
    return eq < 1 ? eq.toFixed(2) : eq.toFixed(1);
  };

  // Oral Cavity T Stage calculation (AJCC 8th Ed)
  const getOralTStage = () => {
    if (oralT4Type === 't4b') return 'T4b';
    if (oralT4Type === 't4a') return 'T4a';

    if (oralSize <= 2) {
      if (oralDoi <= 5) return 'T1';
      if (oralDoi <= 10) return 'T2';
      return 'T3';
    } else if (oralSize <= 4) {
      if (oralDoi <= 10) return 'T2';
      return 'T3';
    } else {
      if (oralDoi <= 10) return 'T3';
      return 'T4a';
    }
  };

  // Stage Grouping helper
  const getStageGroup = (t: string, n: string, m: string) => {
    if (m === 'M1') return 'Stadio IVC';
    if (n === 'N3a' || n === 'N3b') return 'Stadio IVB';
    if (t === 'T4b') return 'Stadio IVB';

    if (t === 'T4a' || n === 'N2a' || n === 'N2b' || n === 'N2c') return 'Stadio IVA';
    if (t === 'T3' || n === 'N1') return 'Stadio III';
    if (t === 'T2' && n === 'N0') return 'Stadio II';
    if ((t === 'T1' || t === 'T1a' || t === 'T1b') && n === 'N0') return 'Stadio I';

    return 'Stadio Selezionato';
  };

  // Pack-Years Calculation
  const packYears = ((cigsPerDay / 20) * yearsSmoked).toFixed(1);

  // BMI Calculation
  const bmiHeightM = bmiHeightCm / 100;
  const bmiValue = bmiHeightM > 0 ? (bmiWeightKg / (bmiHeightM * bmiHeightM)).toFixed(1) : '0';

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Sottopeso', color: 'bg-amber-500/30 text-amber-300 border-amber-500/40' };
    if (bmi < 25.0) return { label: 'Normopeso', color: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40' };
    if (bmi < 30.0) return { label: 'Sovrappeso', color: 'bg-amber-500/30 text-amber-300 border-amber-500/40' };
    return { label: 'Obesità', color: 'bg-rose-500/30 text-rose-300 border-rose-500/40' };
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-5">
      
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Calcolatori Clinici EBM</h2>
            <p className="text-[11px] text-slate-500">Staging Oncologico, Posologia & Parametri Clinici</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveCalc('steroids')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeCalc === 'steroids' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" /> Steroidi
          </button>
          <button
            onClick={() => setActiveCalc('tnm_oral')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeCalc === 'tnm_oral' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Cavo Orale
          </button>
          <button
            onClick={() => setActiveCalc('tnm_larynx')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeCalc === 'tnm_larynx' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Laringe
          </button>
          <button
            onClick={() => setActiveCalc('pack_years')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeCalc === 'pack_years' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Pack-Years
          </button>
          <button
            onClick={() => setActiveCalc('bmi')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeCalc === 'bmi' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> BMI
          </button>
        </div>
      </div>

      {/* 1. CALCOLATORE CORTICOSTEROIDI */}
      {activeCalc === 'steroids' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Sostanza / Categoria Selezionata
              </label>
              <select
                value={selectedSteroid}
                onChange={(e) => setSelectedSteroid(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                {STEROIDS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Dosaggio Somministrato (mg)
              </label>
              <input
                type="number"
                step="0.5"
                value={inputDose}
                onChange={(e) => setInputDose(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {STEROIDS.map((s) => {
              const isSelected = s.id === selectedSteroid;
              return (
                <div
                  key={s.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-[10px] font-bold text-slate-500 truncate">{s.name.split(' ')[0]}</p>
                  <p className="text-lg font-black text-slate-900 mt-1">
                    {calculateEquivalent(s.eqFactor)} <span className="text-xs font-semibold text-slate-500">mg</span>
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1">Emivita: {s.halfLife}</p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 italic">
            * Conversione basata su equivalenza antinfiammatoria standard: 5mg Prednisone = 4mg Metilprednisolone = 6mg Deflazacort = 0.75mg Desametasone = 0.60mg Betametasone.
          </p>
        </div>
      )}

      {/* 2. STAGING CAVO ORALE */}
      {activeCalc === 'tnm_oral' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Dimensione Tumore (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={oralSize}
                onChange={(e) => setOralSize(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Profondità d'Invasione - DOI (mm)
              </label>
              <input
                type="number"
                step="1"
                value={oralDoi}
                onChange={(e) => setOralDoi(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Invasione Strutture (T4)
              </label>
              <select
                value={oralT4Type}
                onChange={(e) => setOralT4Type(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="none">Nessuna invasione corticale/spazi</option>
                <option value="t4a">T4a: Corticale ossea, lingua profonda, seno masc.</option>
                <option value="t4b">T4b: Spazio masticatorio, base cranica, carotide</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Noduli Linfatici (N)</label>
              <select
                value={oralN}
                onChange={(e) => setOralN(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="N0">N0: Nessuna metastasi linfonodale regionale</option>
                <option value="N1">N1: Singolo ipsilaterale ≤ 3 cm (ENE-)</option>
                <option value="N2a">N2a: Singolo ipsilaterale 3-6 cm (ENE-)</option>
                <option value="N2b">N2b: Multipli ipsilaterali ≤ 6 cm (ENE-)</option>
                <option value="N2c">N2c: Bilaterali o controlaterali ≤ 6 cm (ENE-)</option>
                <option value="N3a">N3a: Linfonodo &gt; 6 cm (ENE-)</option>
                <option value="N3b">N3b: Qualsiasi linfonodo con ENE+ clinicamente visibile</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Metastasi a Distanza (M)</label>
              <select
                value={oralM}
                onChange={(e) => setOralM(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="M0">M0: Nessuna metastasi a distanza</option>
                <option value="M1">M1: Metastasi a distanza presenti</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Risultato Staging Cavo Orale (AJCC 8a)</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-extrabold text-white">
                  {getOralTStage()} {oralN} {oralM}
                </span>
                <span className="text-xs bg-indigo-500/30 text-indigo-200 font-bold px-3 py-1 rounded-full border border-indigo-400/30">
                  {getStageGroup(getOralTStage(), oralN, oralM)}
                </span>
              </div>
            </div>
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      )}

      {/* 3. STAGING LARINGE */}
      {activeCalc === 'tnm_larynx' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sede d'Origine</label>
              <select
                value={larynxSubsite}
                onChange={(e) => setLarynxSubsite(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="glottis">Glottide</option>
                <option value="supraglottis">Sopraglottide</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Estensione Categoria T</label>
              <select
                value={larynxT}
                onChange={(e) => setLarynxT(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="T1a">T1a: Una sola corda vocale (mobilità normale)</option>
                <option value="T1b">T1b: Entrambe le corde vocali (mobilità normale)</option>
                <option value="T2">T2: Estensione a Sopra/Sottoglottide o ridotta mobilità</option>
                <option value="T3">T3: Fissazione cordale o invasione spazio paraglottico</option>
                <option value="T4a">T4a: Invasione cartilagine tiroide, tessuti collo, trachea</option>
                <option value="T4b">T4b: Invasione spazio prevertebrale, carotide, mediastino</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Stato Linfonodale (N)</label>
              <select
                value={larynxN}
                onChange={(e) => setLarynxN(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="N0">N0: Linfonodi negativi</option>
                <option value="N1">N1: Singolo ipsilaterale ≤ 3 cm</option>
                <option value="N2a">N2a: Singolo ipsilaterale 3-6 cm</option>
                <option value="N2b">N2b: Multipli ipsilaterali ≤ 6 cm</option>
                <option value="N2c">N2c: Bilaterali o controlaterali ≤ 6 cm</option>
                <option value="N3b">N3b: Estensione extranodale clinicamente evidente (ENE+)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Stadio Finale Laringe</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-extrabold text-white">
                  {larynxT} {larynxN} {larynxM}
                </span>
                <span className="text-xs bg-indigo-500/30 text-indigo-200 font-bold px-3 py-1 rounded-full border border-indigo-400/30">
                  {getStageGroup(larynxT, larynxN, larynxM)}
                </span>
              </div>
            </div>
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      )}

      {/* 4. CALCOLATORE PACK-YEARS */}
      {activeCalc === 'pack_years' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Sigarette al Giorno
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={cigsPerDay}
                onChange={(e) => setCigsPerDay(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">1 pacchetto = 20 sigarette</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Anni di Fumo
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={yearsSmoked}
                onChange={(e) => setYearsSmoked(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Carico Tabagico Calcolato</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-black text-white">{packYears}</span>
                <span className="text-xs text-slate-300 font-semibold">Pack-Years</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  parseFloat(packYears) >= 20 
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' 
                    : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {parseFloat(packYears) >= 20 ? 'Rischio Oncologico Elevato (≥20 PY)' : 'Rischio Moderato/Basso'}
                </span>
              </div>
            </div>
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      )}

      {/* 5. CALCOLATORE BMI (INDICE DI MASSA CORPOREA) */}
      {activeCalc === 'bmi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={bmiWeightKg}
                onChange={(e) => setBmiWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Altezza (cm)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={bmiHeightCm}
                onChange={(e) => setBmiHeightCm(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Indice di Massa Corporea (BMI)</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-black text-white">{bmiValue}</span>
                <span className="text-xs text-slate-400 font-semibold">kg/m²</span>
                {(() => {
                  const cat = getBmiCategory(parseFloat(bmiValue));
                  return (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${cat.color}`}>
                      {cat.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            <Scale className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      )}

    </div>
  );
}