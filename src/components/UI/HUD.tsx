import React from 'react';
import { Volume2, VolumeX, Menu, ShieldAlert, Award, Clock } from 'lucide-react';
import { RaycastHitResult } from '../3d/PlayerController';

interface HUDProps {
  moduleName: string;
  foundCount: number;
  totalCount: number;
  score: number;
  timeRemainingSeconds: number;
  isUnlimitedTime: boolean;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onOpenPauseMenu: () => void;
  currentZoneName: string;
  raycastHit: RaycastHitResult;
  onTriggerInspection: () => void;
  isInspecting: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  moduleName,
  foundCount,
  totalCount,
  score,
  timeRemainingSeconds,
  isUnlimitedTime,
  isSoundMuted,
  onToggleSound,
  onOpenPauseMenu,
  currentZoneName,
  raycastHit,
  onTriggerInspection,
  isInspecting
}) => {
  const formatTime = (seconds: number): string => {
    if (isUnlimitedTime) return 'SIN LÍMITE';
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = !isUnlimitedTime && timeRemainingSeconds < 120;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-6 select-none z-10">
      {/* Top Professional Bar */}
      <header className="flex items-center justify-between gap-3">
        {/* Module Brand Branding */}
        <div className="flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-none border-l-4 border-l-amber-500 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
              SIMULADOR SST 360
            </span>
            <span className="text-sm font-bold tracking-tight text-zinc-100">
              {moduleName}
            </span>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Hazards Progress */}
          <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3 md:px-4 py-2">
            <span className="text-[11px] font-mono uppercase text-zinc-400">Peligros</span>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-base font-bold text-amber-400 tabular-nums">{foundCount}</span>
              <span className="text-xs text-zinc-500">/</span>
              <span className="text-xs text-zinc-400 tabular-nums">{totalCount}</span>
            </div>
          </div>

          {/* Score Counter */}
          <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3 md:px-4 py-2">
            <Award className="w-4 h-4 text-amber-400 hidden sm:block" />
            <span className="text-[11px] font-mono uppercase text-zinc-400">Puntos</span>
            <span className="text-base font-bold font-mono text-emerald-400 tabular-nums">{score}</span>
          </div>

          {/* Inspection Timer */}
          <div className={`flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border px-3 md:px-4 py-2 ${
            isTimeCritical ? 'border-red-500/80 bg-red-950/40 text-red-300 animate-pulse' : 'border-zinc-800 text-zinc-200'
          }`}>
            <Clock className="w-4 h-4 text-zinc-400 hidden sm:block" />
            <span className="text-[11px] font-mono uppercase text-zinc-400 hidden sm:inline">Tiempo</span>
            <span className="text-base font-bold font-mono tracking-wider tabular-nums">
              {formatTime(timeRemainingSeconds)}
            </span>
          </div>

          {/* Action buttons (Pointer events active) */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              onClick={onToggleSound}
              title={isSoundMuted ? 'Activar audio' : 'Silenciar audio'}
              className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors"
            >
              {isSoundMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={onOpenPauseMenu}
              title="Menú de Pausa"
              className="p-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Central Crosshair and Raycast Inspection Indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Subtle Crosshair Reticle */}
        <div className="relative flex items-center justify-center">
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
            raycastHit.canInspect
              ? 'bg-amber-400 scale-150 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
              : raycastHit.hazard
              ? 'bg-amber-500/60 scale-125'
              : 'bg-zinc-400/70'
          }`} />

          {/* Subtle crosshair brackets when near an inspectable target */}
          {raycastHit.canInspect && (
            <div className="absolute -inset-3 border border-amber-400/80 rounded-none animate-ping" />
          )}

          {/* Reticle tick marks */}
          <div className="absolute w-4 h-[1px] -left-5 bg-zinc-500/50" />
          <div className="absolute w-4 h-[1px] -right-5 bg-zinc-500/50" />
          <div className="absolute h-4 w-[1px] -top-5 bg-zinc-500/50" />
          <div className="absolute h-4 w-[1px] -bottom-5 bg-zinc-500/50" />
        </div>

        {/* Dynamic Raycast Action Prompt */}
        {!isInspecting && raycastHit.hazard && (
          <div className="absolute top-[56%] flex flex-col items-center pointer-events-auto">
            {raycastHit.canInspect ? (
              <button
                onClick={onTriggerInspection}
                className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 border-2 border-amber-300 shadow-xl transition-transform active:scale-95 text-xs uppercase tracking-wider"
              >
                <span className="inline-block w-2 h-2 bg-zinc-950 animate-pulse" />
                <span>INSPECCIONAR CONDICIÓN</span>
                <kbd className="hidden sm:inline-block bg-zinc-900 text-amber-300 px-1.5 py-0.5 text-[10px] font-mono border border-amber-400/40">
                  CLIC
                </kbd>
              </button>
            ) : (
              <div className="bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 text-zinc-300 text-xs font-mono tracking-wide shadow-md">
                {raycastHit.message} ({(raycastHit.distance).toFixed(1)}m)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Zone Indicator & Controls Legend */}
      <footer className="flex items-end justify-between">
        {/* Current Zone Tag */}
        <div className="flex items-center gap-2 bg-zinc-900/85 backdrop-blur-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] text-zinc-500 uppercase">ZONA:</span>
          <span className="font-semibold text-zinc-200">{currentZoneName}</span>
        </div>

        {/* Quick Keyboard Reference (Desktop) */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-800/80 px-3 py-1.5">
          <span><strong className="text-zinc-200">WASD</strong> Moverse</span>
          <span>·</span>
          <span><strong className="text-zinc-200">MOUSE</strong> Mirar</span>
          <span>·</span>
          <span><strong className="text-zinc-200">CLIC</strong> Inspeccionar</span>
          <span>·</span>
          <span><strong className="text-zinc-200">ESC</strong> Pausa</span>
        </div>
      </footer>
    </div>
  );
};
