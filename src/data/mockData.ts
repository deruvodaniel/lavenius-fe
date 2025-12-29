export interface Paciente {
  id: number;
  nombre: string;
  edad: number;
  telefono: string;
  email: string;
  obraSocial: string;
  modalidad: "remoto" | "presencial" | "mixto";
  frecuencia: "semanal" | "quincenal" | "mensual";
  avatar?: string;
  flagged?: boolean; // Flag para marcar pacientes importantes
  historiaClinica: {
    diagnostico: string;
    tratamientoActual: string;
    observaciones: string;
    ultimaConsulta: string;
  };
}

export interface Turno {
  id: number;
  pacienteId: number;
  fecha: string;
  hora: string;
  motivo: string;
  modalidad: "remoto" | "presencial";
  estado: "pendiente" | "confirmado" | "completado";
  monto?: number;
}

export interface Cobro {
  id: number;
  pacienteId: number;
  fecha: string;
  monto: number;
  concepto: string;
  estado: "pendiente" | "pagado";
}

export interface Sesion {
  id: number;
  pacienteId: number;
  fecha: string;
  notas: string;
  duracion: number;
  tipo: string;
}

export const pacientes: Paciente[] = [
  {
    id: 1,
    nombre: "María González",
    edad: 45,
    telefono: "+54 11 2345-6789",
    email: "maria.gonzalez@email.com",
    obraSocial: "OSDE",
    modalidad: "presencial",
    frecuencia: "semanal",
    historiaClinica: {
      diagnostico: "Trastorno de ansiedad generalizada",
      tratamientoActual:
        "Terapia cognitivo-conductual, sesiones semanales",
      observaciones:
        "Paciente muestra avances significativos en manejo de crisis. Responde bien a técnicas de relajación.",
      ultimaConsulta: "2025-11-20",
    },
  },
  {
    id: 2,
    nombre: "Carlos Rodríguez",
    edad: 32,
    telefono: "+54 11 3456-7890",
    email: "carlos.rodriguez@email.com",
    obraSocial: "Swiss Medical",
    modalidad: "remoto",
    frecuencia: "quincenal",
    historiaClinica: {
      diagnostico: "Estrés laboral y burnout",
      tratamientoActual:
        "Terapia breve focalizada, técnicas de mindfulness",
      observaciones:
        "En proceso de reestructuración cognitiva sobre exigencias laborales. Se recomienda continuar con ejercicios de autocuidado.",
      ultimaConsulta: "2025-11-22",
    },
  },
  {
    id: 3,
    nombre: "Ana Martínez",
    edad: 28,
    telefono: "+54 11 4567-8901",
    email: "ana.martinez@email.com",
    obraSocial: "Galeno",
    modalidad: "presencial",
    frecuencia: "quincenal",
    historiaClinica: {
      diagnostico: "Depresión leve a moderada",
      tratamientoActual:
        "Psicoterapia de apoyo, seguimiento quincenal",
      observaciones:
        "Paciente ha iniciado cambios en rutina diaria. Se observa mejor ánimo y disposición.",
      ultimaConsulta: "2025-11-15",
    },
  },
  {
    id: 4,
    nombre: "Roberto Fernández",
    edad: 56,
    telefono: "+54 11 5678-9012",
    email: "roberto.fernandez@email.com",
    obraSocial: "OSDE",
    modalidad: "presencial",
    frecuencia: "semanal",
    historiaClinica: {
      diagnostico: "Trastorno adaptativo",
      tratamientoActual:
        "Terapia individual, abordaje psicodinámico",
      observaciones:
        "Proceso de duelo en elaboración. Trabajando en aceptación y resiliencia.",
      ultimaConsulta: "2025-11-18",
    },
  },
  {
    id: 5,
    nombre: "Laura Sánchez",
    edad: 41,
    telefono: "+54 11 6789-0123",
    email: "laura.sanchez@email.com",
    obraSocial: "Medicus",
    modalidad: "mixto",
    frecuencia: "semanal",
    historiaClinica: {
      diagnostico: "Trastorno de pánico",
      tratamientoActual:
        "CBT con exposición gradual, sesiones semanales",
      observaciones:
        "Disminución en frecuencia de ataques de pánico. Continuar con ejercicios de exposición.",
      ultimaConsulta: "2025-11-25",
    },
  },
  {
    id: 6,
    nombre: "Diego López",
    edad: 35,
    telefono: "+54 11 7890-1234",
    email: "diego.lopez@email.com",
    obraSocial: "Swiss Medical",
    modalidad: "remoto",
    frecuencia: "mensual",
    historiaClinica: {
      diagnostico:
        "Trastorno de personalidad obsesivo-compulsivo",
      tratamientoActual:
        "Terapia de esquemas, seguimiento mensual",
      observaciones:
        "Paciente identificando patrones de pensamiento rígidos. Trabajando flexibilidad cognitiva.",
      ultimaConsulta: "2025-11-10",
    },
  },
];

import { turnos2026 } from './turnos2026';

export const turnos: Turno[] = [
  {
    id: 1,
    pacienteId: 1,
    fecha: "2025-11-28",
    hora: "09:00",
    motivo: "Sesión de seguimiento",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 2,
    pacienteId: 2,
    fecha: "2025-11-28",
    hora: "10:30",
    motivo: "Evaluación de progreso",
    modalidad: "remoto",
    estado: "confirmado",
    monto: 12000,
  },
  {
    id: 3,
    pacienteId: 3,
    fecha: "2025-11-29",
    hora: "11:00",
    motivo: "Terapia individual",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 10000,
  },
  {
    id: 4,
    pacienteId: 4,
    fecha: "2025-11-29",
    hora: "14:00",
    motivo: "Sesión de duelo",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 5,
    pacienteId: 5,
    fecha: "2025-12-02",
    hora: "09:30",
    motivo: "Manejo de crisis",
    modalidad: "remoto",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 6,
    pacienteId: 6,
    fecha: "2025-12-02",
    hora: "15:00",
    motivo: "Terapia cognitiva",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 7,
    pacienteId: 1,
    fecha: "2025-12-03",
    hora: "10:00",
    motivo: "Control mensual",
    modalidad: "remoto",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 8,
    pacienteId: 3,
    fecha: "2025-12-05",
    hora: "11:30",
    motivo: "Sesión semanal",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 10000,
  },
  {
    id: 9,
    pacienteId: 2,
    fecha: "2025-12-06",
    hora: "16:00",
    motivo: "Seguimiento burnout",
    modalidad: "remoto",
    estado: "confirmado",
    monto: 12000,
  },
  {
    id: 10,
    pacienteId: 5,
    fecha: "2025-12-09",
    hora: "09:00",
    motivo: "Terapia de exposición",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  // Turnos de la semana actual (14-20 diciembre 2025)
  {
    id: 11,
    pacienteId: 1,
    fecha: "2025-12-14",
    hora: "10:00",
    motivo: "Sesión semanal",
    modalidad: "presencial",
    estado: "completado",
    monto: 8500,
  },
  {
    id: 12,
    pacienteId: 3,
    fecha: "2025-12-14",
    hora: "14:00",
    motivo: "Terapia individual",
    modalidad: "presencial",
    estado: "completado",
    monto: 10000,
  },
  {
    id: 13,
    pacienteId: 4,
    fecha: "2025-12-15",
    hora: "09:00",
    motivo: "Seguimiento duelo",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 14,
    pacienteId: 2,
    fecha: "2025-12-15",
    hora: "11:00",
    motivo: "Evaluación burnout",
    modalidad: "remoto",
    estado: "confirmado",
    monto: 12000,
  },
  {
    id: 15,
    pacienteId: 5,
    fecha: "2025-12-15",
    hora: "16:00",
    motivo: "Terapia de exposición",
    modalidad: "remoto",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 16,
    pacienteId: 6,
    fecha: "2025-12-16",
    hora: "10:30",
    motivo: "Terapia de esquemas",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 17,
    pacienteId: 1,
    fecha: "2025-12-16",
    hora: "15:00",
    motivo: "Control ansiedad",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 18,
    pacienteId: 3,
    fecha: "2025-12-17",
    hora: "09:30",
    motivo: "Sesión quincenal",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 10000,
  },
  {
    id: 19,
    pacienteId: 2,
    fecha: "2025-12-17",
    hora: "14:00",
    motivo: "Técnicas de mindfulness",
    modalidad: "remoto",
    estado: "pendiente",
    monto: 12000,
  },
  {
    id: 20,
    pacienteId: 5,
    fecha: "2025-12-18",
    hora: "11:00",
    motivo: "Manejo de pánico",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 21,
    pacienteId: 4,
    fecha: "2025-12-18",
    hora: "16:30",
    motivo: "Terapia psicodinámica",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 22,
    pacienteId: 6,
    fecha: "2025-12-19",
    hora: "10:00",
    motivo: "Flexibilidad cognitiva",
    modalidad: "remoto",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 23,
    pacienteId: 1,
    fecha: "2025-12-19",
    hora: "13:00",
    motivo: "Sesión de seguimiento",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 24,
    pacienteId: 3,
    fecha: "2025-12-20",
    hora: "09:00",
    motivo: "Control tratamiento",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 10000,
  },
  {
    id: 25,
    pacienteId: 2,
    fecha: "2025-12-20",
    hora: "15:00",
    motivo: "Cierre de mes",
    modalidad: "remoto",
    estado: "pendiente",
    monto: 12000,
  },
  // Turnos de la semana del 22-28 de diciembre 2025
  {
    id: 26,
    pacienteId: 1,
    fecha: "2025-12-22",
    hora: "10:00",
    motivo: "Sesión semanal",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 27,
    pacienteId: 3,
    fecha: "2025-12-22",
    hora: "14:00",
    motivo: "Terapia individual",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 10000,
  },
  {
    id: 28,
    pacienteId: 2,
    fecha: "2025-12-23",
    hora: "09:30",
    motivo: "Seguimiento burnout",
    modalidad: "remoto",
    estado: "confirmado",
    monto: 12000,
  },
  {
    id: 29,
    pacienteId: 4,
    fecha: "2025-12-23",
    hora: "11:00",
    motivo: "Proceso de duelo",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 30,
    pacienteId: 5,
    fecha: "2025-12-23",
    hora: "16:00",
    motivo: "Manejo de ansiedad",
    modalidad: "remoto",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 31,
    pacienteId: 6,
    fecha: "2025-12-24",
    hora: "09:00",
    motivo: "Terapia cognitiva",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 32,
    pacienteId: 1,
    fecha: "2025-12-26",
    hora: "10:30",
    motivo: "Control post-feriado",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 33,
    pacienteId: 3,
    fecha: "2025-12-26",
    hora: "15:00",
    motivo: "Sesión de seguimiento",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 10000,
  },
  {
    id: 34,
    pacienteId: 2,
    fecha: "2025-12-27",
    hora: "11:00",
    motivo: "Técnicas de relajación",
    modalidad: "remoto",
    estado: "confirmado",
    monto: 12000,
  },
  {
    id: 35,
    pacienteId: 5,
    fecha: "2025-12-27",
    hora: "14:30",
    motivo: "Terapia de exposición",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  // Turnos de la semana del 29 dic 2025 - 4 enero 2026
  {
    id: 36,
    pacienteId: 4,
    fecha: "2025-12-29",
    hora: "09:00",
    motivo: "Sesión de cierre de año",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 37,
    pacienteId: 1,
    fecha: "2025-12-29",
    hora: "11:00",
    motivo: "Evaluación de progreso",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 38,
    pacienteId: 6,
    fecha: "2025-12-30",
    hora: "10:00",
    motivo: "Terapia de esquemas",
    modalidad: "remoto",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 39,
    pacienteId: 3,
    fecha: "2025-12-30",
    hora: "14:00",
    motivo: "Control tratamiento",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 10000,
  },
  {
    id: 40,
    pacienteId: 2,
    fecha: "2025-12-31",
    hora: "09:30",
    motivo: "Cierre de año",
    modalidad: "remoto",
    estado: "confirmado",
    monto: 12000,
  },
  {
    id: 41,
    pacienteId: 5,
    fecha: "2026-01-02",
    hora: "10:00",
    motivo: "Primera sesión del año",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 42,
    pacienteId: 1,
    fecha: "2026-01-02",
    hora: "15:00",
    motivo: "Inicio de año",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 8500,
  },
  {
    id: 43,
    pacienteId: 4,
    fecha: "2026-01-03",
    hora: "11:00",
    motivo: "Sesión semanal",
    modalidad: "presencial",
    estado: "confirmado",
    monto: 8500,
  },
  {
    id: 44,
    pacienteId: 3,
    fecha: "2026-01-03",
    hora: "14:30",
    motivo: "Terapia individual",
    modalidad: "presencial",
    estado: "pendiente",
    monto: 10000,
  },
];

export const cobros: Cobro[] = [
  {
    id: 1,
    pacienteId: 1,
    fecha: "2025-11-20",
    monto: 8500,
    concepto: "Consulta médica",
    estado: "pagado",
  },
  {
    id: 2,
    pacienteId: 2,
    fecha: "2025-11-22",
    monto: 12000,
    concepto: "Consulta + estudios",
    estado: "pagado",
  },
  {
    id: 3,
    pacienteId: 4,
    fecha: "2025-11-25",
    monto: 8500,
    concepto: "Consulta médica",
    estado: "pendiente",
  },
  {
    id: 4,
    pacienteId: 3,
    fecha: "2025-11-26",
    monto: 10000,
    concepto: "Consulta especializada",
    estado: "pagado",
  },
];

export const sesiones: Sesion[] = [
  {
    id: 1,
    pacienteId: 1,
    fecha: "2025-11-20",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "La paciente llegó con mejor disposición que en sesiones anteriores. Reporta haber practicado técnicas de respiración diafragmática durante episodios de ansiedad con buenos resultados. Trabajamos en identificación de pensamientos automáticos negativos y reestructuración cognitiva. Se observa mayor consciencia sobre sus patrones de pensamiento. Tarea asignada: registro diario de situaciones ansiógenas y respuestas adaptativas.",
  },
  {
    id: 2,
    pacienteId: 1,
    fecha: "2025-11-13",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "Sesión enfocada en técnicas de relajación progresiva. La paciente mostró dificultades iniciales para concentrarse pero logró completar el ejercicio completo. Discutimos estrategias de afrontamiento ante situaciones laborales estresantes. Se trabajó en establecer límites saludables en el ámbito profesional.",
  },
  {
    id: 3,
    pacienteId: 2,
    fecha: "2025-11-22",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "El paciente reporta mejoría en la organización de sus tareas laborales. Ha implementado pausas regulares durante la jornada de trabajo como acordamos. Exploramos creencias sobre perfeccionismo y su impacto en el bienestar. Se evidencia progreso en la capacidad de delegar responsabilidades. Continuamos con ejercicios de mindfulness para manejo del estrés.",
  },
  {
    id: 4,
    pacienteId: 2,
    fecha: "2025-11-08",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      'Sesión dedicada a explorar el origen del burnout y patrones de sobrecarga laboral. El paciente identificó varios factores contribuyentes incluyendo dificultad para decir "no" y expectativas poco realistas sobre su rendimiento. Trabajamos en estrategias de establecimiento de límites profesionales.',
  },
  {
    id: 5,
    pacienteId: 3,
    fecha: "2025-11-15",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "La paciente muestra avances significativos en su estado de ánimo. Ha retomado actividades que antes disfrutaba, incluyendo ejercicio físico tres veces por semana. Procesamos emociones relacionadas con eventos pasados que contribuyeron al episodio depresivo. Se observa mejor higiene del sueño y rutina diaria más estructurada.",
  },
  {
    id: 6,
    pacienteId: 3,
    fecha: "2025-11-01",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "Continuamos trabajando en activación conductual. La paciente completó el registro de actividades placenteras y reporta leve mejoría en energía matutina. Exploramos pensamientos relacionados con autocrítica excesiva. Se acordó incrementar gradualmente actividades sociales.",
  },
  {
    id: 7,
    pacienteId: 4,
    fecha: "2025-11-18",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "El paciente continúa procesando el duelo por la pérdida reciente. Expresa emociones con mayor facilidad que en sesiones anteriores. Trabajamos en la aceptación del proceso de duelo y sus etapas. Se observa mejor capacidad para hablar sobre recuerdos positivos sin evitación emocional. Discutimos la importancia de mantener rutinas y conexiones sociales.",
  },
  {
    id: 8,
    pacienteId: 4,
    fecha: "2025-11-04",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "Sesión centrada en validación emocional y psicoeducación sobre el proceso de duelo. El paciente presenta dificultades para concentrarse en actividades cotidianas. Exploramos mecanismos de afrontamiento saludables versus evitación. Se estableció plan para mantener estructura diaria básica.",
  },
  {
    id: 9,
    pacienteId: 5,
    fecha: "2025-11-25",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "Excelente progreso en el manejo de ataques de pánico. La paciente no ha experimentado episodios completos en las últimas dos semanas. Ha estado practicando ejercicios de exposición gradual a situaciones previamente evitadas con éxito. Reporta mayor confianza en su capacidad de manejar la ansiedad anticipatoria. Continuamos reforzando técnicas de grounding y respiración.",
  },
  {
    id: 10,
    pacienteId: 5,
    fecha: "2025-11-11",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "Trabajamos en jerarquía de exposición a situaciones temidas. La paciente completó exitosamente dos niveles básicos de la jerarquía durante la semana. Procesamos la experiencia de enfrentar miedos y celebramos los logros. Se observa disminución gradual en conductas de evitación.",
  },
  {
    id: 11,
    pacienteId: 6,
    fecha: "2025-11-10",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "El paciente muestra mayor consciencia sobre patrones de pensamiento rígido característicos del trastorno. Hemos comenzado a trabajar en flexibilidad cognitiva mediante ejercicios prácticos. Discutimos la relación entre perfeccionismo y malestar emocional. Se nota resistencia al cambio, lo cual es esperado. Avanzamos lentamente pero de manera consistente.",
  },
  {
    id: 12,
    pacienteId: 6,
    fecha: "2025-10-27",
    duracion: 60,
    tipo: "Terapia Individual",
    notas:
      "Sesión dedicada a explorar esquemas tempranos desadaptativos. El paciente identificó patrones de autoexigencia excesiva originados en la infancia. Trabajamos en reconocer cuando estos esquemas se activan en situaciones actuales. Se asignaron tareas de autoobservación de patrones de comportamiento obsesivo-compulsivos.",
  },
];

// Concatenate with 2026 turnos
export const allTurnos = [...turnos, ...turnos2026];