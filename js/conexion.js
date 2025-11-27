// conexion.js - Conecta entrenamientos.js con progreso.js
class ConexionApp {
    constructor() {
        this.estado = 'inicializado';
        console.log('🔄 ConexionApp inicializada');
    }

    // Método para registrar entrenamientos desde cualquier módulo
    registrarEntrenamiento(diaCompletado, datosEjercicios = {}) {
        console.log(`📝 Registrando entrenamiento del día ${diaCompletado}`, datosEjercicios);
        
        const entrenamiento = {
            fecha: new Date().toISOString(),
            dia: diaCompletado,
            duracion: datosEjercicios.duracion || 45,
            calorias: datosEjercicios.calorias || 360,
            ejercicios: datosEjercicios.ejercicios || [],
            timestamp: Date.now()
        };

        // Guardar en localStorage
        this.guardarEnHistorial(entrenamiento);
        
        // Actualizar rutina actual
        this.actualizarProgresoRutina(diaCompletado);
        
        // Disparar evento para que progreso.js se actualice
        this.notificarActualizacion();
        
        return true;
    }

    guardarEnHistorial(entrenamiento) {
        try {
            let historial = JSON.parse(localStorage.getItem('smartTrainer_historialEntrenamientos') || '[]');
            
            // Verificar si ya existe entrenamiento hoy
            const hoy = new Date().toISOString().split('T')[0];
            const entrenamientoHoy = historial.find(e => e.fecha.split('T')[0] === hoy);
            
            if (!entrenamientoHoy) {
                historial.push(entrenamiento);
                localStorage.setItem('smartTrainer_historialEntrenamientos', JSON.stringify(historial));
                console.log('✅ Entrenamiento guardado en historial');
            } else {
                console.log('ℹ️ Ya existe entrenamiento hoy, actualizando...');
                Object.assign(entrenamientoHoy, entrenamiento);
                localStorage.setItem('smartTrainer_historialEntrenamientos', JSON.stringify(historial));
            }
        } catch (error) {
            console.error('❌ Error guardando historial:', error);
        }
    }

    actualizarProgresoRutina(diaCompletado) {
        try {
            const rutinaData = JSON.parse(localStorage.getItem('smartTrainer_rutinaActual') || '{}');
            
            if (rutinaData && rutinaData.progreso) {
                rutinaData.progreso.sesionesCompletadas = diaCompletado;
                rutinaData.progreso.diaActual = diaCompletado + 1;
                rutinaData.progreso.porcentajeCompletado = Math.round(
                    (diaCompletado / rutinaData.progreso.totalSesiones) * 100
                );
                rutinaData.fechaModificacion = new Date().toISOString();
                
                localStorage.setItem('smartTrainer_rutinaActual', JSON.stringify(rutinaData));
                console.log('✅ Progreso de rutina actualizado');
            }
        } catch (error) {
            console.error('❌ Error actualizando rutina:', error);
        }
    }

    notificarActualizacion() {
        // Crear evento personalizado para que progreso.js escuche
        const event = new CustomEvent('entrenamientoRegistrado', {
            detail: { timestamp: Date.now() }
        });
        window.dispatchEvent(event);
        console.log('📢 Evento de actualización disparado');
    }

    // Obtener datos para progreso.js
    obtenerDatosProgreso() {
        try {
            const rutinaData = JSON.parse(localStorage.getItem('smartTrainer_rutinaActual') || '{}');
            const historialData = JSON.parse(localStorage.getItem('smartTrainer_historialEntrenamientos') || '[]');
            
            return {
                rutina: rutinaData,
                historial: historialData,
                tieneDatos: !!(rutinaData && historialData.length > 0)
            };
        } catch (error) {
            console.error('❌ Error obteniendo datos:', error);
            return { rutina: null, historial: [], tieneDatos: false };
        }
    }
}

// Crear instancia global
window.ConexionApp = new ConexionApp();