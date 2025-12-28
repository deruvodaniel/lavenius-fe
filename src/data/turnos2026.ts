import { Turno } from './mockData';

// Generate appointments for all of 2026
export function generateTurnos2026(): Turno[] {
  const turnos: Turno[] = [];
  let turnoId = 26; // Start after existing turnos
  
  const motivosPorPaciente: { [key: number]: string[] } = {
    1: ['Sesión de seguimiento', 'Control de ansiedad', 'Técnicas de relajación', 'Reestructuración cognitiva'],
    2: ['Evaluación de progreso', 'Seguimiento burnout', 'Técnicas de mindfulness', 'Manejo de estrés'],
    3: ['Terapia individual', 'Sesión quincenal', 'Control tratamiento', 'Activación conductual'],
    4: ['Sesión de duelo', 'Seguimiento duelo', 'Terapia psicodinámica', 'Resiliencia'],
    5: ['Terapia de exposición', 'Manejo de pánico', 'Control mensual', 'Técnicas de grounding'],
    6: ['Terapia de esquemas', 'Flexibilidad cognitiva', 'Control mensual', 'Patrones de pensamiento'],
  };
  
  const frecuenciasDias: { [key: number]: number } = {
    1: 7,   // semanal
    2: 14,  // quincenal
    3: 14,  // quincenal
    4: 7,   // semanal
    5: 7,   // semanal
    6: 30,  // mensual
  };
  
  const modalidades: { [key: number]: 'remoto' | 'presencial' } = {
    1: 'presencial',
    2: 'remoto',
    3: 'presencial',
    4: 'presencial',
    5: 'presencial',
    6: 'remoto',
  };
  
  const montos: { [key: number]: number } = {
    1: 8500,
    2: 12000,
    3: 10000,
    4: 8500,
    5: 8500,
    6: 8500,
  };
  
  const horarios = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  
  // Para cada paciente
  for (let pacienteId = 1; pacienteId <= 6; pacienteId++) {
    let fecha = new Date('2026-01-05');
    const endDate = new Date('2026-12-31');
    const frecuencia = frecuenciasDias[pacienteId];
    
    while (fecha <= endDate) {
      const dayOfWeek = fecha.getDay();
      
      // Solo días laborables (lunes a viernes)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const hora = horarios[Math.floor(Math.random() * horarios.length)];
        const motivosOptions = motivosPorPaciente[pacienteId];
        const motivo = motivosOptions[Math.floor(Math.random() * motivosOptions.length)];
        
        turnos.push({
          id: turnoId++,
          pacienteId,
          fecha: fecha.toISOString().split('T')[0],
          hora,
          motivo,
          modalidad: modalidades[pacienteId],
          estado: 'pendiente',
          monto: montos[pacienteId],
        });
      }
      
      // Avanzar según frecuencia
      fecha = new Date(fecha.getTime() + frecuencia * 24 * 60 * 60 * 1000);
    }
  }
  
  return turnos;
}

// Export the generated turnos
export const turnos2026 = generateTurnos2026();
