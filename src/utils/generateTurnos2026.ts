// Utility to generate appointments for 2026
export function generateTurnos2026() {
  const turnos = [];
  let turnoId = 1;
  
  // Patient IDs 1-6
  const pacientes = [1, 2, 3, 4, 5, 6];
  
  // Appointment times
  const horarios = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  
  // Motivos por paciente
  const motivosPorPaciente: { [key: number]: string[] } = {
    1: ['Sesión de seguimiento', 'Control de ansiedad', 'Técnicas de relajación', 'Reestructuración cognitiva'],
    2: ['Evaluación de progreso', 'Seguimiento burnout', 'Técnicas de mindfulness', 'Manejo de estrés'],
    3: ['Terapia individual', 'Sesión quincenal', 'Control tratamiento', 'Activación conductual'],
    4: ['Sesión de duelo', 'Seguimiento duelo', 'Terapia psicodinámica', 'Resiliencia'],
    5: ['Terapia de exposición', 'Manejo de pánico', 'Control mensual', 'Técnicas de grounding'],
    6: ['Terapia de esquemas', 'Flexibilidad cognitiva', 'Control mensual', 'Patrones de pensamiento'],
  };
  
  // Frecuencias (en días)
  const frecuencias: { [key: number]: number } = {
    1: 7,   // semanal
    2: 14,  // quincenal
    3: 14,  // quincenal
    4: 7,   // semanal
    5: 7,   // semanal
    6: 30,  // mensual
  };
  
  // Modalidades preferidas
  const modalidades: { [key: number]: 'remoto' | 'presencial' } = {
    1: 'presencial',
    2: 'remoto',
    3: 'presencial',
    4: 'presencial',
    5: 'presencial',
    6: 'remoto',
  };
  
  // Montos por paciente
  const montos: { [key: number]: number } = {
    1: 8500,
    2: 12000,
    3: 10000,
    4: 8500,
    5: 8500,
    6: 8500,
  };
  
  // Generate appointments for entire 2026
  pacientes.forEach((pacienteId) => {
    let currentDate = new Date('2026-01-06'); // Start on Monday
    const endDate = new Date('2026-12-31');
    const frecuencia = frecuencias[pacienteId];
    
    while (currentDate <= endDate) {
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Select random hour and motivo
        const hora = horarios[Math.floor(Math.random() * horarios.length)];
        const motivosOptions = motivosPorPaciente[pacienteId];
        const motivo = motivosOptions[Math.floor(Math.random() * motivosOptions.length)];
        
        // Determine estado based on date
        const today = new Date('2025-12-21'); // Current date from system
        let estado: 'pendiente' | 'confirmado' | 'completado';
        
        if (currentDate < today) {
          estado = 'completado';
        } else if (currentDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          estado = 'confirmado';
        } else {
          estado = 'pendiente';
        }
        
        turnos.push({
          id: turnoId++,
          pacienteId,
          fecha: currentDate.toISOString().split('T')[0],
          hora,
          motivo,
          modalidad: modalidades[pacienteId],
          estado,
          monto: montos[pacienteId],
        });
      }
      
      // Move to next appointment date based on frequency
      currentDate = new Date(currentDate.getTime() + frecuencia * 24 * 60 * 60 * 1000);
    }
  });
  
  return turnos;
}
