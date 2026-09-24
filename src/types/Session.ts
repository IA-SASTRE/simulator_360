import { HazardInspectionState } from './Hazard';

export type PedagogicalRank =
  | 'DOMINIO ALTO'
  | 'DESEMPEÑO SATISFACTORIO'
  | 'REQUIERE REFORZAMIENTO'
  | 'SE RECOMIENDA REPETIR EL ENTRENAMIENTO';

export interface InspectionSession {
  sessionId: string;
  userId: string;
  nombreParticipante: string;
  empresa: string;
  puesto: string;
  scenarioId: string;
  modulo: string;
  fechaInicio: number;
  fechaFin?: number;
  tiempoTotalSegundos: number;
  tiempoEmpleadoSegundos: number;
  limiteTiempoSegundos: number; // 0 = sin límite
  puntuacionTotal: number;
  puntuacionMaxima: number;
  porcentaje: number;
  rangoPedagogico: PedagogicalRank;
  peligrosTotales: number;
  peligrosEncontrados: number;
  peligrosNoEncontrados: string[]; // hazard IDs
  respuestasCorrectas: number;
  respuestasIncorrectas: number;
  inspecciones: Record<string, HazardInspectionState>;
  areasVisitadas: string[];
}
