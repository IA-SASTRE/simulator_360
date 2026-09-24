import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, X, ArrowRight, CheckCircle2, AlertOctagon, BookOpen } from 'lucide-react';
import { HazardDefinition, HazardCategory } from '../../types/Hazard';
import { hazardEngine } from '../../services/hazardEngine';
import { audioEngine } from '../../services/audioEngine';

interface HazardDialogProps {
  hazard: HazardDefinition;
  onClose: (pointsGained: number) => void;
}

const RISK_CATEGORIES: HazardCategory[] = [
  'Locativo',
  'Eléctrico',
  'Incendio',
  'Mecánico',
  'Vehicular',
  'Químico',
  'Ergonómico',
  'Equipo de Protección Personal'
];

export const HazardDialog: React.FC<HazardDialogProps> = ({ hazard, onClose }) => {
  const [stage, setStage] = useState<'identificacion' | 'clasificacion' | 'control' | 'resumen'>('identificacion');
  const [selectedIdOption, setSelectedIdOption] = useState<number | null>(null);
  const [idErrorMsg, setIdErrorMsg] = useState<string | null>(null);
  const [failsCount, setFailsCount] = useState<number>(0);

  const [selectedCategory, setSelectedCategory] = useState<HazardCategory | null>(null);
  const [categoryResult, setCategoryResult] = useState<{ isCorrect: boolean; points: number } | null>(null);

  const [selectedControlIndex, setSelectedControlIndex] = useState<number | null>(null);
  const [controlResult, setControlResult] = useState<{ isCorrect: boolean; justification: string } | null>(null);

  const [pointsTotal, setPointsTotal] = useState<number>(0);

  // 1. Submit Stage 1: Identification
  const handleSubmitIdentification = () => {
    if (selectedIdOption === null) return;

    const res = hazardEngine.answerIdentification(hazard.id, selectedIdOption);
    if (res.success) {
      audioEngine.playSuccess();
      setPointsTotal(prev => prev + res.pointsEarned);
      setIdErrorMsg(null);
      setStage('clasificacion');
    } else {
      audioEngine.playError();
      setFailsCount(res.consecutiveFails);
      if (res.showHint) {
        setIdErrorMsg(`Orientación Técnica: Observe con atención el equipo, despeje o elemento físico involucrado (${hazard.normativa}).`);
      } else {
        setIdErrorMsg('Analiza nuevamente la situación. La opción seleccionada no corresponde al peligro primario.');
      }
    }
  };

  // 2. Submit Stage 2: Risk Classification
  const handleSubmitClassification = () => {
    if (!selectedCategory) return;

    const res = hazardEngine.answerClassification(hazard.id, selectedCategory);
    if (res.success) {
      audioEngine.playSuccess();
      setPointsTotal(prev => prev + res.pointsEarned);
    } else {
      audioEngine.playError();
    }
    setCategoryResult({ isCorrect: res.success, points: res.pointsEarned });
    setStage('control');
  };

  // 3. Submit Stage 3: Control Measure
  const handleSubmitControl = () => {
    if (selectedControlIndex === null) return;

    const res = hazardEngine.answerControl(hazard.id, selectedControlIndex);
    if (res.success) {
      audioEngine.playSuccess();
      setPointsTotal(prev => prev + res.pointsEarned);
    } else {
      audioEngine.playError();
    }
    setControlResult({ isCorrect: res.success, justification: res.justification });
    setStage('resumen');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-zinc-950/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-amber-400" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                EVALUACIÓN DE CONDICIÓN INSEGURA · {hazard.id}
              </span>
              <h2 className="text-base font-bold text-zinc-100">
                {hazard.zonaNombre}
              </h2>
            </div>
          </div>
          <button
            onClick={() => onClose(pointsTotal)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Tabs */}
        <div className="grid grid-cols-3 border-b border-zinc-800 text-[11px] font-mono tracking-wider">
          <div className={`py-2 px-3 text-center border-r border-zinc-800 ${
            stage === 'identificacion' ? 'bg-amber-500/10 text-amber-400 font-bold border-b-2 border-b-amber-400' : 'text-zinc-500'
          }`}>
            1. IDENTIFICACIÓN
          </div>
          <div className={`py-2 px-3 text-center border-r border-zinc-800 ${
            stage === 'clasificacion' ? 'bg-amber-500/10 text-amber-400 font-bold border-b-2 border-b-amber-400' : 'text-zinc-500'
          }`}>
            2. TIPO DE RIESGO
          </div>
          <div className={`py-2 px-3 text-center ${
            stage === 'control' || stage === 'resumen' ? 'bg-amber-500/10 text-amber-400 font-bold border-b-2 border-b-amber-400' : 'text-zinc-500'
          }`}>
            3. MEDIDA DE CONTROL
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-5 flex-1">
          {/* STAGE 1: IDENTIFICATION */}
          {stage === 'identificacion' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-zinc-950/80 p-3.5 border border-zinc-800">
                <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {hazard.preguntaIdentificacion.pregunta}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Seleccione la opción correcta para confirmar el hallazgo (+10 puntos).
                  </p>
                </div>
              </div>

              {idErrorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{idErrorMsg} (-2 pts penalización)</span>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                {hazard.preguntaIdentificacion.opciones.map((opcion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedIdOption(idx);
                      audioEngine.playClick();
                    }}
                    className={`w-full text-left p-3.5 border text-xs md:text-sm font-medium transition-all flex items-center justify-between ${
                      selectedIdOption === idx
                        ? 'bg-amber-500/15 border-amber-400 text-zinc-100 ring-1 ring-amber-400'
                        : 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 flex items-center justify-center font-mono text-xs border ${
                        selectedIdOption === idx ? 'bg-amber-400 text-zinc-950 border-amber-400 font-bold' : 'border-zinc-600 text-zinc-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opcion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 2: RISK CLASSIFICATION */}
          {stage === 'clasificacion' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>✓ ¡Condición identificada exitosamente! (+10 puntos)</span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  ¿Qué tipo de riesgo representa esta condición insegura?
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Clasifique según la taxonomía de factores de riesgo de Seguridad y Salud en el Trabajo (+5 puntos).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {RISK_CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCategory(cat);
                      audioEngine.playClick();
                    }}
                    className={`p-3 border text-xs md:text-sm font-medium transition-all text-left flex items-center gap-2 ${
                      selectedCategory === cat
                        ? 'bg-amber-500/15 border-amber-400 text-zinc-100 ring-1 ring-amber-400 font-bold'
                        : 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300'
                    }`}
                  >
                    <span className="w-2 h-2 bg-amber-400 shrink-0" />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 3: CONTROL HIERARCHY */}
          {stage === 'control' && (
            <div className="space-y-4">
              {categoryResult && (
                <div className={`p-3 text-xs flex items-center gap-2 border ${
                  categoryResult.isCorrect ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300' : 'bg-zinc-800/80 border-zinc-700 text-zinc-300'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    Clasificación seleccionada: <strong>{selectedCategory}</strong> ({categoryResult.isCorrect ? '+5 puntos' : 'La clasificación correcta era ' + hazard.tipoRiesgoCorrecto})
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {hazard.preguntaControl.pregunta}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Aplique el principio de la Jerarquía de Controles (Eliminación, Sustitución, Ingeniería, Administrativo, EPP) (+5 puntos).
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {hazard.preguntaControl.opciones.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedControlIndex(idx);
                      audioEngine.playClick();
                    }}
                    className={`w-full text-left p-3.5 border text-xs md:text-sm transition-all flex flex-col gap-1 ${
                      selectedControlIndex === idx
                        ? 'bg-amber-500/15 border-amber-400 text-zinc-100 ring-1 ring-amber-400'
                        : 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-950 text-amber-300 border border-zinc-700">
                        {opt.tipo}
                      </span>
                    </div>
                    <span className="font-medium mt-1">{opt.texto}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 4: PEDAGOGICAL SUMMARY & REGISTRATION */}
          {stage === 'resumen' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-600 text-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-sm block">Inspección de Peligro Completada</span>
                    <span className="text-emerald-300">Puntos acumulados en este hallazgo: +{pointsTotal} pts</span>
                  </div>
                </div>
              </div>

              {/* Justification of control */}
              {controlResult && (
                <div className="p-3.5 bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                  <span className="font-mono text-[10px] text-zinc-400 uppercase">Justificación del Control</span>
                  <p className="text-zinc-200">{controlResult.justification}</p>
                </div>
              )}

              {/* Regulatory and Safety Audit Data Card */}
              <div className="border border-zinc-800 bg-zinc-950/60 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-mono text-zinc-400">NORMATIVA APLICABLE</span>
                  <span className="font-mono font-bold text-amber-400">{hazard.normativa}</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-mono text-zinc-400">NIVEL DE GRAVEDAD</span>
                  <span className="font-mono font-bold text-red-400">{hazard.gravedad}</span>
                </div>
                <div>
                  <span className="font-mono text-zinc-400 block mb-1">CONSECUENCIA POTENCIAL</span>
                  <p className="text-zinc-300">{hazard.consecuencia}</p>
                </div>
                <div>
                  <span className="font-mono text-zinc-400 block mb-1">MEDIDA PREVENTIVA RECOMENDADA</span>
                  <p className="text-zinc-300">{hazard.medidaPreventiva}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400">
            PUNTOS EN SESIÓN: <strong className="text-amber-400 font-bold font-mono">{hazardEngine.getTotalScore()}</strong>
          </span>

          <div>
            {stage === 'identificacion' && (
              <button
                disabled={selectedIdOption === null}
                onClick={handleSubmitIdentification}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-zinc-950 font-bold px-4 py-2 text-xs uppercase tracking-wider"
              >
                <span>Validar Identificación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {stage === 'clasificacion' && (
              <button
                disabled={!selectedCategory}
                onClick={handleSubmitClassification}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-zinc-950 font-bold px-4 py-2 text-xs uppercase tracking-wider"
              >
                <span>Confirmar Clasificación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {stage === 'control' && (
              <button
                disabled={selectedControlIndex === null}
                onClick={handleSubmitControl}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-zinc-950 font-bold px-4 py-2 text-xs uppercase tracking-wider"
              >
                <span>Confirmar Medida de Control</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {stage === 'resumen' && (
              <button
                onClick={() => onClose(pointsTotal)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-5 py-2 text-xs uppercase tracking-wider shadow-lg"
              >
                <span>Registrar en Bitácora y Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
