// Datos de las sucursales 24/7 Fitness Ensenada
const gymsData = [
    {
        id: 1,
        name: "24/7 Fitness Encinos",
        address: "Blvd. Lázaro Cárdenas 2090, Lomas de Encinos, 22890 Ensenada, B.C.",
        lat: 31.9102006,
        lng: -116.5976744,
        phone: "+52 646 123 4567",
        hours: "Abierto 24/7",
        rating: 4.8,
        services: ["Pesas Libres", "Cardio", "Clases Grupales", "Estacionamiento", "Lockers"],
        isOpen: true,
        description: "Sucursal moderna con equipamiento de última generación y amplia zona de pesas libres."
    },
    {
        id: 2,
        name: "24/7 Fitness Centro",
        address: "Av. Reforma 123, Centro, 22800 Ensenada, B.C.",
        lat: 31.8677369,
        lng: -116.6217673,
        phone: "+52 646 234 5678",
        hours: "Abierto 24/7",
        rating: 4.6,
        services: ["Pesas Libres", "Cardio", "Área Funcional", "Vestidores", "Wi-Fi"],
        isOpen: true,
        description: "Ubicación céntrica ideal para entrenar antes o después del trabajo."
    },
    {
        id: 3,
        name: "24/7 Fitness Santa Lucía",
        address: "Blvd. Costero 456, Santa Lucía, 22890 Ensenada, B.C.",
        lat: 31.8158325,
        lng: -116.5954465,
        phone: "+52 646 345 6789",
        hours: "Abierto 24/7",
        rating: 4.9,
        services: ["Pesas Libres", "Cardio", "Piscina", "Sauna", "Estacionamiento"],
        isOpen: true,
        description: "Sucursal premium con piscina y áreas de recuperación."
    }
];

// Variables globales
let map;
let userLocation = null;
let markers = [];
let currentNearestGym = null;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializeMap();
    loadGymsData();
});

// Inicializar la aplicación
function initializeApp() {
    initializeHamburgerMenu();
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de ubicación
    document.getElementById('locateMe').addEventListener('click', locateUser);
    
    // Botón de actualizar
    document.getElementById('refreshMap').addEventListener('click', refreshMap);
    
    // Búsqueda de gimnasios
    document.getElementById('gymSearch').addEventListener('input', filterGyms);
}

// Inicializar menú hamburguesa
function initializeHamburgerMenu() {
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

// Inicializar mapa
function initializeMap() {
    // Centrar mapa en Ensenada
    map = L.map('gymMap').setView([31.865, -116.605], 12);

    // Capa del mapa - ESTILO CLARO Y AMIGABLE
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 20
    }).addTo(map);
}

// Cargar datos de gimnasios
function loadGymsData() {
    addGymsToMap();
    updateGymsList();
    updateGymCards();
}

// Agregar gimnasios al mapa
function addGymsToMap() {
    gymsData.forEach(gym => {
        // Crear marcador personalizado con color amarillo
        const marker = L.marker([gym.lat, gym.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: '🏋️',
                iconSize: [35, 35],
                iconAnchor: [17, 35]
            })
        }).addTo(map);

        // Popup del marcador
        marker.bindPopup(`
            <div class="popup-content" style="color: #333; font-family: Arial, sans-serif;">
                <h3 style="color: #ffcc00; margin: 0 0 10px 0;">${gym.name}</h3>
                <p style="margin: 5px 0;"><strong>📍</strong> ${gym.address}</p>
                <p style="margin: 5px 0;"><strong>📞</strong> ${gym.phone}</p>
                <p style="margin: 5px 0;"><strong>⏰</strong> ${gym.hours}</p>
                <p style="margin: 5px 0;"><strong>⭐</strong> ${gym.rating}/5</p>
                <div style="margin-top: 10px;">
                    <strong>🏋️ Servicios:</strong><br>
                    ${gym.services.join(', ')}
                </div>
            </div>
        `);

        markers.push({
            marker: marker,
            gym: gym
        });

        // Evento click en marcador
        marker.on('click', function() {
            highlightGymInList(gym.id);
            showGymDetails(gym.id);
        });
    });

    // Ajustar vista para mostrar todos los marcadores
    const group = new L.featureGroup(markers.map(m => m.marker));
    map.fitBounds(group.getBounds().pad(0.1));
}

// Actualizar lista de gimnasios
function updateGymsList() {
    const gymList = document.getElementById('gymList');
    
    gymList.innerHTML = gymsData.map(gym => `
        <div class="gym-item" data-gym-id="${gym.id}" onclick="showGymDetails(${gym.id})">
            <div class="gym-item-header">
                <div class="gym-name">${gym.name}</div>
                <div class="gym-distance" id="distance-${gym.id}">-- km</div>
            </div>
            <div class="gym-address">${gym.address}</div>
            <div class="gym-hours ${gym.isOpen ? 'open' : 'closed'}">
                <i class="fas fa-clock"></i>
                ${gym.isOpen ? 'Abierto 24/7' : 'Cerrado'}
            </div>
        </div>
    `).join('');
}

// Actualizar tarjetas de gimnasios
function updateGymCards() {
    const gymCards = document.getElementById('gymCards');
    
    gymCards.innerHTML = gymsData.map(gym => `
        <div class="gym-card">
            <div class="gym-card-header">
                <div>
                    <h3 class="gym-card-title">${gym.name}</h3>
                    <p class="gym-address">${gym.address}</p>
                </div>
                <div class="gym-card-rating">
                    <i class="fas fa-star"></i>
                    ${gym.rating}
                </div>
            </div>
            <div class="gym-card-info">
                <div class="info-item">
                    <i class="fas fa-phone"></i>
                    <span>${gym.phone}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${gym.hours}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-info-circle"></i>
                    <span>${gym.description}</span>
                </div>
            </div>
            <div class="gym-services">
                ${gym.services.map(service => `
                    <span class="service-tag">${service}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Localizar usuario
function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Agregar marcador de usuario
                L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.divIcon({
                        className: 'custom-marker user-location',
                        html: '📍',
                        iconSize: [30, 30],
                        iconAnchor: [15, 30]
                    })
                }).addTo(map).bindPopup('Tu ubicación actual').openPopup();
                
                // Calcular distancias y encontrar gimnasio más cercano
                calculateDistances();
                
                showNotification('Ubicación detectada correctamente', 'success');
            },
            error => {
                console.error('Error obteniendo ubicación:', error);
                showNotification('No se pudo obtener tu ubicación', 'error');
                
                // Usar ubicación por defecto (centro de Ensenada)
                userLocation = { lat: 31.865, lng: -116.605 };
                calculateDistances();
            }
        );
    } else {
        showNotification('La geolocalización no es soportada por tu navegador', 'error');
        userLocation = { lat: 31.865, lng: -116.605 };
        calculateDistances();
    }
}

// Calcular distancias
function calculateDistances() {
    if (!userLocation) return;
    
    let nearestGym = null;
    let shortestDistance = Infinity;
    
    gymsData.forEach(gym => {
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            gym.lat, gym.lng
        );
        
        // Actualizar distancia en la lista
        const distanceElement = document.getElementById(`distance-${gym.id}`);
        if (distanceElement) {
            distanceElement.textContent = `${distance.toFixed(1)} km`;
        }
        
        // Encontrar gimnasio más cercano
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestGym = gym;
        }
    });
    
    // Actualizar UI con gimnasio más cercano
    if (nearestGym) {
        currentNearestGym = nearestGym;
        document.getElementById('nearestGym').textContent = nearestGym.name;
        document.getElementById('distance').textContent = `${shortestDistance.toFixed(1)} km`;
        
        // Resaltar marcador del gimnasio más cercano
        highlightNearestGym(nearestGym.id);
    }
}

// Calcular distancia entre dos puntos (fórmula Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Resaltar gimnasio más cercano
function highlightNearestGym(gymId) {
    // Resetear todos los marcadores
    markers.forEach(m => {
        m.marker._icon.className = m.marker._icon.className.replace(' nearest', '');
    });
    
    // Resaltar marcador más cercano
    const nearestMarker = markers.find(m => m.gym.id === gymId);
    if (nearestMarker) {
        nearestMarker.marker._icon.className += ' nearest';
    }
}

// Mostrar detalles del gimnasio
function showGymDetails(gymId) {
    const gym = gymsData.find(g => g.id === gymId);
    if (!gym) return;
    
    // Resaltar en la lista
    highlightGymInList(gymId);
    
    // Centrar mapa en el gimnasio
    map.setView([gym.lat, gym.lng], 15);
    
    // Abrir popup del marcador
    const marker = markers.find(m => m.gym.id === gymId);
    if (marker) {
        marker.marker.openPopup();
    }
}

// Resaltar gimnasio en la lista
function highlightGymInList(gymId) {
    // Remover clase active de todos los items
    document.querySelectorAll('.gym-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar clase active al item seleccionado
    const gymItem = document.querySelector(`.gym-item[data-gym-id="${gymId}"]`);
    if (gymItem) {
        gymItem.classList.add('active');
    }
}

// Filtrar gimnasios
function filterGyms() {
    const searchTerm = document.getElementById('gymSearch').value.toLowerCase();
    const gymItems = document.querySelectorAll('.gym-item');
    
    gymItems.forEach(item => {
        const gymName = item.querySelector('.gym-name').textContent.toLowerCase();
        const gymAddress = item.querySelector('.gym-address').textContent.toLowerCase();
        
        if (gymName.includes(searchTerm) || gymAddress.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Actualizar mapa
function refreshMap() {
    map.invalidateSize();
    showNotification('Mapa actualizado', 'success');
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Estilos para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#ffcc00'};
        color: ${type === 'success' ? 'white' : 'black'};
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#388E3C' : type === 'error' ? '#D32F2F' : '#e6b800'};
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
    
    // Cerrar al hacer click
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// Agregar estilos CSS para las animaciones de notificación
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ comunidad.js cargado - Mapa de 24/7 Fitness Ensenada listo');