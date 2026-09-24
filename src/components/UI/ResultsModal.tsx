import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, Clock, FileText, Download, RotateCcw, ShieldCheck, Printer } from 'lucide-react';
import { InspectionSession } from '../../types/Session';
import { hazardEngine } from '../../services/hazardEngine';
import { firebaseService } from '../../services/firebase';
import { audioEngine } from '../../services/audioEngine';

interface ResultsModalProps {
  session: InspectionSession;
  onRestart: () => void;
  onExit: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({ session, onRestart, onExit }) => {
  const [downloaded, setDownloaded] = useState(false);

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case 'DOMINIO ALTO':
        return 'text-emerald-400 border-emerald-500 bg-emerald-950/40';
      case 'DESEMPEÑO SATISFACTORIO':
        return 'text-amber-400 border-amber-500 bg-amber-950/40';
      case 'REQUIERE REFORZAMIENTO':
        return 'text-orange-400 border-orange-500 bg-orange-950/40';
      default:
        return 'text-red-400 border-red-500 bg-red-950/40';
    }
  };

  const handleExportJSON = () => {
    const jsonStr = firebaseService.exportReportJSON(session);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_SST360_${session.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const allActiveHazards = hazardEngine.getActiveHazards();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-zinc-950/90 backdrop-blur-md select-none animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header Certificate Style */}
        <div className="bg-zinc-950 border-b border-zinc-800 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-zinc-950 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                SIMULADOR SST 360 · CERTIFICADO DE AUDITORÍA
              </span>
              <h1 className="text-xl font-bold text-zinc-100">
                RESULTADO DE LA INSPECCIÓN
              </h1>
            </div>
          </div>

          <div className={`px-4 py-2 border font-mono font-bold text-xs tracking-wider uppercase text-center ${getRankBadgeColor(session.rangoPedagogico)}`}>
            {session.rangoPedagogico}
          </div>
        </div>

        {/* Scrollable Audit Report Body */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Participant Info Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/70 border border-zinc-800 p-4 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block">PARTICIPANTE</span>
              <span className="text-zinc-200 font-bold">{session.nombreParticipante}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">EMPRESA / PLANTA</span>
              <span className="text-zinc-200">{session.empresa}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">FECHA</span>
              <span className="text-zinc-200">{new Date(session.fechaInicio).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">TIEMPO EMPLEADO</span>
              <span className="text-zinc-200 font-bold">{formatSecs(session.tiempoEmpleadoSegundos)}</span>
            </div>
          </div>

          {/* Key Metric Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 block">PUNTUACIÓN</span>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl font-bold text-amber-400">{session.puntuacionTotal}</span>
                <span className="text-xs text-zinc-500">/ {session.puntuacionMaxima} pts</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 block">APROVECHAMIENTO</span>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl font-bold text-emerald-400">{session.porcentaje}%</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 block">PELIGROS DETECTADOS</span>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl font-bold text-zinc-100">{session.peligrosEncontrados}</span>
                <span className="text-xs text-zinc-500">/ {session.peligrosTotales}</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 block">ACIERTOS TÉCNICOS</span>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-2xl font-bold text-emerald-400">{session.respuestasCorrectas}</span>
                <span className="text-xs text-red-400">({session.respuestasIncorrectas} fallos)</span>
              </div>
            </div>
          </div>

          {/* Pedagogical Performance Guidance */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
            <span className="font-mono text-amber-400 font-bold uppercase tracking-wider block">
              DIAGNÓSTICO FORMATIVO:
            </span>
            <p className="text-zinc-300 leading-relaxed">
              {session.porcentaje >= 90 && 'Demuestra un criterio técnico sobresaliente en la identificación de riesgos locativos, mecánicos y eléctricos en naves industriales, alineado con las normas oficiales.'}
              {session.porcentaje >= 80 && session.porcentaje < 90 && 'Desempeño satisfactorio. Se identificó la mayoría de las condiciones de riesgo; se sugiere afinar la jerarquía de medidas de control ingenieriles.'}
              {session.porcentaje >= 70 && session.porcentaje < 80 && 'Nivel básico. Requiere reforzamiento en inspección visual de equipos contra incendio y segregación vial de montacargas.'}
              {session.porcentaje < 70 && 'No aprobatorio para inspección autónoma. Se recomienda repetir el entrenamiento y repasar los estándares de orden, limpieza y EPP.'}
            </p>
          </div>

          {/* Detailed Itemized Hazard Inspection List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              DESGLOSE DETALLADO DE PELIGROS DE LA SESIÓN:
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {allActiveHazards.map(h => {
                const insp = session.inspecciones[h.id];
                const wasFound = insp?.identificado ?? false;

                return (
                  <div
                    key={h.id}
                    className={`p-3 border flex items-center justify-between text-xs ${
                      wasFound ? 'bg-zinc-950 border-zinc-800' : 'bg-red-950/20 border-red-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {wasFound ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-zinc-200 block">{h.nombre}</span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {h.zonaNombre} · {h.normativa}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      {wasFound ? (
                        <span className="text-emerald-400 font-bold">+{insp.puntosObtenidos} pts</span>
                      ) : (
                        <span className="text-zinc-500">NO LOCALIZADO</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-950 border-t border-zinc-800 p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono uppercase"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloaded ? '¡DESCARGADO!' : 'EXPORTAR JSON'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono uppercase"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>IMPRIMIR AUDITORÍA</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioEngine.playClick();
                onRestart();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              <span>NUEVA INSPECCIÓN</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playClick();
                onExit();
              }}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs uppercase tracking-wider border border-zinc-700"
            >
              SALIR AL MENÚ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
