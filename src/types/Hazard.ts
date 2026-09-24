export type HazardCategory =
  | 'Incendio'
  | 'Locativo'
  | 'Eléctrico'
  | 'Químico'
  | 'Mecánico'
  | 'Vehicular'
  | 'Ergonómico'
  | 'Equipo de Protección Personal';

export type RiskLevel = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export type ControlHierarchy =
  | 'Eliminación'
  | 'Sustitución'
  | 'Controles de ingeniería'
  | 'Controles administrativos'
  | 'Equipo de protección personal (EPP)';

export interface HazardQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface HazardDefinition {
  id: string;
  nombre: string;
  categoria: HazardCategory;
  descripcion: string;
  gravedad: RiskLevel;
  probabilidad: 'Baja' | 'Media' | 'Alta';
  puntos: number;
  zonaId: string;
  zonaNombre: string;
  normativa: string; // e.g. "NOM-002-STPS-2010", "OSHA 1910.157"
  
  // 3D positioning and bounding radius
  position: [number, number, number];
  interactionRadius: number; // usually 2.5 - 3.5m
  meshType: string;
  
  // Step 1: Hazard Identification
  preguntaIdentificacion: {
    pregunta: string;
    opciones: string[];
    respuestaCorrecta: number;
  };
  
  // Step 2: Risk Classification
  tipoRiesgoCorrecto: HazardCategory;
  
  // Step 3: Hierarchy of Controls
  preguntaControl: {
    pregunta: string;
    opciones: {
      tipo: ControlHierarchy;
      texto: string;
      esOptima: boolean;
      justificacion: string;
    }[];
  };

  consecuencia: string;
  medidaPreventiva: string;
  retroalimentacion: string;
}

export interface HazardInspectionState {
  hazardId: string;
  identificado: boolean;
  intentosFallidos: number;
  pasoActual: 'identificacion' | 'clasificacion' | 'control' | 'completado';
  puntosObtenidos: number;
  clasificacionCorrecta?: boolean;
  controlCorrecto?: boolean;
  fechaInspeccion?: number;
}
