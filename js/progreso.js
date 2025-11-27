// progreso.js
class ConexionApp {
    constructor() {
        this.historialEntrenamientos = this.cargarHistorial();
        this.inicializar();
    }

    inicializar() {
        // Inicializar menú hamburguesa
        this.inicializarMenu();
        // Cargar datos de progreso
        this.cargarProgreso();
        // Inicializar gráficas
        this.inicializarGraficas();
        // Inicializar tabs
        this.inicializarTabs();
    }

    inicializarMenu() {
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburgerMenu) {
            hamburgerMenu.addEventListener('click', () => {
                hamburgerMenu.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Cerrar menú al hacer clic en enlaces
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                if (hamburgerMenu) hamburgerMenu.classList.remove('active');
                if (navMenu) navMenu.classList.remove('active');
            });
        });
    }

    cargarHistorial() {
        try {
            return JSON.parse(localStorage.getItem('smartTrainer_historialEntrenamientos') || '[]');
        } catch (error) {
            console.error('Error al cargar historial:', error);
            return [];
        }
    }

    cargarProgreso() {
        // Datos de entrenamientos desde localStorage
        const rutinaData = this.cargarRutinaDesdeLocalStorage();
        const historial = this.historialEntrenamientos;

        // Calcular estadísticas
        this.calcularEstadisticas(historial, rutinaData);
        this.actualizarResumen(historial, rutinaData);
        this.actualizarEstadisticasDetalladas(historial, rutinaData);
        this.actualizarLogros(historial, rutinaData);
    }

    cargarRutinaDesdeLocalStorage() {
        try {
            const rutinaGuardada = localStorage.getItem('smartTrainer_rutinaActual');
            return rutinaGuardada ? JSON.parse(rutinaGuardada) : null;
        } catch (error) {
            console.error('Error al cargar rutina:', error);
            return null;
        }
    }

    calcularEstadisticas(historial, rutinaData) {
        // Totales generales
        const totalSesiones = historial.length;
        const totalCalorias = historial.reduce((sum, session) => sum + (session.calorias || 0), 0);
        const totalTiempo = historial.reduce((sum, session) => sum + (session.duracion || 0), 0);
        
        // Calcular racha actual
        const rachaActual = this.calcularRachaActual(historial);
        
        // Tendencias (comparar esta semana vs semana pasada)
        const tendencias = this.calcularTendencias(historial);

        return {
            totalSesiones,
            totalCalorias,
            totalTiempo,
            rachaActual,
            tendencias
        };
    }

    calcularRachaActual(historial) {
        if (historial.length === 0) return 0;
        
        // Ordenar por fecha (más reciente primero)
        const historialOrdenado = [...historial].sort((a, b) => 
            new Date(b.fecha) - new Date(a.fecha)
        );

        let racha = 0;
        let fechaActual = new Date();
        
        for (let i = 0; i < historialOrdenado.length; i++) {
            const fechaEntrenamiento = new Date(historialOrdenado[i].fecha);
            const diferenciaDias = Math.floor((fechaActual - fechaEntrenamiento) / (1000 * 60 * 60 * 24));
            
            if (diferenciaDias === racha) {
                racha++;
            } else {
                break;
            }
        }
        
        return racha;
    }

    calcularTendencias(historial) {
        const hoy = new Date();
        const inicioEstaSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
        const inicioSemanaPasada = new Date(hoy);
        inicioSemanaPasada.setDate(inicioSemanaPasada.getDate() - 7);

        const estaSemana = historial.filter(session => 
            new Date(session.fecha) >= inicioEstaSemana
        );
        
        const semanaPasada = historial.filter(session => {
            const fechaSession = new Date(session.fecha);
            return fechaSession >= inicioSemanaPasada && fechaSession < inicioEstaSemana;
        });

        const sesionesEstaSemana = estaSemana.length;
        const sesionesSemanaPasada = semanaPasada.length;
        const cambioSesiones = sesionesSemanaPasada > 0 ? 
            ((sesionesEstaSemana - sesionesSemanaPasada) / sesionesSemanaPasada * 100).toFixed(1) : 100;

        const caloriasEstaSemana = estaSemana.reduce((sum, s) => sum + (s.calorias || 0), 0);
        const caloriasSemanaPasada = semanaPasada.reduce((sum, s) => sum + (s.calorias || 0), 0);
        const cambioCalorias = caloriasSemanaPasada > 0 ? 
            ((caloriasEstaSemana - caloriasSemanaPasada) / caloriasSemanaPasada * 100).toFixed(1) : 100;

        return {
            sesiones: {
                valor: cambioSesiones,
                tendencia: cambioSesiones >= 0 ? 'up' : 'down'
            },
            calorias: {
                valor: cambioCalorias,
                tendencia: cambioCalorias >= 0 ? 'up' : 'down'
            }
        };
    }

    actualizarResumen(historial, rutinaData) {
        const stats = this.calcularEstadisticas(historial, rutinaData);
        const tendencias = stats.tendencias;

        // Actualizar sesiones completadas
        const totalSessionsElement = document.getElementById('totalSessions');
        if (totalSessionsElement) {
            totalSessionsElement.textContent = stats.totalSesiones;
        }

        const sessionsTrendElement = document.getElementById('sessionsTrend');
        if (sessionsTrendElement) {
            sessionsTrendElement.innerHTML = `
                <i class="fas fa-arrow-${tendencias.sesiones.tendencia}"></i>
                <span>${Math.abs(tendencias.sesiones.valor)}% esta semana</span>
            `;
        }

        // Actualizar calorías quemadas
        const totalCaloriesElement = document.getElementById('totalCalories');
        if (totalCaloriesElement) {
            totalCaloriesElement.textContent = stats.totalCalorias.toLocaleString();
        }

        const caloriesTrendElement = document.getElementById('caloriesTrend');
        if (caloriesTrendElement) {
            caloriesTrendElement.innerHTML = `
                <i class="fas fa-arrow-${tendencias.calorias.tendencia}"></i>
                <span>${Math.abs(tendencias.calorias.valor)}% esta semana</span>
            `;
        }

        // Actualizar tiempo entrenado
        const totalTimeElement = document.getElementById('totalTime');
        if (totalTimeElement) {
            const horas = Math.floor(stats.totalTiempo / 60);
            const minutos = stats.totalTiempo % 60;
            totalTimeElement.textContent = `${horas}h ${minutos}m`;
        }

        // Actualizar racha
        const currentStreakElement = document.getElementById('currentStreak');
        if (currentStreakElement) {
            currentStreakElement.textContent = `${stats.rachaActual} días`;
        }

        const streakTrendElement = document.getElementById('streakTrend');
        if (streakTrendElement) {
            if (stats.rachaActual > 0) {
                streakTrendElement.innerHTML = `
                    <i class="fas fa-fire"></i>
                    <span>¡Sigue así!</span>
                `;
            } else {
                streakTrendElement.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <span>Comienza tu racha</span>
                `;
            }
        }
    }

    actualizarEstadisticasDetalladas(historial, rutinaData) {
        // Ejercicios más realizados
        this.actualizarEjerciciosPopulares(historial, rutinaData);
        
        // Progreso por grupos musculares
        this.actualizarProgresoMuscular(historial, rutinaData);
        
        // Rendimiento general
        this.actualizarRendimiento(historial, rutinaData);
    }

    actualizarEjerciciosPopulares(historial, rutinaData) {
        // Contar ejercicios realizados (simulado - en una implementación real, 
        // esto vendría del tracking de ejercicios)
        const ejerciciosCount = {};
        
        // Simular datos de ejercicios (en producción, esto vendría del localStorage)
        const ejercicioMasRealizado = "Press de Banca";
        const countMasRealizado = 15;
        const mejorProgreso = "Sentadillas";
        const progresoCantidad = "+25%";
        const totalEjerciciosUnicos = 8;

        // Actualizar DOM
        const mostPerformedExercise = document.getElementById('mostPerformedExercise');
        const mostPerformedCount = document.getElementById('mostPerformedCount');
        const bestProgressExercise = document.getElementById('bestProgressExercise');
        const bestProgressAmount = document.getElementById('bestProgressAmount');
        const totalExercises = document.getElementById('totalExercises');

        if (mostPerformedExercise) mostPerformedExercise.textContent = ejercicioMasRealizado;
        if (mostPerformedCount) mostPerformedCount.textContent = `${countMasRealizado} veces`;
        if (bestProgressExercise) bestProgressExercise.textContent = mejorProgreso;
        if (bestProgressAmount) bestProgressAmount.textContent = progresoCantidad;
        if (totalExercises) totalExercises.textContent = totalEjerciciosUnicos;
    }

    actualizarProgresoMuscular(historial, rutinaData) {
        // Simular datos de progreso muscular (en producción, esto se calcularía
        // basado en los ejercicios realizados por grupo muscular)
        const upperBodyProgress = 75;
        const lowerBodyProgress = 60;
        const coreProgress = 45;

        // Actualizar barras de progreso
        const upperBodyElement = document.getElementById('upperBodyProgress');
        const lowerBodyElement = document.getElementById('lowerBodyProgress');
        const coreElement = document.getElementById('coreProgress');
        const upperBodyPercent = document.getElementById('upperBodyPercent');
        const lowerBodyPercent = document.getElementById('lowerBodyPercent');
        const corePercent = document.getElementById('corePercent');

        if (upperBodyElement) upperBodyElement.style.width = `${upperBodyProgress}%`;
        if (lowerBodyElement) lowerBodyElement.style.width = `${lowerBodyProgress}%`;
        if (coreElement) coreElement.style.width = `${coreProgress}%`;
        if (upperBodyPercent) upperBodyPercent.textContent = `${upperBodyProgress}%`;
        if (lowerBodyPercent) lowerBodyPercent.textContent = `${lowerBodyProgress}%`;
        if (corePercent) corePercent.textContent = `${coreProgress}%`;
    }

    actualizarRendimiento(historial, rutinaData) {
        // Simular datos de rendimiento
        const avgWeight = "45.5 kg";
        const weightChange = "+12%";
        const avgReps = "10.2";
        const repsChange = "+5%";
        const avgIntensity = "78%";
        const intensityChange = "+8%";

        // Actualizar DOM
        const avgWeightElement = document.getElementById('avgWeight');
        const weightChangeElement = document.getElementById('weightChange');
        const avgRepsElement = document.getElementById('avgReps');
        const repsChangeElement = document.getElementById('repsChange');
        const avgIntensityElement = document.getElementById('avgIntensity');
        const intensityChangeElement = document.getElementById('intensityChange');

        if (avgWeightElement) avgWeightElement.textContent = avgWeight;
        if (weightChangeElement) weightChangeElement.textContent = weightChange;
        if (avgRepsElement) avgRepsElement.textContent = avgReps;
        if (repsChangeElement) repsChangeElement.textContent = repsChange;
        if (avgIntensityElement) avgIntensityElement.textContent = avgIntensity;
        if (intensityChangeElement) intensityChangeElement.textContent = intensityChange;
    }

    actualizarLogros(historial, rutinaData) {
        const rachaActual = this.calcularRachaActual(historial);
        const totalHoras = historial.reduce((sum, session) => sum + (session.duracion || 0), 0) / 60;

        // Actualizar progreso de racha de 7 días
        const streak7Progress = document.getElementById('streak7Progress');
        const streak7Text = document.getElementById('streak7Text');
        
        if (streak7Progress && streak7Text) {
            const progreso = Math.min((rachaActual / 7) * 100, 100);
            streak7Progress.style.width = `${progreso}%`;
            streak7Text.textContent = `${Math.min(rachaActual, 7)}/7 días`;
        }

        // Actualizar progreso de horas mensuales
        const monthlyHoursProgress = document.getElementById('monthlyHoursProgress');
        const monthlyHoursText = document.getElementById('monthlyHoursText');
        
        if (monthlyHoursProgress && monthlyHoursText) {
            const horasEsteMes = this.calcularHorasEsteMes(historial);
            const progreso = Math.min((horasEsteMes / 20) * 100, 100);
            monthlyHoursProgress.style.width = `${progreso}%`;
            monthlyHoursText.textContent = `${horasEsteMes.toFixed(1)}/20 horas`;
        }
    }

    calcularHorasEsteMes(historial) {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        
        const entrenamientosEsteMes = historial.filter(session => 
            new Date(session.fecha) >= inicioMes
        );
        
        return entrenamientosEsteMes.reduce((sum, session) => sum + (session.duracion || 0), 0) / 60;
    }

    inicializarGraficas() {
        // Datos de ejemplo para las gráficas
        const datosSemana = {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            sesiones: [1, 0, 1, 1, 0, 1, 0],
            calorias: [320, 0, 380, 420, 0, 450, 0]
        };

        // Gráfica de progreso semanal
        this.crearGraficaSemanal(datosSemana);
        
        // Gráfica de distribución
        this.crearGraficaDistribucion();
        
        // Gráfica de progreso mensual
        this.crearGraficaMensual();
    }

    crearGraficaSemanal(datos) {
        const ctx = document.getElementById('weeklyProgressChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.labels,
                datasets: [
                    {
                        label: 'Sesiones',
                        data: datos.sesiones,
                        backgroundColor: '#ffcc00',
                        borderColor: '#ffcc00',
                        borderWidth: 1
                    },
                    {
                        label: 'Calorías (cientos)',
                        data: datos.calorias.map(c => c / 100),
                        backgroundColor: '#4CAF50',
                        borderColor: '#4CAF50',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    crearGraficaDistribucion() {
        const ctx = document.getElementById('workoutDistributionChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Superior', 'Inferior', 'Core', 'Cardio'],
                datasets: [{
                    data: [40, 30, 20, 10],
                    backgroundColor: [
                        '#ffcc00',
                        '#4CAF50',
                        '#2196F3',
                        '#9C27B0'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    crearGraficaMensual() {
        const ctx = document.getElementById('monthlyProgressChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                datasets: [{
                    label: 'Sesiones por Semana',
                    data: [3, 4, 2, 5],
                    borderColor: '#ffcc00',
                    backgroundColor: 'rgba(255, 204, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    inicializarTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remover clase active de todos los botones y paneles
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                // Agregar clase active al botón clickeado
                button.classList.add('active');

                // Mostrar el panel correspondiente
                const tabId = button.getAttribute('data-tab') + '-tab';
                const tabPane = document.getElementById(tabId);
                if (tabPane) {
                    tabPane.classList.add('active');
                }
            });
        });
    }

    // Función para registrar entrenamientos desde entrenamientos.js
    registrarEntrenamiento(diaCompletado) {
        console.log('📝 Registrando entrenamiento del día:', diaCompletado);
        
        const nuevoEntrenamiento = {
            fecha: new Date().toISOString(),
            dia: diaCompletado,
            duracion: 45, // minutos
            calorias: Math.round(45 * 8), // estimación: 8 calorías por minuto
            timestamp: Date.now()
        };

        // Verificar si ya existe un entrenamiento hoy
        const hoy = new Date().toISOString().split('T')[0];
        const existeHoy = this.historialEntrenamientos.some(entrenamiento => 
            entrenamiento.fecha.split('T')[0] === hoy
        );

        if (!existeHoy) {
            this.historialEntrenamientos.push(nuevoEntrenamiento);
            this.guardarHistorial();
            console.log('✅ Entrenamiento registrado:', nuevoEntrenamiento);
            return true;
        } else {
            console.log('ℹ️ Ya existe un entrenamiento registrado hoy');
            return false;
        }
    }

    guardarHistorial() {
        try {
            localStorage.setItem('smartTrainer_historialEntrenamientos', 
                JSON.stringify(this.historialEntrenamientos));
        } catch (error) {
            console.error('Error al guardar historial:', error);
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.ConexionApp = new ConexionApp();
});

// Función global para ser llamada desde entrenamientos.js
window.registrarEntrenamientoCompletado = function(diaCompletado) {
    if (window.ConexionApp) {
        return window.ConexionApp.registrarEntrenamiento(diaCompletado);
    }
    return false;
};