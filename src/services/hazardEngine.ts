import allHazardsData from '../data/hazards.json';
import { HazardDefinition, HazardInspectionState } from '../types/Hazard';
import { InspectionSession, PedagogicalRank } from '../types/Session';

export class HazardEngine {
  private allHazards: HazardDefinition[] = [];
  private currentActiveHazards: HazardDefinition[] = [];
  private inspectionStates: Map<string, HazardInspectionState> = new Map();
  private visitedZones: Set<string> = new Set();
  private totalScore: number = 0;
  private correctAnswersCount: number = 0;
  private incorrectAnswersCount: number = 0;

  constructor() {
    this.allHazards = allHazardsData as unknown as HazardDefinition[];
  }

  public getAllHazards(): HazardDefinition[] {
    return this.allHazards;
  }

  public getActiveHazards(): HazardDefinition[] {
    return this.currentActiveHazards;
  }

  public getHazardById(id: string): HazardDefinition | undefined {
    return this.allHazards.find(h => h.id === id);
  }

  public initSession(hazardCount: number = 12): HazardDefinition[] {
    // Shuffle and pick subset if requested, or keep all
    const shuffled = [...this.allHazards].sort(() => 0.5 - Math.random());
    this.currentActiveHazards = shuffled.slice(0, Math.min(hazardCount, shuffled.length));
    this.inspectionStates.clear();
    this.visitedZones.clear();
    this.totalScore = 0;
    this.correctAnswersCount = 0;
    this.incorrectAnswersCount = 0;

    this.currentActiveHazards.forEach(hazard => {
      this.inspectionStates.set(hazard.id, {
        hazardId: hazard.id,
        identificado: false,
        intentosFallidos: 0,
        pasoActual: 'identificacion',
        puntosObtenidos: 0
      });
    });

    return this.currentActiveHazards;
  }

  public recordVisitedZone(zoneId: string) {
    this.visitedZones.add(zoneId);
  }

  public getVisitedZones(): string[] {
    return Array.from(this.visitedZones);
  }

  public getInspectionState(hazardId: string): HazardInspectionState | undefined {
    return this.inspectionStates.get(hazardId);
  }

  public getIdentifiedCount(): number {
    let count = 0;
    this.inspectionStates.forEach(state => {
      if (state.identificado) count++;
    });
    return count;
  }

  public getTotalHazardsCount(): number {
    return this.currentActiveHazards.length;
  }

  public getTotalScore(): number {
    return this.totalScore;
  }

  public getMaxPossibleScore(): number {
    // Max 20 points per hazard (10 id + 5 risk + 5 control)
    return this.currentActiveHazards.length * 20;
  }

  public answerIdentification(hazardId: string, selectedIndex: number): {
    success: boolean;
    pointsEarned: number;
    showHint: boolean;
    consecutiveFails: number;
    isCompleted: boolean;
    state: HazardInspectionState;
  } {
    const hazard = this.getHazardById(hazardId);
    let state = this.inspectionStates.get(hazardId);
    if (!hazard || !state) {
      throw new Error(`Hazard ${hazardId} not found`);
    }

    const isCorrect = selectedIndex === hazard.preguntaIdentificacion.respuestaCorrecta;

    if (isCorrect) {
      this.correctAnswersCount++;
      const earned = 10;
      this.totalScore += earned;
      state = {
        ...state,
        identificado: true,
        pasoActual: 'clasificacion',
        puntosObtenidos: state.puntosObtenidos + earned
      };
      this.inspectionStates.set(hazardId, state);
      return {
        success: true,
        pointsEarned: earned,
        showHint: false,
        consecutiveFails: state.intentosFallidos,
        isCompleted: false,
        state
      };
    } else {
      this.incorrectAnswersCount++;
      const newFails = state.intentosFallidos + 1;
      const penalty = Math.min(2, this.totalScore);
      this.totalScore = Math.max(0, this.totalScore - penalty);

      state = {
        ...state,
        intentosFallidos: newFails
      };
      this.inspectionStates.set(hazardId, state);

      return {
        success: false,
        pointsEarned: -penalty,
        showHint: newFails >= 3,
        consecutiveFails: newFails,
        isCompleted: false,
        state
      };
    }
  }

  public answerClassification(hazardId: string, selectedCategory: string): {
    success: boolean;
    pointsEarned: number;
    state: HazardInspectionState;
  } {
    const hazard = this.getHazardById(hazardId);
    let state = this.inspectionStates.get(hazardId);
    if (!hazard || !state) throw new Error('Not found');

    const isCorrect = selectedCategory === hazard.tipoRiesgoCorrecto;
    if (isCorrect) {
      this.correctAnswersCount++;
      const earned = 5;
      this.totalScore += earned;
      state = {
        ...state,
        clasificacionCorrecta: true,
        pasoActual: 'control',
        puntosObtenidos: state.puntosObtenidos + earned
      };
    } else {
      this.incorrectAnswersCount++;
      state = {
        ...state,
        clasificacionCorrecta: false,
        pasoActual: 'control'
      };
    }
    this.inspectionStates.set(hazardId, state);
    return {
      success: isCorrect,
      pointsEarned: isCorrect ? 5 : 0,
      state
    };
  }

  public answerControl(hazardId: string, optionIndex: number): {
    success: boolean;
    pointsEarned: number;
    state: HazardInspectionState;
    justification: string;
  } {
    const hazard = this.getHazardById(hazardId);
    let state = this.inspectionStates.get(hazardId);
    if (!hazard || !state) throw new Error('Not found');

    const selectedOption = hazard.preguntaControl.opciones[optionIndex];
    const isCorrect = selectedOption?.esOptima ?? false;

    if (isCorrect) {
      this.correctAnswersCount++;
      const earned = 5;
      this.totalScore += earned;
      state = {
        ...state,
        controlCorrecto: true,
        pasoActual: 'completado',
        puntosObtenidos: state.puntosObtenidos + earned,
        fechaInspeccion: Date.now()
      };
    } else {
      this.incorrectAnswersCount++;
      state = {
        ...state,
        controlCorrecto: false,
        pasoActual: 'completado',
        fechaInspeccion: Date.now()
      };
    }

    this.inspectionStates.set(hazardId, state);
    return {
      success: isCorrect,
      pointsEarned: isCorrect ? 5 : 0,
      state,
      justification: selectedOption?.justificacion || ''
    };
  }

  public calculateRank(percentage: number): PedagogicalRank {
    if (percentage >= 90) return 'DOMINIO ALTO';
    if (percentage >= 80) return 'DESEMPEÑO SATISFACTORIO';
    if (percentage >= 70) return 'REQUIERE REFORZAMIENTO';
    return 'SE RECOMIENDA REPETIR EL ENTRENAMIENTO';
  }

  public generateSessionSummary(
    userId: string,
    nombreParticipante: string,
    empresa: string,
    puesto: string,
    startTime: number,
    timeLimitSeconds: number,
    elapsedSeconds: number
  ): InspectionSession {
    const maxScore = this.getMaxPossibleScore();
    const percentage = maxScore > 0 ? Math.round((this.totalScore / maxScore) * 100) : 0;
    const rank = this.calculateRank(percentage);

    const missedHazards: string[] = [];
    this.currentActiveHazards.forEach(h => {
      const state = this.inspectionStates.get(h.id);
      if (!state || !state.identificado) {
        missedHazards.push(h.id);
      }
    });

    const inspectionsRecord: Record<string, HazardInspectionState> = {};
    this.inspectionStates.forEach((val, key) => {
      inspectionsRecord[key] = val;
    });

    return {
      sessionId: 'SES-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId,
      nombreParticipante,
      empresa: empresa || 'Planta Industrial Logística',
      puesto: puesto || 'Inspector SST',
      scenarioId: 'ESC-PLANTA-01',
      modulo: 'CACERÍA DE PELIGROS',
      fechaInicio: startTime,
      fechaFin: Date.now(),
      tiempoTotalSegundos: elapsedSeconds,
      tiempoEmpleadoSegundos: elapsedSeconds,
      limiteTiempoSegundos: timeLimitSeconds,
      puntuacionTotal: this.totalScore,
      puntuacionMaxima: maxScore,
      porcentaje: percentage,
      rangoPedagogico: rank,
      peligrosTotales: this.currentActiveHazards.length,
      peligrosEncontrados: this.getIdentifiedCount(),
      peligrosNoEncontrados: missedHazards,
      respuestasCorrectas: this.correctAnswersCount,
      respuestasIncorrectas: this.incorrectAnswersCount,
      inspecciones: inspectionsRecord,
      areasVisitadas: this.getVisitedZones()
    };
  }
}

export const hazardEngine = new HazardEngine();
