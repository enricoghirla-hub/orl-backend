'use client';

import { useState } from 'react';
import { 
  Pill, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  Calculator, 
  Flame, 
  Scale,
  Baby,
  Dna,
  Target
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
  const [activeCalc, setActiveCalc] = useState<
    'steroids' | 'pediatric' | 'pack_years' | 'bmi' | 'tnm_oral' | 'tnm_oropharynx' | 'tnm_larynx' | 'tnm_nasopharynx'
  >('steroids');

  // --- STEROID STATE ---
  const [selectedSteroid, setSelectedSteroid] = useState<string>('prednisone');
  const [inputDose, setInputDose] = useState<number>(25);

  // --- PEDIATRIC STATE ---
  const [pedsWeight, setPedsWeight] = useState<number>(15);
  const [pedsDrug, setPedsDrug] = useState<'paracetamol' | 'amox_clav'>('paracetamol');

  // --- TNM ORAL CAVITY STATE (AJCC 9th Ed) ---
  const [oralSize, setOralSize] = useState<number>(1.8);
  const [oralDoi, setOralDoi] = useState<number>(4);
  const [oralT4Type, setOralT4Type] = useState<'none' | 't4a' | 't4b'>('none');
  const [oralN, setOralN] = useState<string>('N0');
  const [oralM, setOralM] = useState<string>('M0');

  // --- TNM OROPHARYNX STATE (AJCC 9th Ed) ---
  const [oroHpv, setOroHpv] = useState<'p16_pos' | 'p16_neg'>('p16_pos');
  const [oroT, setOroT] = useState<string>('T1');
  const [oroN, setOroN] = useState<string>('N0');
  const [oroM, setOroM] = useState<string>('M0');

  // --- TNM LARYNX STATE (AJCC 9th Ed) ---
  const [larynxSubsite, setLarynxSubsite] = useState<'glottis' | 'supraglottis' | 'subglottis'>('glottis');
  const [larynxT, setLarynxT] = useState<string>('T1a');
  const [larynxN, setLarynxN] = useState<string>('N0');
  const [larynxM, setLarynxM] = useState<string>('M0');

  // --- TNM NASOPHARYNX STATE (AJCC 9th Ed) ---
  const [nasoT, setNasoT] = useState<string>('T1');
  const [nasoN, setNasoN] = useState<string>('N0');
  const [nasoM, setNasoM] = useState<string>('M0');

  // --- PACK-YEARS STATE ---
  const [cigsPerDay, setCigsPerDay] = useState<number>(20);
  const [yearsSmoked, setYearsSmoked] = useState<number>(30);

  // --- BMI STATE ---
  const [bmiWeightKg, setBmiWeightKg] = useState<number>(70);
  const [bmiHeightCm, setBmiHeightCm] = useState<number>(170);

  // --- CALCULATIONS ---

  // 1. Steroid Equivalents
  const currentSteroid = STEROIDS.find(s => s.id === selectedSteroid) || STEROIDS[0];
  const calculateEquivalent = (targetFactor: number) => {
    if (!inputDose || inputDose <= 0) return '0';
    const eq = (inputDose / currentSteroid.eqFactor) * targetFactor;
    return eq < 1 ? eq.toFixed(2) : eq.toFixed(1);
  };

  // 2. Pediatric Calculation
  const getPediatricDose = () => {
    if (pedsDrug === 'paracetamol') {
      const singleMg = pedsWeight * 15;
      const singleMl = (singleMg / 32).toFixed(1); // Sciroppo 160 mg / 5 ml (32 mg/ml)
      const maxDaily = pedsWeight * 60;
      return {
        singleMg: singleMg.toFixed(0),
        singleMl,
        freq: 'Ogni 6 ore (max 4 somministrazioni/die)',
        maxDaily: `${maxDaily.toFixed(0)} mg/die`,
        formulation: 'Sciroppo 160 mg / 5 ml (Tachipirina / Efferalgan)'
      };
    } else {
      const dailyMg = pedsWeight * 80; // 80 mg/kg/die
      const singleMg = dailyMg / 3;
      const singleMl = (singleMg / 80).toFixed(1); // Sospensione 400 mg + 57 mg / 5 ml (80 mg/ml Amox)
      return {
        singleMg: singleMg.toFixed(0),
        singleMl,
        freq: 'Ogni 8 ore (3 somministrazioni/die)',
        maxDaily: `${dailyMg.toFixed(0)} mg/die`,
        formulation: 'Sospensione 400 mg + 57 mg / 5 ml (Augmentin / Clavulin)'
      };
    }
  };

  // 3. Oral Cavity T Stage calculation (AJCC 9th Ed: incorpora DOI)
  const getOralTStage = () => {
    if (oralT4Type === 't4b') return 'T4b';
    if (oralT4Type === 't4a' || oralDoi > 20) return 'T4a';

    if (oralSize <= 2) {
      if (oralDoi <= 5) return 'T1';
      if (oralDoi <= 10) return 'T2';
      return 'T3';
    } else if (oralSize <= 4) {
      if (oralDoi <= 10) return 'T2';
      return 'T3';
    } else {
      if (oralDoi <= 10) return 'T3';
      return 'T3';
    }
  };

  // 4. Oropharynx Stage Grouping (AJCC 9th Ed)
  const getOropharynxStageGroup = () => {
    if (oroM === 'M1') return 'Stadio IV';

    if (oroHpv === 'p16_pos') {
      // Staging Clinico p16+ (AJCC 9th)
      if (oroT === 'T4' || oroN === 'N3') return 'Stadio III';
      if (oroT === 'T3' || oroN === 'N2') return 'Stadio II';
      return 'Stadio I';
    } else {
      // Staging p16- (Standard Head & Neck AJCC 9th)
      if (oroT === 'T4b' || oroN === 'N3') return 'Stadio IVB';
      if (oroT === 'T4a' || ['N2a', 'N2b', 'N2c'].includes(oroN)) return 'Stadio IVA';
      if (oroT === 'T3' || oroN === 'N1') return 'Stadio III';
      if (oroT === 'T2' && oroN === 'N0') return 'Stadio II';
      return 'Stadio I';
    }
  };

  // 5. Nasopharynx Stage Grouping (AJCC 9th Ed)
  const getNasopharynxStageGroup = () => {
    if (nasoM === 'M1') return 'Stadio IVB';
    if (nasoT === 'T4' || nasoN === 'N3') return 'Stadio IVA';
    if (nasoT === 'T3' || nasoN === 'N2') return 'Stadio III';
    if (nasoT === 'T2' || nasoN === 'N1') return 'Stadio II';
    if (nasoT === 'T1' && nasoN === 'N0') return 'Stadio I';
    return 'Stadio Selezionato';
  };

  // 6. General Stage Grouping helper (AJCC 9th Ed per Oral Cavity e Larynx)
  const getStageGroup = (t: string, n: string, m: string) => {
    if (m === 'M1') return 'Stadio IVC';
    if (n === 'N3a' || n === 'N3b' || n === 'N3' || t === 'T4b') return 'Stadio IVB';
    if (t === 'T4a' || ['N2a', 'N2b', 'N2c', 'N2'].includes(n)) return 'Stadio IVA';
    if (t === 'T3' || n === 'N1') return 'Stadio III';
    if (t === 'T2' && n === 'N0') return 'Stadio II';
    if (['T1', 'T1a', 'T1b'].includes(t) && n === 'N0') return 'Stadio I';

    return 'Stadio Selezionato';
  };

  // 7. Pack-Years Calculation
  const packYears = ((cigsPerDay / 20) * yearsSmoked).toFixed(1);

  // 8. BMI Calculation
  const bmiHeightM = bmiHeightCm / 100;
  const bmiValue = bmiHeightM > 0 ? (bmiWeightKg / (bmiHeightM * bmiHeightM)).toFixed(1) : '0';

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Sottopeso', color: 'bg-amber-500/30 text-amber-300 border-amber-500/40' };
    if (bmi < 25.0) return { label: 'Normopeso', color: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40' };
    if (bmi < 30.0) return { label: 'Sovrappeso', color: 'bg-amber-500/30 text-amber-300 border-amber-500/40' };
    return { label: 'Obesità', color: 'bg-rose-500/30 text-rose-300 border-rose-500/40' };
  };

  const pedsInfo = getPediatricDose();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Calcolatori Clinici EBM</h2>
            <p className="text-[11px] text-slate-500">Staging Oncologico (AJCC 9ª Ed), Posologia & Parametri Clinici</p>
          </div>
        </div>

        {/* Tab Switcher Raggruppato */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sezione Generali & Farmaci */}
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
              onClick={() => setActiveCalc('pediatric')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeCalc === 'pediatric' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Baby className="w-3.5 h-3.5" /> Pediatria
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

          {/* SEZIONE STAGING ONCOLOGICO AJCC 9ª ED */}
          <div className="flex flex-wrap items-center gap-1 bg-indigo-50/70 border border-indigo-100/80 p-1 rounded-xl text-xs font-semibold">
            <span className="text-[10px] font-bold text-indigo-500 uppercase px-1 hidden sm:inline">Onco (AJCC 9ª):</span>
            
            <button
              onClick={() => setActiveCalc('tnm_oral')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeCalc === 'tnm_oral' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-indigo-900 hover:text-indigo-600'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Cavo Orale
            </button>

            <button
              onClick={() => setActiveCalc('tnm_oropharynx')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeCalc === 'tnm_oropharynx' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-indigo-900 hover:text-indigo-600'
              }`}
            >
              <Dna className="w-3.5 h-3.5" /> Orofaringe
            </button>

            <button
              onClick={() => setActiveCalc('tnm_nasopharynx')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeCalc === 'tnm_nasopharynx' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-indigo-900 hover:text-indigo-600'
              }`}
            >
              <Target className="w-3.5 h-3.5" /> Rinofaringe
            </button>

            <button
              onClick={() => setActiveCalc('tnm_larynx')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeCalc === 'tnm_larynx' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-indigo-900 hover:text-indigo-600'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Laringe
            </button>
          </div>
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

      {/* 2. CALCOLATORE POSOLOGICO PEDIATRICO */}
      {activeCalc === 'pediatric' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Farmaco Selezionato
              </label>
              <select
                value={pedsDrug}
                onChange={(e) => setPedsDrug(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="paracetamol">Paracetamolo (15 mg/kg/dose)</option>
                <option value="amox_clav">Amoxicillina + Ac. Clavulanico (80 mg/kg/die)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase">Peso Corporeo (kg)</label>
                <span className="text-xs font-black text-indigo-600">{pedsWeight} kg</span>
              </div>
              <input
                type="range"
                min="3"
                max="50"
                step="0.5"
                value={pedsWeight}
                onChange={(e) => setPedsWeight(parseFloat(e.target.value) || 0)}
                className="w-full accent-indigo-600 cursor-pointer mt-2"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Dosaggio Calcolato per Dose</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{pedsInfo.singleMl} ml</span>
                <span className="text-xs text-indigo-300 font-bold">({pedsInfo.singleMg} mg)</span>
              </div>
              <p className="text-xs text-slate-300 font-medium"><strong>Frequenza:</strong> {pedsInfo.freq}</p>
              <p className="text-[11px] text-slate-400"><strong>Formulazione:</strong> {pedsInfo.formulation}</p>
              <p className="text-[10px] text-slate-500 pt-1">Limite massimo: {pedsInfo.maxDaily}</p>
            </div>
            <Baby className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
      )}

      {/* 3. STAGING CAVO ORALE (AJCC 9ª Ed) */}
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
              <p className="text-[9px] text-slate-400 mt-1">*DOI &gt; 20mm definisce automaticamente T4a (AJCC 9ª)</p>
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
                <option value="t4a">T4a: Corticale ossea, lingua profonda, seno masc., cute</option>
                <option value="t4b">T4b: Spazio masticatorio, lamina pterigoidea, base cranica, carotide</option>
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
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Risultato Staging Cavo Orale (AJCC 9ª Ed)</span>
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

      {/* 4. STAGING OROFARINGE (p16+ / p16-) (AJCC 9ª Ed) */}
      {activeCalc === 'tnm_oropharynx' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Assetto p16 (HPV)</label>
              <select
                value={oroHpv}
                onChange={(e) => setOroHpv(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              >
                <option value="p16_pos">p16+ (HPV-correlato)</option>
                <option value="p16_neg">p16- (Non HPV)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tumore Primitivo (T)</label>
              <select
                value={oroT}
                onChange={(e) => setOroT(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="T1">T1: Tumore ≤ 2 cm</option>
                <option value="T2">T2: Tumore &gt; 2 cm e ≤ 4 cm</option>
                <option value="T3">T3: Tumore &gt; 4 cm o estensione alla superficie linguale dell'epiglottide</option>
                {oroHpv === 'p16_pos' ? (
                  <option value="T4">T4: Invasione laringe, muscoli lingua, pterigoideo mediale, palato duro, ecc.</option>
                ) : (
                  <>
                    <option value="T4a">T4a: Invasione laringe, muscoli della lingua, pterigoideo, ecc.</option>
                    <option value="T4b">T4b: Invasione muscolo pterigoideo laterale, carotide, base cranica</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Linfonodi Regionali (N)</label>
              <select
                value={oroN}
                onChange={(e) => setOroN(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                {oroHpv === 'p16_pos' ? (
                  <>
                    <option value="N0">N0: Nessuna metastasi linfonodale</option>
                    <option value="N1">N1: Linfonodi ipsilaterali tutti ≤ 6 cm</option>
                    <option value="N2">N2: Linfonodi contralaterali o bilaterali tutti ≤ 6 cm</option>
                    <option value="N3">N3: Uno o più linfonodi &gt; 6 cm</option>
                  </>
                ) : (
                  <>
                    <option value="N0">N0: Linfonodi negativi</option>
                    <option value="N1">N1: Singolo ipsilaterale ≤ 3 cm (ENE-)</option>
                    <option value="N2a">N2a: Singolo ipsilaterale 3-6 cm (ENE-)</option>
                    <option value="N2b">N2b: Multipli ipsilaterali ≤ 6 cm (ENE-)</option>
                    <option value="N2c">N2c: Bilaterali o controlaterali ≤ 6 cm (ENE-)</option>
                    <option value="N3a">N3a: Linfonodo &gt; 6 cm (ENE-)</option>
                    <option value="N3b">N3b: Linfonodo con ENE+ clinicamente evidente</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Metastasi (M)</label>
              <select
                value={oroM}
                onChange={(e) => setOroM(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="M0">M0: Assenti</option>
                <option value="M1">M1: Presenti</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
                Risultato Staging Orofaringe AJCC 9ª Ed {oroHpv === 'p16_pos' ? '(p16+ HPV)' : '(p16- Non-HPV)'}
              </span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-extrabold text-white">
                  {oroT} {oroN} {oroM}
                </span>
                <span className="text-xs bg-indigo-500/30 text-indigo-200 font-bold px-3 py-1 rounded-full border border-indigo-400/30">
                  {getOropharynxStageGroup()}
                </span>
              </div>
            </div>
            <Dna className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      )}

      {/* 5. STAGING RINOFARINGE - NASOPHARYNX (AJCC 9ª Ed) */}
      {activeCalc === 'tnm_nasopharynx' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tumore Primitivo (T)</label>
              <select
                value={nasoT}
                onChange={(e) => setNasoT(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="T1">T1: Limitato a rinofaringe, o esteso a orofaringe/cavità nasale (senza invasione parafaringea)</option>
                <option value="T2">T2: Estensione allo spazio parafaringeo e/o tessuti molli (pterigoidei, prevertebrali)</option>
                <option value="T3">T3: Invasione strutture ossee base cranica, vertebre cervicali o seni paranasali</option>
                <option value="T4">T4: Estensione intracranica, nervi cranici, ipofaringe, orbita, fossa infratemporale</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Linfonodi Regionali (N)</label>
              <select
                value={nasoN}
                onChange={(e) => setNasoN(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="N0">N0: Nessuna metastasi linfonodale regionale</option>
                <option value="N1">N1: Cervicali ipsilaterali e/o retrofaringei uni/bilaterali ≤ 6 cm (sopra margine inf. cricoide)</option>
                <option value="N2">N2: Cervicali bilaterali ≤ 6 cm (sopra margine inferiore cricoide)</option>
                <option value="N3">N3: Linfonodi cervicali &gt; 6 cm o estensione sotto il margine inferiore della cricoide</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Metastasi a Distanza (M)</label>
              <select
                value={nasoM}
                onChange={(e) => setNasoM(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                <option value="M0">M0: Assenti</option>
                <option value="M1">M1: Metastasi a distanza presenti</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Risultato Staging Rinofaringe (AJCC 9ª Ed)</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-extrabold text-white">
                  {nasoT} {nasoN} {nasoM}
                </span>
                <span className="text-xs bg-indigo-500/30 text-indigo-200 font-bold px-3 py-1 rounded-full border border-indigo-400/30">
                  {getNasopharynxStageGroup()}
                </span>
              </div>
            </div>
            <Target className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      )}

      {/* 6. STAGING LARINGE (AJCC 9ª Ed) */}
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
                <option value="subglottis">Sottoglottide</option>
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
                <option value="T2">T2: Estensione a Sopra/Sottoglottide o ridotta mobilità cordale</option>
                <option value="T3">T3: Fissazione cordale o invasione spazio paraglottico / erosione corticale tiroide</option>
                <option value="T4a">T4a: Invasione attraverso la cartilagine tiroide, tessuti molli collo, trachea, tiroide</option>
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
                <option value="N1">N1: Singolo ipsilaterale ≤ 3 cm (ENE-)</option>
                <option value="N2a">N2a: Singolo ipsilaterale 3-6 cm (ENE-)</option>
                <option value="N2b">N2b: Multipli ipsilaterali ≤ 6 cm (ENE-)</option>
                <option value="N2c">N2c: Bilaterali o controlaterali ≤ 6 cm (ENE-)</option>
                <option value="N3a">N3a: Linfonodo &gt; 6 cm (ENE-)</option>
                <option value="N3b">N3b: Estensione extranodale clinicamente evidente (ENE+)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Stadio Finale Laringe (AJCC 9ª Ed)</span>
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

      {/* 7. CALCOLATORE PACK-YEARS */}
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
                  {parseFloat(packYears) >= 20 ? 'Rischio Elevato (≥20 PY)' : 'Rischio Moderato/Basso'}
                </span>
              </div>
            </div>
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      )}

      {/* 8. CALCOLATORE BMI */}
      {activeCalc === 'bmi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Peso Corporeo (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
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
                min="30"
                value={bmiHeightCm}
                onChange={(e) => setBmiHeightCm(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Indice di Massa Corporea (BMI)</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-black text-white">{bmiValue}</span>
                <span className="text-xs text-slate-300 font-semibold">kg/m²</span>
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
            <Scale className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      )}

    </div>
  );
}