import React, { useState } from 'react';
import { Play, RotateCcw, HelpCircle, Target, LogOut, X, Keyboard } from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  timeLimitMinutes: number;
  onUpdateTimer: (minutes: number) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onExitToMenu,
  timeLimitMinutes,
  onUpdateTimer
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'controls' | 'objectives'>('main');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-amber-400" />
            <h2 className="text-sm font-bold tracking-tight text-zinc-100 uppercase font-mono">
              SIMULADOR SST 360 · PAUSA
            </h2>
          </div>
          <button
            onClick={() => {
              audioEngine.playClick();
              onResume();
            }}
            className="p-1 text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {activeTab === 'main' && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  audioEngine.playClick();
                  onResume();
                }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 text-xs uppercase tracking-wider"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>CONTINUAR INSPECCIÓN</span>
              </button>

              <button
                onClick={() => {
                  audioEngine.playClick();
                  setActiveTab('controls');
                }}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 py-2.5 text-xs font-semibold uppercase tracking-wider"
              >
                <Keyboard className="w-4 h-4 text-amber-400" />
                <span>GUÍA DE CONTROLES</span>
              </button>

              <button
                onClick={() => {
                  audioEngine.playClick();
                  setActiveTab('objectives');
                }}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 py-2.5 text-xs font-semibold uppercase tracking-wider"
              >
                <Target className="w-4 h-4 text-emerald-400" />
                <span>OBJETIVOS PEDAGÓGICOS</span>
              </button>

              {/* Timer Config Section */}
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-400 block mb-2 uppercase">Límite de Tiempo:</span>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 0].map(mins => (
                    <button
                      key={mins}
                      onClick={() => {
                        audioEngine.playClick();
                        onUpdateTimer(mins);
                      }}
                      className={`py-1.5 text-xs font-mono border ${
                        timeLimitMinutes === mins
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                          : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mins === 0 ? 'Sin límite' : `${mins} min`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => {
                    audioEngine.playClick();
                    onRestart();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>REINICIAR</span>
                </button>

                <button
                  onClick={() => {
                    audioEngine.playClick();
                    onExitToMenu();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 text-xs border border-red-900/60 text-red-400 hover:bg-red-950/40"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>SALIR AL MENÚ</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-300">Desplazamiento</span>
                  <div className="flex gap-1 font-mono text-amber-300">
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700">W</kbd>
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700">A</kbd>
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700">S</kbd>
                    <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700">D</kbd>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-300">Orientación de Cámara</span>
                  <span className="font-mono text-amber-300">Mover Mouse / Swipe táctil</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-300">Inspeccionar Condición</span>
                  <span className="font-mono text-amber-300">Clic Izquierdo / Tap</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-300">Menú / Liberar Cursor</span>
                  <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 font-mono text-amber-300">ESC</kbd>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('main')}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold uppercase tracking-wider"
              >
                Volver al Menú
              </button>
            </div>
          )}

          {activeTab === 'objectives' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2 text-zinc-300">
                <p>
                  1. Recorra libremente las 7 zonas industriales: Almacén, Maquinaria, Subestación, Tránsito de montacargas, Carga y Evacuación.
                </p>
                <p>
                  2. Detecte visualmente las condiciones inseguras y omisiones de EPP sin marcadores obvios.
                </p>
                <p>
                  3. Acérquese a menos de 3 metros para activar la mira e inspeccionar el peligro.
                </p>
                <p>
                  4. Responda acertadamente la identificación (+10 pts), taxonomía del riesgo (+5 pts) y la jerarquía de control (+5 pts).
                </p>
              </div>

              <button
                onClick={() => setActiveTab('main')}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold uppercase tracking-wider"
              >
                Volver al Menú
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
