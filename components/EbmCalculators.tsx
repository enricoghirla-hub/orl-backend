'use client';

import { useState } from 'react';
import { Calculator, ShieldAlert } from 'lucide-react';

export default function EbmCalculators() {
  const [tStage, setTStage] = useState('T1');
  const [nStage, setNStage] = useState('N0');
  const [mStage, setMStage] = useState('M0');

  const [weight, setWeight] = useState<number | ''>('');
  const [drug, setDrug] = useState('amoxicillina');

  const getOverallStage = () => {
    if (mStage === 'M1') return 'Stadio IVC';
    if (nStage === 'N3') return 'Stadio IVB';
    if (nStage === 'N2' || tStage === 'T4b') return 'Stadio IVA';
    if (tStage === 'T4a') return 'Stadio IVA';
    if (nStage === 'N1') return 'Stadio III';
    if (tStage === 'T3') return 'Stadio III';
    if (tStage === 'T2') return 'Stadio II';
    return 'Stadio I';
  };

  const getPediatricDose = () => {
    if (!weight || Number(weight) <= 0) return null;
    const w = Number(weight);
    if (drug === 'amoxicillina') {
      const daily = w * 90;
      return `${daily.toFixed(0)} mg/die (${(daily / 2).toFixed(0)} mg ogni 12h)`;
    } else if (drug === 'paracetamolo') {
      const dose = w * 15;
      return `${dose.toFixed(0)} mg ogni 6 ore (max ${(w * 60).toFixed(0)} mg/die)`;
    } else if (drug === 'ibuprofene') {
      const dose = w * 10;
      return `${dose.toFixed(0)} mg ogni 8 ore (max ${(w * 30).toFixed(0)} mg/die)`;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
      {/* Calcolatore TNM */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-800">Staging TNM Laringe (8ª Ed.)</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Tumore (T)</label>
            <select value={tStage} onChange={(e) => setTStage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-indigo-500">
              <option value="T1">T1 (Limitato a 1 sottosede)</option>
              <option value="T2">T2 (Esteso ad adiacenti)</option>
              <option value="T3">T3 (Fissazione cordale)</option>
              <option value="T4a">T4a (Invasione cartilagine)</option>
              <option value="T4b">T4b (Spazio prevertebrale)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Nodi (N)</label>
            <select value={nStage} onChange={(e) => setNStage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-indigo-500">
              <option value="N0">N0 (Nessun linfonodo)</option>
              <option value="N1">N1 (Singolo &le; 3cm)</option>
              <option value="N2">N2 (Singolo 3-6cm / Multipli)</option>
              <option value="N3">N3 (Linfonodo &gt; 6cm)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Metastasi (M)</label>
            <select value={mStage} onChange={(e) => setMStage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-indigo-500">
              <option value="M0">M0 (Assenti)</option>
              <option value="M1">M1 (Presenti)</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
          <span className="text-xs text-indigo-700 font-medium">Stadio Complessivo:</span>
          <span className="text-sm font-bold text-indigo-900">{getOverallStage()}</span>
        </div>
      </div>

      {/* Calcolatore Posologia Pediatrica */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-800">Dosaggio ORL Pediatrico</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Peso (kg)</label>
            <input 
              type="number" 
              placeholder="Es. 15"
              value={weight}
              onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Farmaco</label>
            <select value={drug} onChange={(e) => setDrug(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:outline-none focus:border-indigo-500">
              <option value="amoxicillina">Amoxicillina (90mg/kg)</option>
              <option value="paracetamolo">Paracetamolo (15mg/kg)</option>
              <option value="ibuprofene">Ibuprofene (10mg/kg)</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">Posologia consigliata:</span>
          <span className="text-xs font-bold text-slate-900">
            {getPediatricDose() || 'Inserisci il peso'}
          </span>
        </div>
      </div>
    </div>
  );
}