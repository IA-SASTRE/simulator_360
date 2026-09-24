import React, { useState } from 'react';
import { ShieldAlert, Play, Clock, Check, Eye, AlertTriangle, ShieldCheck } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

interface StartScreenProps {
  onStartInspection: (name: string, company: string, timeLimitMinutes: number) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartInspection }) => {
  const [name, setName] = useState('Ing. Carlos Valdés');
  const [company, setCompany] = useState('Logística & Manufactura Norte');
  const [timeMinutes, setTimeMinutes] = useState(10);
  const [dontShowTutorial, setDontShowTutorial] = useState(false);

  const handleStart = () => {
    audioEngine.startAmbient();
    audioEngine.playClick();
    onStartInspection(name, company, timeMinutes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-lg select-none overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden my-auto">
        {/* Header Ribbon */}
        <div className="bg-zinc-950 border-b border-zinc-800 p-6 flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-zinc-950 shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                PLATAFORMA DE ENTRENAMIENTO INDUSTRIAL 3D
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
              SIMULADOR SST 360
            </h1>
            <p className="text-xs font-mono text-zinc-400 mt-0.5 uppercase tracking-wider">
              MÓDULO: CACERÍA DE PELIGROS EN PLANTA INDUSTRIAL
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Briefing text */}
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
              <Eye className="w-4 h-4" />
              <span>CONSIGNA OPERATIVA DE LA INSPECCIÓN:</span>
            </div>
            <p className="leading-relaxed">
              Desplácese libremente por los 1,800 m² de nave industrial. Realice una auditoría visual minuciosa para localizar condiciones inseguras en racks, maquinaria rotativa, subestaciones eléctricas, pasillos peatonales y rutas de evacuación.
            </p>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
                Nombre del Inspector / Participante:
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nombre completo"
                className="w-full bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-xs text-zinc-100 font-medium focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1 uppercase">
                Empresa o Centro de Trabajo:
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Planta o razón social"
                className="w-full bg-zinc-950 border border-zinc-700 px-3.5 py-2 text-xs text-zinc-100 font-medium focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Timer Config */}
          <div>
            <label className="text-[11px] font-mono text-zinc-400 block mb-2 uppercase">
              Duración de la Inspección de Campo:
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: '5 min', val: 5 },
                { label: '10 min (Oficial)', val: 10 },
                { label: '15 min', val: 15 },
                { label: 'Sin límite', val: 0 }
              ].map(item => (
                <button
                  key={item.val}
                  onClick={() => {
                    audioEngine.playClick();
                    setTimeMinutes(item.val);
                  }}
                  className={`py-2 px-2 text-xs font-mono border transition-all text-center ${
                    timeMinutes === item.val
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tutorial / Controls summary */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
            <div className="p-2 border border-zinc-800/80 bg-zinc-900/60">
              <span className="text-amber-400 font-bold block text-sm">W A S D</span>
              <span className="text-[10px] text-zinc-400 uppercase">Caminar</span>
            </div>
            <div className="p-2 border border-zinc-800/80 bg-zinc-900/60">
              <span className="text-amber-400 font-bold block text-sm">MOUSE</span>
              <span className="text-[10px] text-zinc-400 uppercase">Mirar Alrededor</span>
            </div>
            <div className="p-2 border border-zinc-800/80 bg-zinc-900/60">
              <span className="text-amber-400 font-bold block text-sm">CLIC</span>
              <span className="text-[10px] text-zinc-400 uppercase">Inspeccionar</span>
            </div>
            <div className="p-2 border border-zinc-800/80 bg-zinc-900/60">
              <span className="text-amber-400 font-bold block text-sm">ESC</span>
              <span className="text-[10px] text-zinc-400 uppercase">Pausar / Menú</span>
            </div>
          </div>
        </div>

        {/* Start Button Ribbon */}
        <div className="bg-zinc-950 border-t border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowTutorial}
              onChange={e => setDontShowTutorial(e.target.checked)}
              className="accent-amber-500 w-4 h-4"
            />
            <span>Recordar configuración en este equipo</span>
          </label>

          <button
            onClick={handleStart}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-8 py-3.5 text-sm uppercase tracking-wider shadow-xl transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>INICIAR INSPECCIÓN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
