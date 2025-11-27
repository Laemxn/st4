// Configuración de la API DeepSeek
const DEEPSEEK_API_KEY = 'sk-ec85d3a0cead48699d9f0f21b7142a9e';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Elementos DOM
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navMenu = document.querySelector('.nav-menu');
const dietForm = document.getElementById('dietForm');
const generateBtn = document.getElementById('generateBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const dietPlan = document.getElementById('dietPlan');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const newDietBtn = document.getElementById('newDietBtn');

// Variables de tiempo
let startTime;
let generationTimer;

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

// Generación de Dieta con IA REAL
dietForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // MEJOR FEEDBACK VISUAL
    generateBtn.disabled = true;
    loadingIndicator.style.display = 'block';
    generateBtn.textContent = 'Generando con IA...';
    
    // Iniciar temporizador
    startTime = Date.now();
    startGenerationTimer();
    
    // Crear y mostrar progreso
    mostrarProgreso();
    actualizarPaso(1, "Validando información del formulario...");
    
    const formData = {
        peso: document.getElementById('peso').value,
        estatura: document.getElementById('estatura').value,
        edad: document.getElementById('edad').value,
        genero: document.querySelector('input[name="genero"]:checked').value,
        objetivo: document.getElementById('objetivo').value,
        actividad: document.getElementById('actividad').value,
        preferencias: document.getElementById('preferencias').value
    };
    
    try {
        console.log('🚀 Iniciando generación de dieta...');
        
        // Paso 1: Validación de datos
        actualizarPaso(1, "Validando información...");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Paso 2: Conectando con IA
        actualizarPaso(2, "Conectando con DeepSeek AI...");
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Paso 3: Generando dieta
        actualizarPaso(3, "La IA está creando tu plan personalizado...");
        
        const dietaGenerada = await generarDietaConIA(formData);
        const endTime = Date.now();
        const generationTime = (endTime - startTime) / 1000;
        
        // Detener temporizador
        clearInterval(generationTimer);
        
        // Paso 4: Completado
        actualizarPaso(4, `¡Plan generado con éxito!`);
        
        // Mostrar tiempo real de generación
        mostrarTiempoReal(generationTime);
        
        console.log(`✅ Dieta generada en ${generationTime.toFixed(1)} segundos`);
        
        // Mostrar resultados
        if (dietaGenerada) {
            dietPlan.innerHTML = dietaGenerada;
        } else {
            dietPlan.innerHTML = '<p>Error: No se pudo generar el contenido. Intenta nuevamente.</p>';
        }
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        clearInterval(generationTimer);
        actualizarPaso(0, `Error: ${error.message}`);
        alert('Error al generar la dieta: ' + error.message);
    } finally {
        generateBtn.disabled = false;
        loadingIndicator.style.display = 'none';
        generateBtn.textContent = 'Generar Mi Dieta Personalizada';
    }
});

// Función REAL para generar dieta con IA DeepSeek
async function generarDietaConIA(datos) {
    console.log('Datos del usuario:', datos);

    // Validar API Key
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.includes('tu_api_key')) {
        throw new Error('API Key no configurada correctamente');
    }

    // Mapear valores a texto más descriptivo
    const objetivosMap = {
        'perder_peso': 'Pérdida de peso',
        'ganar_masa_muscular': 'Ganancia de masa muscular',
        'mantener_peso': 'Mantenimiento de peso',
        'definicion_muscular': 'Definición muscular',
        'mejorar_salud': 'Mejora de salud general',
        'aumentar_energia': 'Aumento de energía'
    };

    const actividadMap = {
        'sedentario': 'Sedentario (poco o ningún ejercicio)',
        'ligero': 'Ligero (ejercicio 1-3 días/semana)',
        'moderado': 'Moderado (ejercicio 3-5 días/semana)',
        'activo': 'Activo (ejercicio 6-7 días/semana)',
        'muy_activo': 'Muy activo (ejercicio intenso diario)'
    };

    const prompt = `Eres un nutricionista deportivo certificado. Genera un plan de alimentación COMPLETAMENTE PERSONALIZADO y 100% ÚNICO basado en estos datos específicos:

**INFORMACIÓN DEL PACIENTE:**
- Edad: ${datos.edad} años
- Género: ${datos.genero}
- Peso: ${datos.peso} kg
- Estatura: ${datos.estatura} cm
- Objetivo principal: ${objetivosMap[datos.objetivo]}
- Nivel de actividad física: ${actividadMap[datos.actividad]}
- Preferencias alimenticias: ${datos.preferencias || 'Sin restricciones específicas'}

**REQUERIMIENTOS TÉCNICOS DEL PLAN:**
1. **CÁLCULO PRECISO:** Calcula las necesidades calóricas diarias basadas en la fórmula de Harris-Benedict ajustada por actividad
2. **MACRONUTRIENTES:** Distribuye proteínas, carbohidratos y grasas según el objetivo
3. **PLAN SEMANAL COMPLETO:** 7 días con desayuno, comida, cena y 2 snacks
4. **PRÁCTICO Y REALISTA:** Alimentos accesibles, preparaciones sencillas
5. **PERSONALIZACIÓN TOTAL:** Considera edad, género, peso, estatura y objetivo específico

**ESTRUCTURA OBLIGATORIA (formato HTML):**

<div class="nutrition-profile">
<h3> Tu Perfil Nutricional Personalizado</h3>
<p><strong>Calorías diarias:</strong> [CÁLCULO EXACTO]</p>
<p><strong>Distribución de macronutrientes:</strong></p>
<ul>
<li>Proteínas: [X]g ([X]%) - [EXPLICACIÓN según objetivo]</li>
<li>Carbohidratos: [X]g ([X]%) - [EXPLICACIÓN según objetivo]</li>
<li>Grasas: [X]g ([X]%) - [EXPLICACIÓN según objetivo]</li>
</ul>
</div>

<div class="weekly-plan">
<h3>Plan Alimenticio Semanal</h3>
<h4>LUNES</h4>
<ul>
<li><strong>Desayuno (7:00 AM):</strong> [ALIMENTOS] - [CALORÍAS]</li>
<li><strong>Snack Mañana (10:30 AM):</strong> [ALIMENTOS] - [CALORÍAS]</li>
<li><strong>Comida (1:30 PM):</strong> [ALIMENTOS] - [CALORÍAS]</li>
<li><strong>Snack Tarde (5:00 PM):</strong> [ALIMENTOS] - [CALORÍAS]</li>
<li><strong>Cena (8:00 PM):</strong> [ALIMENTOS] - [CALORÍAS]</li>
</ul>
<h4>MARTES</h4>
<ul>
[... repetir para los 7 días ...]
</ul>
</div>

<div class="shopping-list">
<h3> Lista de Compras Semanal</h3>
<ul>
<li>[CANTIDAD] de [ALIMENTO]</li>
[... lista completa ...]
</ul>
</div>

<div class="recommendations">
<h3>Recomendaciones Específicas</h3>
<ul>
<li>[RECOMENDACIÓN personalizada 1]</li>
<li>[RECOMENDACIÓN personalizada 2]</li>
<li>[RECOMENDACIÓN personalizada 3]</li>
</ul>
</div>

**IMPORTANTE:**
- Los cálculos deben ser PRECISOS basados en los datos proporcionados
- Las porciones deben ser ESPECÍFICAS (gramos, unidades, tazas)
- Considera las preferencias alimenticias del usuario
- Incluye hidratación (agua recomendada por día)
- Sé detallado pero práctico

Responde SOLO con el plan en formato HTML, sin comentarios adicionales.`;

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

    // ✅ SOLUCIÓN - Procesar el HTML correctamente
let dietaHTML = data.choices[0].message.content;

// Limpiar y decodificar el HTML
dietaHTML = dietaHTML
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();

// Verificar que sea HTML válido
if (!dietaHTML.includes('<div') && !dietaHTML.includes('<h3') && !dietaHTML.includes('<ul')) {
    // Si no tiene etiquetas HTML, envolver en div
    dietaHTML = `<div class="diet-content">${dietaHTML.replace(/\n/g, '<br>')}</div>`;
}
    
    // Validar que la respuesta contiene contenido
    if (!dietaHTML || dietaHTML.trim().length < 100) {
        throw new Error('La IA no generó un plan completo. Intenta nuevamente.');
    }

    return dietaHTML;
}

// NUEVAS FUNCIONES DE FEEDBACK MEJORADO
function mostrarProgreso() {
    const progressHTML = `
        <div class="spinner"></div>
        <div class="progress-steps">
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-step">
                <div class="step-number active" id="step1">1</div>
                <div class="step-label">Validando</div>
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
        <div class="status-message" id="statusMessage">Iniciando generación de dieta...</div>
        <div class="time-indicator" id="timeIndicator">Tiempo estimado: 20-40 segundos</div>
        <div class="generation-time" id="generationTime" style="display: none;"></div>
    `;
    
    loadingIndicator.innerHTML = progressHTML;
}

function actualizarPaso(paso, mensaje) {
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
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        const progressPercentage = ((paso - 1) / 3) * 100;
        progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Actualizar mensaje
    const statusMessage = document.getElementById('statusMessage');
    if (statusMessage) {
        statusMessage.innerHTML = `${mensaje} <span class="dots"></span>`;
    }
    
    // Actualizar tiempo estimado
    const timeIndicator = document.getElementById('timeIndicator');
    if (timeIndicator) {
        const tiempos = [
            "Tiempo estimado: 20-40 segundos",
            "Conectando con la IA...",
            "Generando tu plan personalizado...",
            "¡Completado! Procesando resultados..."
        ];
        timeIndicator.textContent = tiempos[paso - 1] || tiempos[0];
    }
}

function startGenerationTimer() {
    let seconds = 0;
    generationTimer = setInterval(() => {
        seconds++;
        const timeIndicator = document.getElementById('timeIndicator');
        if (timeIndicator) {
            timeIndicator.textContent = `Tiempo transcurrido: ${seconds} segundos`;
        }
    }, 1000);
}

function mostrarTiempoReal(seconds) {
    const generationTime = document.getElementById('generationTime');
    if (generationTime) {
        generationTime.style.display = 'block';
        generationTime.innerHTML = `
            <strong>⏱️ Tiempo real de generación:</strong> ${seconds.toFixed(1)} segundos
            <br><small>${seconds < 20 ? '⚡ Rápido' : seconds < 35 ? '✅ Normal' : '🐢 Lento (servidor ocupado)'}</small>
        `;
    }
}

// Descargar PDF
downloadPdfBtn.addEventListener('click', () => {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(18);
        doc.setTextColor(255, 204, 0); // Amarillo
        doc.text('Smart Trainer - Plan de Nutrición', 20, 20);
        
        // Línea separadora
        doc.setDrawColor(255, 204, 0);
        doc.line(20, 25, 190, 25);
        
        // Contenido
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0); // Negro
        
        const dietContent = dietPlan.innerText || dietPlan.textContent;
        
        // Dividir el texto en páginas
        const splitText = doc.splitTextToSize(dietContent, 170);
        let yPosition = 35;
        let page = 1;
        
        for (let i = 0; i < splitText.length; i++) {
            if (yPosition > 270) { // Nueva página si se llega al final
                doc.addPage();
                yPosition = 20;
                page++;
            }
            doc.text(splitText[i], 20, yPosition);
            yPosition += 7;
        }
        
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generado por Smart Trainer - ${new Date().toLocaleDateString()} - Página ${page}`, 20, 285);
        
        doc.save(`dieta-smart-trainer-${new Date().toISOString().split('T')[0]}.pdf`);
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
});

// Nueva dieta
newDietBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    dietForm.reset();
    dietForm.scrollIntoView({ behavior: 'smooth' });
});

// ✅ CORRECCIÓN: Función de validación mejorada
document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('blur', (e) => {
        const value = parseInt(e.target.value);
        const min = parseInt(e.target.min);
        const max = parseInt(e.target.max);
        
        // Solo validar si el campo tiene un valor
        if (!isNaN(value)) {
            if (value < min) {
                e.target.value = min;
            } else if (value > max) {
                e.target.value = max;
            }
        }
    });
});

console.log('✅ Nutricion.js cargado correctamente - API Key configurada');
console.log('🚀 Sistema listo para generar dietas personalizadas con DeepSeek AI');