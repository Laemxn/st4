// Configuración de la API DeepSeek
const DEEPSEEK_API_KEY = 'sk-ec85d3a0cead48699d9f0f21b7142a9e';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Elementos DOM
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navMenu = document.querySelector('.nav-menu');
const routineForm = document.getElementById('routineForm');
const generateRoutineBtn = document.getElementById('generateRoutineBtn');
const routineLoading = document.getElementById('routineLoading');
const currentRoutineSection = document.getElementById('currentRoutineSection');
const routineGeneratorSection = document.getElementById('routineGeneratorSection');
const routineContent = document.getElementById('routineContent');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const regenerateRoutineBtn = document.getElementById('regenerateRoutineBtn');
const sessionTrackerSection = document.getElementById('sessionTrackerSection');
const startSessionBtn = document.getElementById('startSessionBtn');
const completeSessionBtn = document.getElementById('completeSessionBtn');
const exerciseTrackerModal = document.getElementById('exerciseTrackerModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const saveSetsBtn = document.getElementById('saveSetsBtn');
const completeExerciseBtn = document.getElementById('completeExerciseBtn');
const completeDayBtn = document.getElementById('completeDayBtn');
const eliminarRutinaBtn = document.getElementById('eliminarRutinaBtn');

// Variables de estado
let currentRoutine = null;
let startTime;
let generationTimer;
let currentExerciseData = null;
let currentSessionExercises = [];

// ===== FUNCIONES COMPARTIDAS CON PROGRESO =====

// Menú Hamburguesa
hamburgerMenu.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburgerMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ===== GESTIÓN DE RUTINAS =====

// Generación de Rutina con IA
routineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Feedback visual
    generateRoutineBtn.disabled = true;
    routineLoading.style.display = 'block';
    generateRoutineBtn.textContent = 'Generando Rutina...';
    
    // Iniciar temporizador
    startTime = Date.now();
    startGenerationTimer();
    
    // Mostrar progreso
    mostrarProgresoRutina();
    actualizarPasoRutina(1, "Analizando tus datos...");
    
    const formData = {
        trainingGoal: document.getElementById('trainingGoal').value,
        trainingLevel: document.getElementById('trainingLevel').value,
        trainingDays: document.getElementById('trainingDays').value,
        sessionDuration: document.getElementById('sessionDuration').value,
        availableEquipment: document.getElementById('availableEquipment').value,
        trainingFocus: document.getElementById('trainingFocus').value,
        specificNeeds: document.getElementById('specificNeeds').value
    };
    
    try {
        console.log('🚀 Iniciando generación de rutina...');
        
        // Paso 1: Validación
        actualizarPasoRutina(1, "Validando información...");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Paso 2: Conectando con IA
        actualizarPasoRutina(2, "Conectando con DeepSeek AI...");
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Paso 3: Generando rutina
        actualizarPasoRutina(3, "La IA está creando tu rutina personalizada...");
        
        const rutinaGenerada = await generarRutinaConIA(formData);
        const endTime = Date.now();
        const generationTime = (endTime - startTime) / 1000;
        
        // Detener temporizador
        clearInterval(generationTimer);
        
        // Paso 4: Completado
        actualizarPasoRutina(4, `¡Rutina generada con éxito!`);
        
        // Mostrar tiempo real
        mostrarTiempoRealRutina(generationTime);
        
        console.log(`✅ Rutina generada en ${generationTime.toFixed(1)} segundos`);
        
        // Guardar y mostrar rutina
        currentRoutine = rutinaGenerada;
        routineContent.innerHTML = rutinaGenerada;
        
        // GUARDAR EN LOCALSTORAGE
        guardarRutinaEnLocalStorage(rutinaGenerada, formData);
        
        // INICIALIZAR PROGRESO EN SISTEMA DE PROGRESO
        inicializarProgresoParaRutina(formData);
        
        // Procesar ejercicios para el tracker - CON TIMEOUT PARA ASEGURAR RENDER
        setTimeout(() => {
            procesarEjerciciosParaTracker();
        }, 500);
        
        // Mostrar secciones
        currentRoutineSection.style.display = 'block';
        routineGeneratorSection.style.display = 'none';
        currentRoutineSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        clearInterval(generationTimer);
        actualizarPasoRutina(0, `Error: ${error.message}`);
        alert('Error al generar la rutina: ' + error.message);
    } finally {
        generateRoutineBtn.disabled = false;
        routineLoading.style.display = 'none';
        generateRoutineBtn.innerHTML = '<i class="fas fa-brain"></i> Generar Rutina con IA';
    }
});

// Función para generar rutina con IA DeepSeek
async function generarRutinaConIA(datos) {
    console.log('Datos del usuario:', datos);

    // Validar API Key
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.includes('tu_api_key')) {
        throw new Error('API Key no configurada correctamente');
    }

    // Mapear valores a texto descriptivo
    const objetivosMap = {
        'ganar_masa_muscular': 'Ganar Masa Muscular',
        'perder_grasa': 'Perder Grasa Corporal',
        'definicion_muscular': 'Definición Muscular',
        'aumentar_fuerza': 'Aumentar Fuerza',
        'mejorar_resistencia': 'Mejorar Resistencia',
        'salud_general': 'Salud General'
    };

    const nivelMap = {
        'principiante': 'Principiante (0-6 meses)',
        'intermedio': 'Intermedio (6 meses - 2 años)',
        'avanzado': 'Avanzado (2+ años)'
    };

    const equipamientoMap = {
        'casa_basico': 'Casa Básico (pesas, bandas)',
        'casa_completo': 'Casa Completo (barra, banco, pesas)',
        'gimnasio_basico': 'Gimnasio Básico',
        'gimnasio_completo': 'Gimnasio Completo',
        'solo_cuerpo': 'Solo Peso Corporal'
    };

    const enfoqueMap = {
        'fullbody': 'Full Body',
        'upper_lower': 'Upper/Lower',
        'push_pull_legs': 'Push/Pull/Legs',
        'bro_split': 'Split por Grupo Muscular'
    };

    const prompt = `Eres un entrenador personal certificado. Genera una rutina de entrenamiento PERSONALIZADA usando EXACTAMENTE esta estructura HTML:

<div class="routine-overview">
<h3>📊 Resumen de Tu Rutina Personalizada</h3>
<div class="meta-grid">
<div class="meta-item">
<i class="fas fa-bullseye"></i>
<div>
<div class="meta-label">Objetivo</div>
<div class="meta-value">${objetivosMap[datos.trainingGoal]}</div>
</div>
</div>
<div class="meta-item">
<i class="fas fa-chart-line"></i>
<div>
<div class="meta-label">Nivel</div>
<div class="meta-value">${nivelMap[datos.trainingLevel]}</div>
</div>
</div>
<div class="meta-item">
<i class="fas fa-calendar"></i>
<div>
<div class="meta-label">Días/Semana</div>
<div class="meta-value">${datos.trainingDays} días</div>
</div>
</div>
<div class="meta-item">
<i class="fas fa-clock"></i>
<div>
<div class="meta-label">Duración</div>
<div class="meta-value">${datos.sessionDuration} min/sesión</div>
</div>
</div>
</div>
</div>

<div class="weekly-schedule">
<h3>🗓️ Planificación Semanal</h3>
<div class="schedule-grid">
<!-- GENERA ${datos.trainingDays} DÍAS DE ENTRENAMIENTO -->
<div class="day-card">
<div class="day-header">
<div class="day-number">DÍA 1</div>
<div class="day-name">Nombre del Día</div>
</div>
<div class="day-info">
<div class="day-muscles"><i class="fas fa-dumbbell"></i> Grupos Musculares</div>
<div class="day-duration"><i class="fas fa-clock"></i> ${datos.sessionDuration}min</div>
</div>
<div class="exercises">
<h4>Ejercicios:</h4>
<ul>
<li><strong>Nombre Ejercicio:</strong> SeriesxReps - Descanso</li>
</ul>
</div>
</div>
</div>
</div>

<div class="progression-plan">
<h3>📈 Plan de Progresión</h3>
<div class="progression-content">
<h4>Semana 1-4:</h4>
<ul>
<li>Instrucciones específicas de progresión</li>
</ul>
<h4>Semana 5-8:</h4>
<ul>
<li>Instrucciones avanzadas de progresión</li>
</ul>
</div>
</div>

<div class="training-notes">
<h3>💡 Notas Importantes</h3>
<div class="notes-content">
<ul>
<li>Nota personalizada 1</li>
<li>Nota personalizada 2</li>
<li>Nota personalizada 3</li>
</ul>
</div>
</div>

**IMPORTANTE:**
- Usa SOLO HTML válido, sin caracteres escapados
- No uses &lt; &gt; &quot; &amp; etc.
- Usa las clases CSS exactas proporcionadas
- Los ejercicios deben ser realistas para el equipamiento: ${equipamientoMap[datos.availableEquipment]}
- Adapta la dificultad al nivel: ${nivelMap[datos.trainingLevel]}
- Enfócate en el objetivo: ${objetivosMap[datos.trainingGoal]}

Responde SOLO con el HTML completo, sin comentarios adicionales ni texto explicativo.`;

    console.log('Enviando solicitud a DeepSeek API...');
    
    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 4000,
            temperature: 0.7,
            stream: false
        })
    });

    console.log('Respuesta recibida, status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error en la API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Datos completos de respuesta:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Estructura de respuesta inválida de la API');
    }

    let rutinaHTML = data.choices[0].message.content;

    console.log('HTML crudo recibido:', rutinaHTML);

    // DECODIFICACIÓN MEJORADA - Eliminar todo el texto antes del primer <div>
    rutinaHTML = rutinaHTML.replace(/^[^<]*/, '');

    // Decodificar HTML completamente
    rutinaHTML = rutinaHTML
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .trim();

    // Limpiar cualquier texto sobrante
    rutinaHTML = rutinaHTML.replace(/^[\s\S]*?(?=<div)/, '');

    // Validar que tenemos HTML válido
    if (!rutinaHTML.includes('<div') || !rutinaHTML.includes('</div>')) {
        console.error('HTML inválido generado:', rutinaHTML);
        throw new Error('La IA no generó un HTML válido. Intenta nuevamente.');
    }

    // Asegurar que comience con un div
    if (!rutinaHTML.startsWith('<div')) {
        const firstDiv = rutinaHTML.indexOf('<div');
        if (firstDiv !== -1) {
            rutinaHTML = rutinaHTML.substring(firstDiv);
        }
    }

    console.log('HTML procesado:', rutinaHTML);

    // Validar contenido
    if (!rutinaHTML || rutinaHTML.trim().length < 100) {
        throw new Error('La IA no generó una rutina completa. Intenta nuevamente.');
    }

    return rutinaHTML;
}

// ===== SISTEMA DE PROGRESO INTEGRADO =====

// Inicializar progreso cuando se crea una nueva rutina
function inicializarProgresoParaRutina(datosUsuario) {
    const progresoData = cargarProgresoDesdeLocalStorage();
    
    // Si es la primera rutina o no hay progreso, inicializar
    if (!progresoData || Object.keys(progresoData).length === 0) {
        const nuevoProgreso = {
            fechaCreacion: new Date().toISOString(),
            rutinaActual: datosUsuario,
            registrosDiarios: [],
            medidasCorporales: [],
            recordsFuerza: [],
            ciclosCompletados: 0,
            estadisticas: {
                pesoInicial: null,
                pesoActual: null,
                mejorPeso: null,
                totalSesiones: 0,
                totalEjercicios: 0,
                pesoTotalLevantado: 0,
                diasConsecutivos: 0,
                ultimoCicloCompletado: null
            },
            logrosDesbloqueados: [],
            configuracion: {
                objetivo: datosUsuario.trainingGoal,
                pesoMeta: null,
                fechaMeta: null
            }
        };
        
        localStorage.setItem('smartTrainer_progreso', JSON.stringify(nuevoProgreso));
        console.log('✅ Progreso inicializado para nueva rutina');
    } else {
        // Actualizar configuración con nueva rutina
        progresoData.rutinaActual = datosUsuario;
        progresoData.configuracion.objetivo = datosUsuario.trainingGoal;
        progresoData.fechaModificacion = new Date().toISOString();
        
        localStorage.setItem('smartTrainer_progreso', JSON.stringify(progresoData));
        console.log('✅ Progreso actualizado con nueva rutina');
    }
}

// Cargar progreso desde localStorage (COMPARTIDA CON PROGRESO.JS)
function cargarProgresoDesdeLocalStorage() {
    const progresoGuardado = localStorage.getItem('smartTrainer_progreso');
    
    if (progresoGuardado) {
        try {
            return JSON.parse(progresoGuardado);
        } catch (error) {
            console.error('Error al cargar progreso:', error);
            return null;
        }
    }
    return null;
}

// Guardar progreso en localStorage (COMPARTIDA CON PROGRESO.JS)
function guardarProgresoEnLocalStorage(progresoData) {
    localStorage.setItem('smartTrainer_progreso', JSON.stringify(progresoData));
}

// Actualizar estadísticas cuando se completan ejercicios
function actualizarEstadisticasProgreso(ejercicioCompletado, pesoTotal) {
    const progresoData = cargarProgresoDesdeLocalStorage();
    
    if (!progresoData) return;
    
    // Actualizar estadísticas
    progresoData.estadisticas.totalEjercicios = (progresoData.estadisticas.totalEjercicios || 0) + 1;
    progresoData.estadisticas.pesoTotalLevantado = (progresoData.estadisticas.pesoTotalLevantado || 0) + pesoTotal;
    
    // Guardar cambios
    guardarProgresoEnLocalStorage(progresoData);
}

// ===== GESTIÓN DE RUTINA LOCALSTORAGE =====

function guardarRutinaEnLocalStorage(rutinaHTML, datosUsuario) {
    const rutinaData = {
        html: rutinaHTML,
        datos: datosUsuario,
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString(),
        progreso: {
            diaActual: 1,
            sesionesCompletadas: 0,
            totalSesiones: parseInt(datosUsuario.trainingDays),
            porcentajeCompletado: 0,
            proximaSesion: 'Día 1',
            ejerciciosCompletados: 0,
            totalEjercicios: 0,
            pesoTotalLevantado: 0,
            diasCompletados: []
        },
        historialEjercicios: {}
    };
    
    localStorage.setItem('smartTrainer_rutinaActual', JSON.stringify(rutinaData));
    console.log('✅ Rutina guardada en localStorage');
}

function cargarRutinaDesdeLocalStorage() {
    const rutinaGuardada = localStorage.getItem('smartTrainer_rutinaActual');
    
    if (rutinaGuardada) {
        try {
            const rutinaData = JSON.parse(rutinaGuardada);
            return rutinaData;
        } catch (error) {
            console.error('Error al cargar rutina:', error);
            return null;
        }
    }
    return null;
}

// ===== SISTEMA DE TRACKING =====

function procesarEjerciciosParaTracker() {
    console.log('🔄 Procesando ejercicios para tracker...');
    
    currentSessionExercises = [];
    const diaActual = obtenerDiaActual();
    
    console.log(`📅 Día actual: ${diaActual}`);
    
    // BUSCAR SOLAMENTE EN LOS EJERCICIOS DENTRO DE DAY-CARDS
    const dayCards = routineContent.querySelectorAll('.day-card');
    
    console.log('Días encontrados en la rutina:', dayCards.length);
    
    dayCards.forEach((dayCard, dayIndex) => {
        const numeroDia = dayIndex + 1;
        
        // CORRECCIÓN: El día 1 siempre está disponible, los demás según progreso
        const estaDisponible = numeroDia === 1 || esDiaDisponible(numeroDia);
        
        console.log(`Día ${numeroDia} - Disponible: ${estaDisponible} (Día actual: ${diaActual})`);
        
        // Buscar ejercicios en este día
        const exercisesList = dayCard.querySelectorAll('.exercises li');
        
        exercisesList.forEach((ejercicio, exerciseIndex) => {
            const textoEjercicio = ejercicio.textContent || ejercicio.innerText;
            
            // Solo procesar si parece un ejercicio real
            if (textoEjercicio.includes(':') && textoEjercicio.match(/\d+x\d+/)) {
                const ejercicioId = `d${numeroDia}-e${exerciseIndex}`;
                const ejercicioData = parsearEjercicio(textoEjercicio, ejercicioId);
                
                if (ejercicioData) {
                    // Agregar información del día al ejercicio
                    ejercicioData.dia = numeroDia;
                    ejercicioData.disponible = estaDisponible;
                    
                    currentSessionExercises.push(ejercicioData);
                    
                    // Solo agregar botón si el día está disponible
                    if (estaDisponible) {
                        agregarBotonTrack(ejercicio, ejercicioData);
                    } else {
                        agregarBotonBloqueado(ejercicio, numeroDia);
                    }
                }
            }
        });
        
        // Añadir indicador visual del día actual
        if (numeroDia === diaActual) {
            dayCard.style.borderColor = '#ffcc00';
            dayCard.style.boxShadow = '0 0 15px rgba(255, 204, 0, 0.3)';
            
            // Agregar badge de "Día Actual"
            const currentBadge = document.createElement('div');
            currentBadge.className = 'current-badge';
            currentBadge.textContent = '🎯 Día Actual';
            currentBadge.style.position = 'absolute';
            currentBadge.style.top = '-10px';
            currentBadge.style.right = '-10px';
            currentBadge.style.backgroundColor = '#ffcc00';
            currentBadge.style.color = '#121212';
            currentBadge.style.padding = '0.5rem 1rem';
            currentBadge.style.borderRadius = '20px';
            currentBadge.style.fontSize = '0.8rem';
            currentBadge.style.fontWeight = '600';
            currentBadge.style.boxShadow = '0 2px 10px rgba(255, 204, 0, 0.3)';
            currentBadge.style.zIndex = '5';
            
            dayCard.style.position = 'relative';
            dayCard.appendChild(currentBadge);
        }
        
        // CORRECCIÓN: Si el día no está disponible, agregar estilo visual
        if (!estaDisponible) {
            dayCard.style.opacity = '0.7';
            dayCard.style.filter = 'grayscale(0.3)';
        }
    });
    
    console.log('✅ Ejercicios procesados:', currentSessionExercises.length);
    actualizarProgresoDiaActual();
}

// Función para obtener el día actual
function obtenerDiaActual() {
    const rutinaData = cargarRutinaDesdeLocalStorage();
    return rutinaData && rutinaData.progreso ? rutinaData.progreso.diaActual : 1;
}

// Función para verificar si un día está disponible para tracking
function esDiaDisponible(diaSolicitado) {
    const rutinaData = cargarRutinaDesdeLocalStorage();
    if (!rutinaData) return diaSolicitado === 1; // Si no hay rutina, solo día 1 disponible
    
    const diaActual = rutinaData.progreso.diaActual;
    
    // El día 1 siempre está disponible, y los días siguientes solo si son <= al día actual
    return diaSolicitado === 1 || diaSolicitado <= diaActual;
}

// Función para agregar botón bloqueado en días no disponibles
function agregarBotonBloqueado(elementoEjercicio, dia) {
    const bloqueadoBtn = document.createElement('button');
    bloqueadoBtn.className = 'track-exercise-btn blocked';
    bloqueadoBtn.innerHTML = '<i class="fas fa-lock"></i> Bloqueado';
    bloqueadoBtn.title = `Completa el Día ${dia - 1} primero`;
    
    // Estilos para botón bloqueado
    bloqueadoBtn.style.position = 'absolute';
    bloqueadoBtn.style.top = '10px';
    bloqueadoBtn.style.right = '10px';
    bloqueadoBtn.style.backgroundColor = '#666';
    bloqueadoBtn.style.color = '#ccc';
    bloqueadoBtn.style.border = 'none';
    bloqueadoBtn.style.padding = '8px 12px';
    bloqueadoBtn.style.borderRadius = '20px';
    bloqueadoBtn.style.fontSize = '0.8rem';
    bloqueadoBtn.style.fontWeight = '600';
    bloqueadoBtn.style.cursor = 'not-allowed';
    bloqueadoBtn.style.opacity = '0.7';
    
    elementoEjercicio.style.position = 'relative';
    elementoEjercicio.style.paddingRight = '100px';
    elementoEjercicio.appendChild(bloqueadoBtn);
}

function agregarBotonTrack(elementoEjercicio, ejercicioData) {
    // Verificar que el elemento sea realmente un ejercicio (tiene formato de ejercicio)
    const texto = elementoEjercicio.textContent || elementoEjercicio.innerText;
    
    // Si no parece un ejercicio (sin ":", sin números de series/reps), no agregar botón
    if (!texto.includes(':') && !texto.match(/\d+x\d+/)) {
        console.log('❌ Elemento no parece ser un ejercicio, omitiendo:', texto);
        return;
    }
    
    // Verificar si ya tiene botón
    const botonExistente = elementoEjercicio.querySelector('.track-exercise-btn');
    if (botonExistente) {
        botonExistente.remove();
    }
    
    // Crear botón de track
    const trackBtn = document.createElement('button');
    trackBtn.className = 'track-exercise-btn';
    trackBtn.innerHTML = '<i class="fas fa-dumbbell"></i> Track';
    trackBtn.onclick = () => abrirTrackerEjercicio(ejercicioData);
    
    // Aplicar estilos directamente
    trackBtn.style.position = 'absolute';
    trackBtn.style.top = '10px';
    trackBtn.style.right = '10px';
    trackBtn.style.backgroundColor = '#ffcc00';
    trackBtn.style.color = '#121212';
    trackBtn.style.border = 'none';
    trackBtn.style.padding = '8px 12px';
    trackBtn.style.borderRadius = '20px';
    trackBtn.style.fontSize = '0.8rem';
    trackBtn.style.fontWeight = '600';
    trackBtn.style.cursor = 'pointer';
    trackBtn.style.transition = 'all 0.3s ease';
    trackBtn.style.zIndex = '10';
    
    trackBtn.onmouseover = function() {
        this.style.backgroundColor = '#e6b800';
        this.style.transform = 'translateY(-2px)';
    };
    
    trackBtn.onmouseout = function() {
        this.style.backgroundColor = '#ffcc00';
        this.style.transform = 'translateY(0)';
    };
    
    // Asegurar que el elemento tenga posición relativa
    elementoEjercicio.style.position = 'relative';
    elementoEjercicio.style.paddingRight = '100px';
    
    // Agregar el botón
    elementoEjercicio.appendChild(trackBtn);
    
    console.log('✅ Botón agregado a ejercicio:', ejercicioData.nombre);
}

function parsearEjercicio(texto, id) {
    const textoLimpio = texto.trim().replace(/\s+/g, ' ');
    
    // Múltiples patrones para diferentes formatos
    const patrones = [
        /(.+?):\s*(\d+)x([\d-]+)\s*[–\-—]\s*(\d+)\s*(s|seg|segundos)/i,
        /(.+?):\s*(\d+)x([\d-]+)/i,
        /(.+?)\s+(\d+)x([\d-]+)\s*[–\-—]\s*(\d+)\s*(s|seg|segundos)/i,
        /(.+?)\s+(\d+)x([\d-]+)/i,
        /(.+?)\s*[–\-—]\s*(\d+)x([\d-]+)/i,
        /(.+?)$/i
    ];
    
    for (let i = 0; i < patrones.length; i++) {
        const match = textoLimpio.match(patrones[i]);
        if (match) {
            let series, repeticiones, descanso;
            
            if (i <= 3) {
                series = parseInt(match[2]) || 3;
                repeticiones = match[3] || '8-12';
                descanso = match[4] ? match[4] + (match[5] || 's') : '60s';
            } else if (i === 4) {
                series = parseInt(match[2]) || 3;
                repeticiones = match[3] || '8-12';
                descanso = '60s';
            } else {
                series = 3;
                repeticiones = '8-12';
                descanso = '60s';
            }
            
            return {
                id: id,
                nombre: match[1].trim(),
                series: series,
                repeticiones: repeticiones,
                descanso: descanso,
                sets: Array(series).fill().map((_, i) => ({
                    numero: i + 1,
                    completado: false,
                    peso: '',
                    reps: ''
                }))
            };
        }
    }
    
    return null;
}

// ===== MODAL DE TRACKING =====

function abrirTrackerEjercicio(ejercicioData) {
    console.log('🔓 Abriendo tracker para:', ejercicioData);
    currentExerciseData = ejercicioData;
    
    // Actualizar modal header
    document.getElementById('modalExerciseName').textContent = ejercicioData.nombre;
    
    // Actualizar información del ejercicio
    const exerciseInfo = document.getElementById('modalExerciseInfo');
    const setsCompletados = ejercicioData.sets.filter(s => s.completado).length;
    
    exerciseInfo.innerHTML = `
        <div class="exercise-meta">
            <div class="meta-item">
                <div class="meta-label">Series</div>
                <div class="meta-value">${ejercicioData.series}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Repeticiones</div>
                <div class="meta-value">${ejercicioData.repeticiones}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Descanso</div>
                <div class="meta-value">${ejercicioData.descanso}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Progreso</div>
                <div class="meta-value">${setsCompletados}/${ejercicioData.series}</div>
            </div>
        </div>
        <div class="exercise-instructions">
            <p><strong>💡 Instrucciones:</strong> Ingresa el peso y repeticiones para cada set. El sistema marcará automáticamente como completado cuando ingreses las repeticiones.</p>
        </div>
    `;
    
    // Generar sets tracker
    const setsTracker = document.getElementById('setsTracker');
    setsTracker.innerHTML = '<div class="sets-container" id="setsContainer"></div>';
    const setsContainer = document.getElementById('setsContainer');
    
    // Limpiar container primero
    setsContainer.innerHTML = '';
    
    // Crear cada set
    ejercicioData.sets.forEach((set, index) => {
        const setElement = document.createElement('div');
        setElement.className = `set-item ${set.completado ? 'completed' : ''}`;
        
        // Determinar estilo basado en estado
        const inputStyle = set.completado ? 
            'background-color: #2d2d2d; color: #888; border: 1px solid #4CAF50;' : 
            'background-color: #1e1e1e; color: #f5f5f5; border: 1px solid #3d3d3d;';
        
        const statusText = set.completado ? 'Completado' : 'Pendiente';
        const statusClass = set.completado ? 'completed' : '';
        
        setElement.innerHTML = `
            <div class="set-header">
                <div class="set-number">Set ${set.numero}</div>
                <div class="set-status ${statusClass}">
                    ${statusText}
                </div>
            </div>
            <div class="set-fields">
                <div class="field-group">
                    <label>💪 Peso (kg)</label>
                    <input type="number" 
                           class="field-input peso-input" 
                           data-set="${index}" 
                           value="${set.peso}" 
                           placeholder="Ej: 20.5" 
                           min="0" 
                           max="500"
                           step="0.5"
                           ${set.completado ? 'readonly' : ''}
                           style="${inputStyle}">
                </div>
                <div class="field-group">
                    <label>🔄 Repeticiones</label>
                    <input type="number" 
                           class="field-input reps-input" 
                           data-set="${index}" 
                           value="${set.reps}" 
                           placeholder="Ej: 12" 
                           min="0" 
                           max="50"
                           ${set.completado ? 'readonly' : ''}
                           style="${inputStyle}">
                </div>
            </div>
            ${set.completado ? 
                '<div class="set-completed-badge">✅ Completado</div>' : 
                '<div class="set-hint">💡 Ingresa peso y repeticiones</div>'
            }
        `;
        
        // Agregar event listeners para inputs
        const pesoInput = setElement.querySelector('.peso-input');
        const repsInput = setElement.querySelector('.reps-input');
        
        if (!set.completado) {
            // Solo agregar event listeners si no está completado
            pesoInput.addEventListener('input', function() {
                console.log(`Peso cambiado en set ${index + 1}:`, this.value);
                // Cambiar borde para indicar cambio no guardado
                this.style.borderColor = '#ffcc00';
            });
            
            repsInput.addEventListener('input', function() {
                console.log(`Reps cambiadas en set ${index + 1}:`, this.value);
                // Cambiar borde para indicar cambio no guardado
                this.style.borderColor = '#ffcc00';
                
                // Auto-marcar como completado si tiene reps
                if (this.value && this.value > 0) {
                    const setStatus = setElement.querySelector('.set-status');
                    setStatus.textContent = 'Listo para guardar';
                    setStatus.className = 'set-status ready-to-save';
                }
            });
        }
        
        setsContainer.appendChild(setElement);
    });
    
    // Actualizar botones de acción
    const todosLosSetsCompletados = setsCompletados === ejercicioData.series;
    
    if (todosLosSetsCompletados) {
        completeExerciseBtn.innerHTML = '<i class="fas fa-trophy"></i> Ejercicio Completado';
        completeExerciseBtn.style.backgroundColor = '#4CAF50';
    } else {
        completeExerciseBtn.innerHTML = '<i class="fas fa-check"></i> Completar Ejercicio';
        completeExerciseBtn.style.backgroundColor = '';
    }
    
    // Mostrar modal con animación
    exerciseTrackerModal.style.display = 'flex';
    exerciseTrackerModal.style.animation = 'fadeIn 0.3s ease-in-out';
    
    console.log('✅ Modal abierto correctamente para:', ejercicioData.nombre);
    console.log('📊 Sets completados:', setsCompletados, 'de', ejercicioData.series);
}

function guardarProgresoEjercicio() {
    if (!currentExerciseData) {
        alert('No hay ejercicio seleccionado');
        return;
    }
    
    console.log('🔍 Guardando progreso para:', currentExerciseData.nombre);
    
    const pesoInputs = document.querySelectorAll('.peso-input');
    const repsInputs = document.querySelectorAll('.reps-input');
    
    let cambiosRealizados = false;
    let setsCompletados = 0;
    
    // VERIFICAR CADA SET
    pesoInputs.forEach(input => {
        const setIndex = parseInt(input.dataset.set);
        const nuevoPeso = input.value.trim();
        const pesoAnterior = currentExerciseData.sets[setIndex].peso;
        
        console.log(`Set ${setIndex + 1} - Peso: ${pesoAnterior} -> ${nuevoPeso}`);
        
        if (nuevoPeso !== pesoAnterior) {
            currentExerciseData.sets[setIndex].peso = nuevoPeso;
            cambiosRealizados = true;
            console.log(`✅ Cambio detectado en peso del set ${setIndex + 1}`);
        }
    });
    
    repsInputs.forEach(input => {
        const setIndex = parseInt(input.dataset.set);
        const nuevasReps = input.value.trim();
        const repsAnterior = currentExerciseData.sets[setIndex].reps;
        
        console.log(`Set ${setIndex + 1} - Reps: ${repsAnterior} -> ${nuevasReps}`);
        
        if (nuevasReps !== repsAnterior) {
            currentExerciseData.sets[setIndex].reps = nuevasReps;
            cambiosRealizados = true;
            console.log(`✅ Cambio detectado en reps del set ${setIndex + 1}`);
            
            // Marcar como completado si tiene reps y no estaba completado
            if (nuevasReps && !currentExerciseData.sets[setIndex].completado) {
                currentExerciseData.sets[setIndex].completado = true;
                console.log(`✅ Set ${setIndex + 1} marcado como completado`);
            }
        }
        
        // Contar sets completados
        if (currentExerciseData.sets[setIndex].completado) {
            setsCompletados++;
        }
    });
    
    // ACTUALIZAR EN EL ARRAY DE EJERCICIOS
    const ejercicioIndex = currentSessionExercises.findIndex(e => e.id === currentExerciseData.id);
    if (ejercicioIndex !== -1) {
        currentSessionExercises[ejercicioIndex] = {...currentExerciseData};
        console.log('✅ Ejercicio actualizado en currentSessionExercises');
    }
    
    // GUARDAR EN LOCALSTORAGE
    if (cambiosRealizados) {
        const rutinaData = cargarRutinaDesdeLocalStorage();
        if (rutinaData) {
            if (!rutinaData.progresoEjercicios) {
                rutinaData.progresoEjercicios = {};
            }
            
            rutinaData.progresoEjercicios[currentExerciseData.id] = {
                ...currentExerciseData,
                ultimaActualizacion: new Date().toISOString(),
                setsCompletados: setsCompletados
            };
            
            localStorage.setItem('smartTrainer_rutinaActual', JSON.stringify(rutinaData));
            console.log('✅ Progreso guardado en localStorage');
        }
        
        alert(`¡Progreso guardado correctamente! 💪\nSets completados: ${setsCompletados}/${currentExerciseData.series}`);
        
        // Actualizar la UI del modal para reflejar cambios
        abrirTrackerEjercicio(currentExerciseData);
        
    } else {
        console.log('ℹ️ No se detectaron cambios en los inputs');
        alert('Por favor, ingresa el peso y/o repeticiones antes de guardar.');
    }
}

function completarEjercicio() {
    if (!currentExerciseData) {
        alert('No hay ejercicio seleccionado');
        return;
    }
    
    // Primero guardar cualquier cambio pendiente
    guardarProgresoEjercicio();
    
    // Calcular peso total levantado
    const pesoTotal = currentExerciseData.sets.reduce((total, set) => {
        const peso = parseFloat(set.peso) || 0;
        const reps = parseInt(set.reps) || 0;
        return total + (peso * reps);
    }, 0);
    
    // Actualizar progreso general
    const rutinaData = cargarRutinaDesdeLocalStorage();
    if (rutinaData) {
        // Solo incrementar si no estaba completado antes
        if (!rutinaData.historialEjercicios || !rutinaData.historialEjercicios[currentExerciseData.id]?.completado) {
            rutinaData.progreso.ejerciciosCompletados = (rutinaData.progreso.ejerciciosCompletados || 0) + 1;
        }
        
        rutinaData.progreso.pesoTotalLevantado = (rutinaData.progreso.pesoTotalLevantado || 0) + pesoTotal;
        
        // Guardar historial
        if (!rutinaData.historialEjercicios) {
            rutinaData.historialEjercicios = {};
        }
        
        rutinaData.historialEjercicios[currentExerciseData.id] = {
            fecha: new Date().toISOString(),
            sets: [...currentExerciseData.sets],
            pesoTotal: pesoTotal,
            completado: true,
            dia: currentExerciseData.dia
        };
        
        localStorage.setItem('smartTrainer_rutinaActual', JSON.stringify(rutinaData));
        
        // ACTUALIZAR PROGRESO EN SISTEMA DE PROGRESO
        actualizarEstadisticasProgreso(currentExerciseData, pesoTotal);
        
        // VERIFICAR SI TODOS LOS EJERCICIOS DEL DÍA ACTUAL ESTÁN COMPLETADOS
        const diaActual = rutinaData.progreso.diaActual;
        console.log(`🔍 Verificando completitud del Día ${diaActual}`);
        
        // Obtener todos los ejercicios del día actual
        const ejerciciosDelDia = currentSessionExercises.filter(e => e.dia === diaActual);
        console.log(`Ejercicios del día ${diaActual}:`, ejerciciosDelDia.length);
        
        // Verificar cuántos ejercicios del día están COMPLETAMENTE completados
        const ejerciciosCompletadosDelDia = ejerciciosDelDia.filter(ejercicio => {
            // Un ejercicio está completamente completado cuando TODOS sus sets están completados
            const todosLosSetsCompletados = ejercicio.sets.every(set => set.completado);
            console.log(`Ejercicio ${ejercicio.nombre}: ${todosLosSetsCompletados ? 'COMPLETADO' : 'PENDIENTE'}`);
            return todosLosSetsCompletados;
        });
        
        console.log(`Ejercicios completados del día ${diaActual}:`, ejerciciosCompletadosDelDia.length);
        
        // SOLO mostrar mensaje de día completado si TODOS los ejercicios del día están completados
        if (ejerciciosCompletadosDelDia.length === ejerciciosDelDia.length && ejerciciosDelDia.length > 0) {
            console.log(`🎉 ¡Día ${diaActual} completado!`);
            
            setTimeout(() => {
                const siguienteDia = diaActual + 1;
                const totalDias = rutinaData.progreso.totalSesiones;
                
                if (siguienteDia <= totalDias) {
                    const completarDia = confirm(`¡Felicidades! 🎉\n\nHas completado TODOS los ejercicios del Día ${diaActual}.\n\n¿Quieres avanzar al Día ${siguienteDia}?`);
                    if (completarDia) {
                        if (avanzarAlSiguienteDia()) {
                            alert(`¡Excelente! 🚀\n\nAhora puedes comenzar con el Día ${siguienteDia}.\n\n¡Sigue así! 💪`);
                            // Recargar para actualizar la interfaz
                            location.reload();
                        }
                    }
                } else {
                    alert(`¡Increíble logro! 🏆\n\nHas completado toda tu rutina de ${totalDias} días.\n\n¡Eres una máquina! 💪`);
                }
            }, 1000);
        } else {
            console.log(`Día ${diaActual} aún no completado: ${ejerciciosCompletadosDelDia.length}/${ejerciciosDelDia.length} ejercicios`);
        }
    }
    
    exerciseTrackerModal.style.display = 'none';
    
    const setsCompletados = currentExerciseData.sets.filter(set => set.completado).length;
    const todosLosSetsCompletados = setsCompletados === currentExerciseData.series;
    
    if (todosLosSetsCompletados) {
        alert(`¡Ejercicio ${currentExerciseData.nombre} completado! 🎉\n\n📊 Resumen:\n• Sets completados: ${setsCompletados}/${currentExerciseData.series}\n• Peso total levantado: ${pesoTotal}kg\n• ¡Buen trabajo! 💪`);
    } else {
        alert(`¡Progreso guardado! 📝\n\nEjercicio: ${currentExerciseData.nombre}\n• Sets completados: ${setsCompletados}/${currentExerciseData.series}\n• Continúa con los sets restantes 💪`);
    }
}

// ===== GESTIÓN DE DÍAS Y CICLOS =====

// Función para avanzar al siguiente día
function avanzarAlSiguienteDia() {
    const rutinaData = cargarRutinaDesdeLocalStorage();
    if (rutinaData && rutinaData.progreso) {
        const diaActual = rutinaData.progreso.diaActual;
        const totalDias = rutinaData.progreso.totalSesiones;
        
        console.log(`Avanzando de día ${diaActual} a ${diaActual + 1} de ${totalDias} totales`);
        
        if (diaActual < totalDias) {
            rutinaData.progreso.diaActual = diaActual + 1;
            rutinaData.progreso.sesionesCompletadas = diaActual; // El día completado
            rutinaData.progreso.porcentajeCompletado = Math.round((diaActual / totalDias) * 100);
            rutinaData.progreso.proximaSesion = `Día ${diaActual + 1}`;
            
            // Agregar día a la lista de días completados
            if (!rutinaData.progreso.diasCompletados) {
                rutinaData.progreso.diasCompletados = [];
            }
            rutinaData.progreso.diasCompletados.push(diaActual);
            
            rutinaData.fechaModificacion = new Date().toISOString();
            
            localStorage.setItem('smartTrainer_rutinaActual', JSON.stringify(rutinaData));
            console.log(`✅ Avanzado al día ${diaActual + 1}`);
            return true;
        } else {
            console.log('✅ Rutina completada completamente - listo para reiniciar');
            // No avanzamos más, pero permitimos que el usuario reinicie manualmente
            return false;
        }
    }
    return false;
}

// Función para completar el día actual
function completarDiaActual() {
    const rutinaData = cargarRutinaDesdeLocalStorage();
    
    if (!rutinaData) {
        alert('No hay rutina activa. Genera una rutina primero.');
        return;
    }
    
    const diaActual = rutinaData.progreso.diaActual;
    const totalDias = rutinaData.progreso.totalSesiones;
    
    // VERIFICAR SI ES EL ÚLTIMO DÍA
    if (diaActual >= totalDias) {
        const reiniciar = confirm(`¡Felicidades! 🏆\n\nHas completado toda tu rutina de ${totalDias} días.\n\n¿Quieres reiniciar la rutina desde el Día 1?`);
        
        if (reiniciar) {
            // REINICIAR AL DÍA 1
            rutinaData.progreso.diaActual = 1;
            rutinaData.progreso.sesionesCompletadas = 0;
            rutinaData.progreso.porcentajeCompletado = 0;
            rutinaData.progreso.proximaSesion = 'Día 1';
            rutinaData.progreso.ejerciciosCompletados = 0;
            rutinaData.progreso.pesoTotalLevantado = 0;
            rutinaData.progreso.diasCompletados = [];
            
            // Limpiar historial de ejercicios
            rutinaData.historialEjercicios = {};
            
            // Resetear progreso de todos los ejercicios
            if (currentSessionExercises.length > 0) {
                currentSessionExercises.forEach(ejercicio => {
                    ejercicio.sets.forEach(set => {
                        set.completado = false;
                        set.peso = '';
                        set.reps = '';
                    });
                });
            }
            
            rutinaData.fechaModificacion = new Date().toISOString();
            
            // ACTUALIZAR CICLOS EN SISTEMA DE PROGRESO
            const progresoData = cargarProgresoDesdeLocalStorage();
            if (progresoData) {
                progresoData.ciclosCompletados = (progresoData.ciclosCompletados || 0) + 1;
                progresoData.estadisticas.ultimoCicloCompletado = new Date().toISOString();
                guardarProgresoEnLocalStorage(progresoData);
            }
            
            // Guardar cambios
            localStorage.setItem('smartTrainer_rutinaActual', JSON.stringify(rutinaData));
            
            alert(`¡Rutina reiniciada! 🔄\n\nAhora puedes comenzar nuevamente desde el Día 1.\n\n¡A por esos nuevos récords! 💪`);
            
            // Recargar para actualizar la interfaz
            location.reload();
        }
        return;
    }
    
    // Confirmar completar día actual (para días que no son el último)
    const confirmar = confirm(`¿Marcar el Día ${diaActual} como completado?\n\n✅ Desbloquearás el Día ${diaActual + 1}\n📊 Tu progreso se actualizará\n\n¿Continuar?`);
    
    if (confirmar) {
        // Avanzar al siguiente día
        rutinaData.progreso.diaActual = diaActual + 1;
        rutinaData.progreso.sesionesCompletadas = diaActual;
        rutinaData.progreso.porcentajeCompletado = Math.round((diaActual / totalDias) * 100);
        rutinaData.progreso.proximaSesion = `Día ${diaActual + 1}`;
        
        // Agregar día a la lista de días completados
        if (!rutinaData.progreso.diasCompletados) {
            rutinaData.progreso.diasCompletados = [];
        }
        rutinaData.progreso.diasCompletados.push(diaActual);
        
        rutinaData.fechaModificacion = new Date().toISOString();
        
        // Guardar cambios
        localStorage.setItem('smartTrainer_rutinaActual', JSON.stringify(rutinaData));
        
        // Mostrar mensaje de éxito
        alert(`¡Día ${diaActual} completado! 🎉\n\n✅ Día ${diaActual + 1} desbloqueado\n📊 Progreso actual: ${rutinaData.progreso.porcentajeCompletado}%\n\n¡Sigue así! 💪`);
        
        // Recargar para actualizar la interfaz
        location.reload();
    }
}

// ===== PROGRESO VISUAL =====

function actualizarProgresoDiaActual() {
    const rutinaData = cargarRutinaDesdeLocalStorage();
    if (!rutinaData) return;
    
    const diaActual = rutinaData.progreso.diaActual;
    const ejerciciosDelDia = currentSessionExercises.filter(e => e.dia === diaActual);
    const ejerciciosCompletados = ejerciciosDelDia.filter(e => 
        e.sets.every(set => set.completado)
    ).length;
    
    const progresoTexto = `${ejerciciosCompletados}/${ejerciciosDelDia.length} ejercicios trackeados`;
    
    // Actualizar el texto del botón
    const completeDayBtn = document.getElementById('completeDayBtn');
    if (completeDayBtn) {
        if (diaActual === rutinaData.progreso.totalSesiones) {
            completeDayBtn.innerHTML = `<i class="fas fa-trophy"></i> Completar Último Día`;
            completeDayBtn.style.backgroundColor = '#4CAF50';
        } else {
            completeDayBtn.innerHTML = `<i class="fas fa-flag-checkered"></i> Completar Día ${diaActual}`;
            completeDayBtn.style.backgroundColor = '';
        }
        
        // Agregar tooltip o texto de progreso
        const progressText = document.createElement('div');
        progressText.style.marginTop = '0.5rem';
        progressText.style.fontSize = '0.9rem';
        progressText.style.opacity = '0.8';
        progressText.textContent = progresoTexto;
        
        // Remover texto anterior si existe
        const existingText = completeDayBtn.parentNode.querySelector('.day-progress-text');
        if (existingText) {
            existingText.remove();
        }
        
        progressText.className = 'day-progress-text';
        completeDayBtn.parentNode.appendChild(progressText);
    }
}

function actualizarProgresoRutina() {
    const rutinaData = cargarRutinaDesdeLocalStorage();
    
    if (rutinaData && rutinaData.progreso) {
        // Actualizar elementos DOM
        const completedSessions = document.getElementById('completedSessions');
        const routineProgress = document.getElementById('routineProgress');
        const nextSession = document.getElementById('nextSession');
        
        if (completedSessions) {
            completedSessions.textContent = `${rutinaData.progreso.sesionesCompletadas}/${rutinaData.progreso.totalSesiones}`;
        }
        
        if (routineProgress) {
            routineProgress.textContent = `${rutinaData.progreso.porcentajeCompletado}%`;
        }
        
        if (nextSession) {
            nextSession.textContent = `Día ${rutinaData.progreso.diaActual}`;
        }
    }
}

// ===== FUNCIONES DE PROGRESO VISUAL =====

function mostrarProgresoRutina() {
    const progressHTML = `
        <div class="spinner"></div>
        <div class="progress-steps">
            <div class="progress-bar">
                <div class="progress-fill" id="routineProgressFill"></div>
            </div>
            <div class="progress-step">
                <div class="step-number active" id="step1">1</div>
                <div class="step-label">Analizando</div>
            </div>
            <div class="progress-step">
                <div class="step-number" id="step2">2</div>
                <div class="step-label">Conectando</div>
            </div>
            <div class="progress-step">
                <div class="step-number" id="step3">3</div>
                <div class="step-label">Generando</div>
            </div>
            <div class="progress-step">
                <div class="step-number" id="step4">4</div>
                <div class="step-label">Completado</div>
            </div>
        </div>
        <div class="status-message" id="routineStatus">Iniciando generación de rutina...</div>
        <div class="time-indicator" id="routineTimeIndicator">Tiempo estimado: 20-40 segundos</div>
        <div class="generation-time" id="routineGenerationTime" style="display: none;"></div>
    `;
    
    routineLoading.innerHTML = progressHTML;
}

function actualizarPasoRutina(paso, mensaje) {
    // Actualizar números de paso
    for (let i = 1; i <= 4; i++) {
        const stepElement = document.getElementById(`step${i}`);
        if (stepElement) {
            if (i < paso) {
                stepElement.className = 'step-number completed';
            } else if (i === paso) {
                stepElement.className = 'step-number active';
            } else {
                stepElement.className = 'step-number';
            }
        }
    }
    
    // Actualizar barra de progreso
    const progressFill = document.getElementById('routineProgressFill');
    if (progressFill) {
        const progressPercentage = ((paso - 1) / 3) * 100;
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Actualizar mensaje
    const statusMessage = document.getElementById('routineStatus');
    if (statusMessage) {
        statusMessage.innerHTML = `${mensaje} <span class="dots"></span>`;
    }
    
    // Actualizar tiempo estimado
    const timeIndicator = document.getElementById('routineTimeIndicator');
    if (timeIndicator) {
        const tiempos = [
            "Tiempo estimado: 20-40 segundos",
            "Conectando con la IA...",
            "Generando tu rutina personalizada...",
            "¡Completado! Procesando resultados..."
        ];
        timeIndicator.textContent = tiempos[paso - 1] || tiempos[0];
    }
}

function startGenerationTimer() {
    let seconds = 0;
    generationTimer = setInterval(() => {
        seconds++;
        const timeIndicator = document.getElementById('routineTimeIndicator');
        if (timeIndicator) {
            timeIndicator.textContent = `Tiempo transcurrido: ${seconds} segundos`;
        }
    }, 1000);
}

function mostrarTiempoRealRutina(seconds) {
    const generationTime = document.getElementById('routineGenerationTime');
    if (generationTime) {
        generationTime.style.display = 'block';
        generationTime.innerHTML = `
            <strong>⏱️ Tiempo real de generación:</strong> ${seconds.toFixed(1)} segundos
            <br><small>${seconds < 20 ? '⚡ Rápido' : seconds < 35 ? '✅ Normal' : '🐢 Lento (servidor ocupado)'}</small>
        `;
    }
}

// ===== FUNCIONES AUXILIARES =====

function marcarSesionCompletada() {
    const rutinaData = cargarRutinaDesdeLocalStorage();
    
    if (rutinaData && rutinaData.progreso) {
        rutinaData.progreso.sesionesCompletadas += 1;
        
        // Calcular nuevo porcentaje
        const nuevoPorcentaje = Math.round(
            (rutinaData.progreso.sesionesCompletadas / rutinaData.progreso.totalSesiones) * 100
        );
        rutinaData.progreso.porcentajeCompletado = nuevoPorcentaje;
        
        // Determinar próxima sesión
        const siguienteDia = rutinaData.progreso.sesionesCompletadas + 1;
        rutinaData.progreso.proximaSesion = siguienteDia <= rutinaData.progreso.totalSesiones 
            ? `Día ${siguienteDia}` 
            : '¡Rutina Completada!';
        
        rutinaData.fechaModificacion = new Date().toISOString();
        
        // Guardar cambios
        localStorage.setItem('smartTrainer_rutinaActual', JSON.stringify(rutinaData));
        
        // Actualizar UI
        actualizarProgresoRutina();
        
        console.log('✅ Sesión marcada como completada');
        return true;
    }
    return false;
}

function eliminarRutinaGuardada() {
    if (confirm('¿Estás seguro de que quieres eliminar tu rutina actual? Se perderá todo el progreso.')) {
        localStorage.removeItem('smartTrainer_rutinaActual');
        localStorage.removeItem('smartTrainer_progreso');
        alert('Rutina eliminada correctamente.');
        location.reload();
    }
}

// ===== INICIALIZACIÓN =====

function inicializarRutina() {
    const rutinaData = cargarRutinaDesdeLocalStorage();
    
    if (rutinaData) {
        console.log('🔄 Cargando rutina guardada...');
        
        currentRoutine = rutinaData.html;
        routineContent.innerHTML = rutinaData.html;
        
        setTimeout(() => {
            procesarEjerciciosParaTracker();
        }, 500);
        
        currentRoutineSection.style.display = 'block';
        routineGeneratorSection.style.display = 'none';
        
        actualizarProgresoRutina();
        
        console.log('✅ Rutina cargada desde localStorage');
    } else {
        console.log('ℹ️ No hay rutina guardada, mostrando generador');
        currentRoutineSection.style.display = 'none';
        routineGeneratorSection.style.display = 'block';
    }
}

// ===== EVENT LISTENERS =====

// Event Listeners para el modal
closeModalBtn.addEventListener('click', () => {
    exerciseTrackerModal.style.display = 'none';
});

saveSetsBtn.addEventListener('click', guardarProgresoEjercicio);

completeExerciseBtn.addEventListener('click', completarEjercicio);

exerciseTrackerModal.addEventListener('click', (e) => {
    if (e.target === exerciseTrackerModal) {
        exerciseTrackerModal.style.display = 'none';
    }
});

// Completar día actual
completeDayBtn.addEventListener('click', completarDiaActual);

// Eliminar rutina
eliminarRutinaBtn.addEventListener('click', eliminarRutinaGuardada);

// Exportar PDF
exportPdfBtn.addEventListener('click', () => {
    if (!currentRoutine) {
        alert('No hay rutina para exportar');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.setTextColor(255, 204, 0);
        doc.text('Smart Trainer - Rutina de Entrenamiento', 20, 20);
        
        doc.setDrawColor(255, 204, 0);
        doc.line(20, 25, 190, 25);
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const routineText = routineContent.innerText || routineContent.textContent;
        const splitText = doc.splitTextToSize(routineText, 170);
        
        let yPosition = 35;
        let page = 1;
        
        for (let i = 0; i < splitText.length; i++) {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
                page++;
            }
            doc.text(splitText[i], 20, yPosition);
            yPosition += 7;
        }
        
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generado por Smart Trainer - ${new Date().toLocaleDateString()} - Página ${page}`, 20, 285);
        
        doc.save(`rutina-entrenamiento-${new Date().toISOString().split('T')[0]}.pdf`);
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
});

// Regenerar rutina
regenerateRoutineBtn.addEventListener('click', () => {
    currentRoutineSection.style.display = 'none';
    routineGeneratorSection.style.display = 'block';
    routineGeneratorSection.scrollIntoView({ behavior: 'smooth' });
});

// Iniciar sesión de entrenamiento
startSessionBtn.addEventListener('click', () => {
    sessionTrackerSection.style.display = 'block';
    sessionTrackerSection.scrollIntoView({ behavior: 'smooth' });
});

// Completar sesión
completeSessionBtn.addEventListener('click', () => {
    if (marcarSesionCompletada()) {
        alert('¡Sesión completada! Buen trabajo 💪\nProgreso actualizado.');
        sessionTrackerSection.style.display = 'none';
        
        const rutinaData = cargarRutinaDesdeLocalStorage();
        if (rutinaData) {
            alert(`📊 Progreso Actual:\nSesiones completadas: ${rutinaData.progreso.sesionesCompletadas}/${rutinaData.progreso.totalSesiones}\nProgreso total: ${rutinaData.progreso.porcentajeCompletado}%`);
        }
    } else {
        alert('Error al actualizar el progreso. No hay rutina guardada.');
    }
});

// Validación de campos numéricos
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('blur', (e) => {
        const value = parseInt(e.target.value);
        const min = parseInt(e.target.min);
        const max = parseInt(e.target.max);
        
        if (!isNaN(value)) {
            if (value < min) {
                e.target.value = min;
            } else if (value > max) {
                e.target.value = max;
            }
        }
    });
});

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Entrenamientos.js cargado correctamente');
    console.log('🚀 Sistema listo para generar rutinas personalizadas con DeepSeek AI');
    
    inicializarRutina();
});